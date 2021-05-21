from __future__  import print_function
import boto3
import json
import os, sys
from io import BytesIO
import gzip
from gremlin_python import statics
from gremlin_python.structure.graph import Graph
from gremlin_python.process.graph_traversal import __
from gremlin_python.process.strategies import *
from gremlin_python.driver.driver_remote_connection import DriverRemoteConnection
from gremlin_python.process.traversal import T
import requests
import urllib.parse

CLUSTER_ENDPOINT = os.environ['CLUSTER_ENDPOINT']
CLUSTER_PORT = os.environ['CLUSTER_PORT']

# Make the remote connection to Neptune outside for resuse across invocations
remoteConn = DriverRemoteConnection('wss://' + CLUSTER_ENDPOINT + ":" + CLUSTER_PORT + '/gremlin','g',)
graph = Graph()
g = graph.traversal().withRemote(remoteConn)

def run_sample_gremlin_websocket():
    print('running sample gremlin websocket code')
    output = g.V().hasLabel('Instance').toList()
    return output
    #remoteConn.close()
    
def run_sample_gremlin_http():
    print('running sample gremlin http code')
    URL = 'https://' + CLUSTER_ENDPOINT + ":" + CLUSTER_PORT + '/gremlin'
    r = requests.post(URL,data='{"gremlin":"g.V().hasLabel(\'Instance\').valueMap().with_(\'~tinkerpop.valueMap.tokens\').toList()"}')
    print(r.text)
    return r

def get_all_vertex():
    print('Entered get_all_vertex: ')
    vertices = g.V().count()
    print(vertices)

def insert_vertex_graph(vertex_id, vertex_label):
    print('Entered insert_vertex_graph: ')
    print(str(vertex_id) + ':' + str(vertex_label))

    node_exists_id =  g.V(str(vertex_id)).toList()
    if node_exists_id:
        return
    result = g.addV(str(vertex_label)).property(T.id, str(vertex_id)).next()
    print(result)

def insert_edge_graph(edge_id, edge_from, edge_to, to_vertex_label, edge_label):
    print('Entered insert_edge_graph: ')
    print(str(edge_id) + ':' + str(edge_from) + ':' + str(edge_to) + ':' + str(edge_label))

    insert_vertex_graph(edge_to, to_vertex_label)

    edge_exists_id =  g.E(str(edge_id)).toList()
    if edge_exists_id:
        return

    result = g.V(str(edge_from)).addE(str(edge_label)).to(g.V(str(edge_to))).property(T.id, str(edge_id)).next()
    print(result)

def parse_vertex_info(vertex_input):
    print('Entered parse_vertex_info: ')
    print(vertex_input)
    
    # Vertex needs to have an id and a label before it can be inserted in Neptune
    # id for the vertex, required field
    print('resourceId: ')
    id = vertex_input['resourceId']
    print(id)
    
    # label for the vertex, required field
    print('resourceType')
    label = vertex_input['resourceType']
    print(label)

    print('configurationItemStatus')
    itemStatus = vertex_input['configurationItemStatus']
    print(itemStatus)
    
    if itemStatus == "ResourceDeleted":
	    print("Resource has been deleted")
	    node_exists_id =  g.V(str(id)).toList()
	    if node_exists_id:
	        result = g.addV(str(itemStatus)).property(T.id, str(id)).next()
	        return;
	    else:
	        insert_vertex_graph(id, label)
	        result = g.addV(str(itemStatus)).property(T.id, str(id)).next()
	        return;

    insert_vertex_graph(id, label)  
    

def parse_edge_info(edge_input):
    print('Entered parse_edge_info: ')
    print(edge_input)
    
    itemStatus = edge_input['configurationItemStatus']
    print(itemStatus)
    
    if itemStatus == "ResourceDeleted":
        return;

    # Edge needs to have id, from, to and label before it can be inserted in the Neptune
    # Edge to is also a vertex
    for index, item in enumerate(edge_input['relationships']):
        print(item)
        
        # from vertex 
        from_vertex = edge_input['resourceId']
        print(from_vertex)
        
        # to vertex
        if "resourceId" in item:
             to_vertex = item['resourceId']
             print(to_vertex)
        if "resourceName" in item:
             to_vertex = item['resourceName']
             print(to_vertex)
        
        to_vertex_label = item['resourceType']
        print(to_vertex_label)
        
        # id is a concatenation of from and to, which makes it unique
        id = from_vertex + ':' + to_vertex
        print(id)
        
        # label is the relationship
        label = item['name']
        print(label)
        insert_edge_graph(id, from_vertex, to_vertex, to_vertex_label, label)

def lambda_handler(event, context):
    print("Entered the handler in the config_json_parser with event: ")
    print(event)
    #print(event['tasks'][0]['s3BucketArn'])
    #print(event['tasks'][0]['s3Key'])
    

    # Check the event source is S3 or the S3 Batch job
    if ('Records' in event and event['Records'][0]['eventSource'] == "aws:s3"):
         if (event['Records'][0]['s3'] and event['Records'][0]['s3']['bucket'] and event['Records'][0]['s3']['bucket']['name']):
             bucket = event['Records'][0]['s3']['bucket']['name']
             print(bucket)
             if (event['Records'][0]['s3'] and event['Records'][0]['s3']['object'] and event['Records'][0]['s3']['object']['key']):
                 object = event['Records'][0]['s3']['object']['key']
                 print(object)
    elif ('tasks' in event and event['tasks'][0]['s3BucketArn']):
         bucket = event['tasks'][0]['s3BucketArn'].split(':::')[1]
         print(bucket)
         if (event['tasks'][0]['s3Key']):
             object = event['tasks'][0]['s3Key']
             print(object)
    
    # Use below for quick testing by passing the variables directly     
    #bucket = event['tasks'][0]['s3BucketArn']
    #object = event['tasks'][0]['s3Key']
    #object = 'AWSLogs/963987974514/Config/eu-west-1/2020/4/18/ConfigHistory/963987974514_Config_eu-west-1_ConfigHistory_AWS%3A%3ALambda%3A%3AFunction_20200418T173320Z_20200418T190151Z_1.json.gz'
    s3 = boto3.resource("s3")
    if (object.endswith('.gz')):
        obj = s3.Object(bucket, urllib.parse.unquote(object))
        with gzip.GzipFile(fileobj=obj.get()["Body"]) as gzipfile:
            content = json.loads(gzipfile.read())
        print(content)
    
        for index, item in enumerate(content['configurationItems']):
             print(item)
             parse_vertex_info(item)
             parse_edge_info(item)

    #get_all_vertex()
    
    ## run gremlin query
    #if CLUSTER_ENDPOINT and CLUSTER_PORT:
    #    result = run_sample_gremlin_websocket()
    #    run_sample_gremlin_http()
    #    print(result)
    #else:
    #    print("provide CLUSTER_ENDPOINT and CLUSTER_PORT environment varibles")
    
    
    return {
        "statusCode": 200,
         "body": json.dumps('Hello from Lambda! Real Test')
    }

