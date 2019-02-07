import api = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');
import { TwitterServerlessApplication } from './twitter';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'sam-ux-walkthrough');

const countTable = new dynamodb.Table(stack, 'CountTable', {
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.String
  }
});

const tweetProcessor = new lambda.Function(stack, 'TweetProcessor', {
  code: lambda.Code.asset('./processor'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810,
  environment: {
    tableName: countTable.tableName
  }
});
countTable.grantWriteData(tweetProcessor.role);

new TwitterServerlessApplication(stack, 'TwitterServerlessApplication', {
  searchText: '#serverless -filter:nativeretweets',
  tweetProcessorFunction: tweetProcessor
});

const endpoint = new lambda.Function(stack, 'ApiHandler', {
  code: lambda.Code.asset('./endpoint'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810,
  environment: {
    tableName: countTable.tableName
  }
});
countTable.grantReadData(endpoint.role);

const countApi = new api.LambdaRestApi(stack, 'CountApi', {
  handler: endpoint,
  proxy: false
});
// GET /count
countApi.root.addResource('count').addMethod('GET');

app.run();