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
    output = g.V().hasLabel('Instance').toList()
    return output
    #remoteConn.close()
    
def run_sample_gremlin_http():
    URL = 'https://' + CLUSTER_ENDPOINT + ":" + CLUSTER_PORT + '/gremlin'
    r = requests.post(URL,data='{"gremlin":"g.V().hasLabel(\'Instance\').valueMap().with_(\'~tinkerpop.valueMap.tokens\').toList()"}')
    return r

def get_all_vertex():
    vertices = g.V().count()
    print(vertices)

def insert_vertex_graph(vertex_id, vertex_label):
    node_exists_id =  g.V(str(vertex_id)).toList()
    if node_exists_id:
        return
    result = g.addV(str(vertex_label)).property(T.id, str(vertex_id)).next()

def insert_edge_graph(edge_id, edge_from, edge_to, to_vertex_label, edge_label):
    insert_vertex_graph(edge_to, to_vertex_label)

    edge_exists_id =  g.E(str(edge_id)).toList()
    if edge_exists_id:
        return

    result = g.V(str(edge_from)).addE(str(edge_label)).to(__.V(str(edge_to))).property(T.id, str(edge_id)).next()

def parse_vertex_info(vertex_input):
    
    # Vertex needs to have an id and a label before it can be inserted in Neptune
    # id for the vertex, required field
    id = vertex_input['resourceId']
    
    # label for the vertex, required field
    label = vertex_input['resourceType']

    itemStatus = vertex_input['configurationItemStatus']
    
    if itemStatus == "ResourceDeleted":
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
    itemStatus = edge_input['configurationItemStatus']
    
    if itemStatus == "ResourceDeleted":
        return;

    # Edge needs to have id, from, to and label before it can be inserted in the Neptune
    # Edge to is also a vertex
    for index, item in enumerate(edge_input['relationships']):
        
        # from vertex 
        from_vertex = edge_input['resourceId']
        
        # to vertex
        if "resourceId" in item:
             to_vertex = item['resourceId']
        if "resourceName" in item:
             to_vertex = item['resourceName']
        
        to_vertex_label = item['resourceType']
        
        # id is a concatenation of from and to, which makes it unique
        id = from_vertex + ':' + to_vertex
        
        # label is the relationship
        label = item['name']
        insert_edge_graph(id, from_vertex, to_vertex, to_vertex_label, label)

def lambda_handler(event, context):
    #print(event['tasks'][0]['s3BucketArn'])
    #print(event['tasks'][0]['s3Key'])
    

    # Check the event source is S3 or the S3 Batch job
    if ('Records' in event and event['Records'][0]['eventSource'] == "aws:s3"):
         if (event['Records'][0]['s3'] and event['Records'][0]['s3']['bucket'] and event['Records'][0]['s3']['bucket']['name']):
             bucket = event['Records'][0]['s3']['bucket']['name']
             if (event['Records'][0]['s3'] and event['Records'][0]['s3']['object'] and event['Records'][0]['s3']['object']['key']):
                 object = event['Records'][0]['s3']['object']['key']
    elif ('tasks' in event and event['tasks'][0]['s3BucketArn']):
         bucket = event['tasks'][0]['s3BucketArn'].split(':::')[1]
         if (event['tasks'][0]['s3Key']):
             object = event['tasks'][0]['s3Key']
    
    # Use below for quick testing by passing the variables directly     
    #bucket = event['tasks'][0]['s3BucketArn']
    #object = event['tasks'][0]['s3Key']
    s3 = boto3.resource("s3")
    if (object.endswith('.gz')):
        obj = s3.Object(bucket, urllib.parse.unquote(object))
        with gzip.GzipFile(fileobj=obj.get()["Body"]) as gzipfile:
            content = json.loads(gzipfile.read())
    
        for index, item in enumerate(content['configurationItems']):
             parse_vertex_info(item)
             parse_edge_info(item)

    #get_all_vertex()
    
    return {
        "statusCode": 200,
         "body": json.dumps('Hello from Lambda! Real Test')
    }

