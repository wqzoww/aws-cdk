import api = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');
import { TwitterServerlessApplication } from './twitter';

const app = new cdk.App();
const stack = new cdk.Stack(app, 'ux-walkthrough');

const countTable = new dynamodb.Table(stack, 'TweetCount', {
  partitionKey: {
    name: 'id',
    type: dynamodb.AttributeType.String
  }
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

const countApi = new api.LambdaRestApi(stack, 'Api', {
  handler: endpoint,
  proxy: false
});
// GET /count
countApi.root.addResource('count').addMethod('GET');

const twitterProcessor = new lambda.Function(stack, 'TwitterProcessor', {
  code: lambda.Code.asset('./processor'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810,
  environment: {
    tableName: countTable.tableName
  }
});
countTable.grantReadWriteData(twitterProcessor.role);

new TwitterServerlessApplication(stack, 'TwitterApplication', {
  searchText: '#serverless -filter:nativeretweets',
  tweetProcessorFunction: twitterProcessor,
  twitterApiCredentials: {
    consumerKey: '6Gmm4Xgx9z6SAwFZp5HDwqkwO',
    consumerSecret: 'VRPGh17ynmZhrq9LGzQ5mFOdV3VpzfNVFqEa1hcwTYmMl4JISb',
    accessToken: '1012060925627514880-kUk2wrC3fyAn1vDS5HsXKdfqwsVFLP',
    accessTokenSecret: 'egzX8VMEU6AOB4YD20qgpG3Av8I6YU9GsFmS851Liibeh',
  }
});

app.run();
