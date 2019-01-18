import cdk = require('@aws-cdk/cdk');

export function applicationNameToArn(applicationName: string, scope: cdk.IConstruct): string {
  return cdk.Stack.find(scope).formatArn({
    service: 'codedeploy',
    resource: 'application',
    resourceName: applicationName,
    sep: ':',
  });
}