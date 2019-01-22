import assets = require('@aws-cdk/assets');
import lambda = require('@aws-cdk/aws-lambda');
import eventSource = require('@aws-cdk/aws-lambda-event-sources');
import sns = require('@aws-cdk/aws-sns');
import cdk = require('@aws-cdk/cdk');
import path = require('path');

export class NotificationsProcessing extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Process data from a SNS topic
    const topic = new sns.Topic(this, 'Topic');
    const topicConsumer = new lambda.Function(this, 'TopicConsumer', {
      code: new lambda.AssetCode(path.join(__dirname, '..', 'handlers', 'sns-consumer.js'), assets.AssetPackaging.File),
      handler: 'index.js',
      runtime: lambda.Runtime.NodeJS810
    });
    topicConsumer.addEventSource(new eventSource.SnsEventSource(topic));
  }
}