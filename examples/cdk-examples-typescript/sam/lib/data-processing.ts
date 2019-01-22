import assets = require('@aws-cdk/assets');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import kinesis = require('@aws-cdk/aws-kinesis');
import lambda = require('@aws-cdk/aws-lambda');
import eventSource = require('@aws-cdk/aws-lambda-event-sources');
import sqs = require('@aws-cdk/aws-sqs');
import cdk = require('@aws-cdk/cdk');
import path = require('path');

export class RealTimeDataProcessing extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Process data in a Kinesis stream
    const stream = new kinesis.Stream(this, 'Stream');
    const streamConsumer = new lambda.Function(this, 'StreamConsumer', {
      code: new lambda.AssetCode(path.join(__dirname, '..', 'handlers', 'kinesis-consumer.js'), assets.AssetPackaging.File),
      handler: 'index.js',
      runtime: lambda.Runtime.NodeJS810
    });
    streamConsumer.addEventSource(new eventSource.KinesisEventSource(stream, {
      startingPosition: lambda.StartingPosition.TrimHorizon
    }));

    // Process data from a SQS queue
    const queue = new sqs.Queue(this, 'Queue');
    const queueConsumer = new lambda.Function(this, 'QueueConsumer', {
      code: new lambda.AssetCode(path.join(__dirname, '..', 'handlers', 'sqs-consumer.js'), assets.AssetPackaging.File),
      handler: 'index.js',
      runtime: lambda.Runtime.NodeJS810
    });
    queueConsumer.addEventSource(new eventSource.SqsEventSource(queue, {
      batchSize: 10
    }));

    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.String
      },
      streamSpecification: dynamodb.StreamViewType.NewImage
    });
    const dynamoConsumer = new lambda.Function(this, 'DynamoConsumer', {
      code: new lambda.AssetCode(path.join(__dirname, '..', 'handlers', 'dynamo-consumer.js'), assets.AssetPackaging.File),
      handler: 'index.js',
      runtime: lambda.Runtime.NodeJS810
    });
    dynamoConsumer.addEventSource(new eventSource.DynamoEventSource(table, {
      startingPosition: lambda.StartingPosition.TrimHorizon
    }));
  }
}