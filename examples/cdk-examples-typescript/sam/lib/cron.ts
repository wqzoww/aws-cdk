import assets = require('@aws-cdk/assets');
import events = require('@aws-cdk/aws-events');
import lambda = require('@aws-cdk/aws-lambda');
import sqs = require('@aws-cdk/aws-sqs');
import cdk = require('@aws-cdk/cdk');
import path = require('path');

/**
 * Example of scheduling a function to run on a schedule.
 *
 * Also shows how a dead letter queue and X-Ray tracing can be enabled.
 */
export class CronJob extends cdk.Stack {
  /*
  MISSING: Ability to encrypt environment variables.
  MISSING: ReservedConcurrentExecutions
  */
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const dlq = new sqs.Queue(this, 'DLQ');

    const func = new lambda.Function(this, 'Job', {
      code: new lambda.AssetCode(path.join(__dirname, '..', 'handlers', 'cron.js'), assets.AssetPackaging.File),
      handler: 'index.js',
      runtime: lambda.Runtime.NodeJS810,
      deadLetterQueue: dlq,
      tracing: lambda.Tracing.Active
    });

    new events.EventRule(this, 'Schedule', {
      scheduleExpression: 'rate(1 minute)',
      targets: [func]
    });
  }
}