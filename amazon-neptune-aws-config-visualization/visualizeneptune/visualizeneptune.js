const gremlin = require('gremlin');

exports.handler = async event => {
  const {DriverRemoteConnection} = gremlin.driver;
  const {Graph} = gremlin.structure;
  // Use wss:// for secure connections. See https://docs.aws.amazon.com/neptune/latest/userguide/access-graph-ssl.html
  const dc = new DriverRemoteConnection(
    `wss://${process.env.NEPTUNE_CLUSTER_ENDPOINT}:${process.env.NEPTUNE_PORT}/gremlin`,
    {mimeType: 'application/vnd.gremlin-v2.0+json'}
  );
  const graph = new Graph();
  const g = graph.traversal().withRemote(dc);
  const withTokens = '~tinkerpop.valueMap.tokens';

  try {
    let data = [];
    const {
      resource_id, resource_label
    } = event.queryStringParameters || {};

    if(event.pathParameters.proxy.match(/searchbyid/ig)) {
      data = await g.V().has('~id', resource_id)
        .limit(20)
        .valueMap()
        .with_(withTokens)
        .toList();
    } else if (event.pathParameters.proxy.match(/searchbylabel/ig)) {
      data = await g.V()
        .hasLabel(resource_label)
        .limit(1000)
        .valueMap()
        .with_(withTokens)
        .toList();
    } else if (event.pathParameters.proxy.match(/neighbours/ig)) {
      data[0] = await  g.V().has('~id', resource_id)
        .out()
        .valueMap()
        .with_(withTokens)
        .limit(10)
        .toList();
      data[1] = await g.V().has('~id', resource_id)
        .outE()
        .limit(20)
        .toList();
    }

    console.log(data);
    dc.close();
    return formatResponse(data);
  } catch (error) {
    console.log('ERROR', error);
    dc.close();
  }
};

const formatResponse = payload => {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
      'Access-Control-Max-Age': 2592000, // 30 days
      'Access-Control-Allow-Headers': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };
};
