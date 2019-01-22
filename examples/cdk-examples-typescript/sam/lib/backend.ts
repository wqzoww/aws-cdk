import assets = require('@aws-cdk/assets');
import apigateway = require('@aws-cdk/aws-apigateway');
import dynamodb = require('@aws-cdk/aws-dynamodb');
import lambda = require('@aws-cdk/aws-lambda');
import cdk = require('@aws-cdk/cdk');
import path = require('path');

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

    const table = new dynamodb.Table(this, 'Table', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.String
      }
    });

    const handler = new lambda.Function(this, 'Backend', {
      code: new lambda.AssetCode(path.join(__dirname, '..', 'handlers', 'cron.js'), assets.AssetPackaging.File),
      handler: 'index.js',
      runtime: lambda.Runtime.NodeJS810
    });
    table.grantReadWriteData(handler.role);

    const api = new apigateway.LambdaRestApi(this, 'Api', {
      handler,
      proxy: false
    });
    const users = api.root.addResource('users');
    const user = users.addResource('{userId}');

    users.addMethod('GET');
    users.addMethod('POST');
    user.addMethod('GET');
  }
}
