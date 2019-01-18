import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import codedeploy = require('@aws-cdk/aws-codedeploy');
import events = require('@aws-cdk/aws-events');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');

const app = new cdk.App();
const stack = new cdk.Stack(app, 'sam');

const fn = new lambda.Function(stack, 'MyFunction', {
  code: lambda.Code.asset('lambda'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810
});
new events.EventRule(stack, 'Trigger', {
  scheduleExpression: 'rate(1 minute)',
  targets: [fn]
});

const preHook = new lambda.Function(stack, 'PreHook', {
  code: lambda.Code.asset('pre-hook'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810
});
const postHook = new lambda.Function(stack, 'PostHook', {
  code: lambda.Code.asset('post-hook'),
  handler: 'index.handler',
  runtime: lambda.Runtime.NodeJS810
});

const application = new codedeploy.LambdaApplication(stack, 'Deployment');
new codedeploy.LambdaDeploymentGroup(stack, 'Group', {
  application,
  lambda: fn,
  version: '8',
  trafficShiftingConfig: codedeploy.TrafficShiftConfig.Linear10PercentEvery1Minute,

  preHook,
  postHook,

  alarms: [
    new cloudwatch.Alarm(stack, 'Errors', {
      metric: fn.metricErrors(),
      threshold: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GreaterThanThreshold,
      evaluationPeriods: 1
    })
  ]
});

app.run();
