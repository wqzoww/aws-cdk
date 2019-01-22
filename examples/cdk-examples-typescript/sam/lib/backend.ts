import assets = require('@aws-cdk/assets');
import apigateway = require('@aws-cdk/aws-apigateway');
import cloudwatch = require('@aws-cdk/aws-cloudwatch');
import codedeploy = require('@aws-cdk/aws-codedeploy');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');

/**
 * Example of a web/mobile backend like you might see in SAM.
 */
export class WebMobileBackend extends cdk.Stack {
  /*
  Missing the ability to do elaborate authorizers like SAM:
Auth:
  DefaultAuthorizer: MyCognitoAuth # OPTIONAL
  Authorizers:
    MyCognitoAuth:
      UserPoolArn: !GetAtt MyCognitoUserPool.Arn # Can also accept an array
      Identity: # OPTIONAL
        Header: MyAuthorizationHeader # OPTIONAL; Default: 'Authorization'
        ValidationExpression: myauthvalidationexpression # OPTIONAL

    MyLambdaTokenAuth:
      FunctionPayloadType: TOKEN # OPTIONAL; Defaults to 'TOKEN' when `FunctionArn` is specified
      FunctionArn: !GetAtt MyAuthFunction.Arn
      FunctionInvokeRole: arn:aws:iam::123456789012:role/S3Access # OPTIONAL
      Identity:
        Header: MyCustomAuthHeader # OPTIONAL; Default: 'Authorization'
        ValidationExpression: mycustomauthexpression # OPTIONAL
        ReauthorizeEvery: 20 # OPTIONAL; Service Default: 300

    MyLambdaRequestAuth:
      FunctionPayloadType: REQUEST
      FunctionArn: !GetAtt MyAuthFunction.Arn
      FunctionInvokeRole: arn:aws:iam::123456789012:role/S3Access # OPTIONAL
      Identity:
        # Must specify at least one of Headers, QueryStrings, StageVariables, or Context
        Headers: # OPTIONAL
          - Authorization1
        QueryStrings: # OPTIONAL
          - Authorization2
        StageVariables: # OPTIONAL
          - Authorization3
        Context: # OPTIONAL
          - Authorization4
        ReauthorizeEvery: 0 # OPTIONAL; Service Default: 300
  */
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create the 'SimpleTable' and Function with read/write access
    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.String
      }
    });
    const handler = new lambda.Function(this, 'Backend', {
      code: lambda.Code.asset('../lambda/handler'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810,
      environment: {
        tableName: table.tableName
      }
    });
    table.grantReadWriteData(handler.role);

    // LambdaApplication boiler-plate: groups our functions together.
    const application = new codedeploy.LambdaApplication(this, 'Deployment');
    // Pre and Post hooks that run before/after traffic shifting.
    const preHook = new lambda.Function(this, 'PreHook', {
      code: lambda.Code.asset('../lambda/pre-hook'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810
    });
    const postHook = new lambda.Function(this, 'PostHook', {
      code: lambda.Code.asset('../lambda/post-hook'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NodeJS810
    });
    // Create a DeploymentGroup (one per function) and configure traffic shifting, hooks, alarms, etc.
    const deploymentGroup = new codedeploy.LambdaDeploymentGroup(this, 'Group', {
      application,
      lambda: handler,
      version: '8', // TODO: compute hash of code asset instead of hard-coding.
      trafficShiftingConfig: codedeploy.TrafficShiftConfig.Linear10PercentEvery1Minute,

      preHook,
      postHook,

      alarms: [
        new cloudwatch.Alarm(this, 'Errors', {
          metric: handler.metricErrors(),
          threshold: 1,
          comparisonOperator: cloudwatch.ComparisonOperator.GreaterThanThreshold,
          evaluationPeriods: 1
        })
      ]
    });

    // Create our REST API and point it at the versioned alias.
    // TODO: Create a wrapper-Function so developers aren't required to remember to use 'Alias'.
    const api = new apigateway.LambdaRestApi(this, 'Api', {
      handler: deploymentGroup.alias,
      proxy: false
    });
    const users = api.root.addResource('users');
    const user = users.addResource('{userId}');
    users.addMethod('GET');
    users.addMethod('POST');
    user.addMethod('GET');
  }
}
