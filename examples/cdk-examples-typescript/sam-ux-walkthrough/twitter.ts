import lambda = require('@aws-cdk/aws-lambda');
import serverless = require('@aws-cdk/aws-serverless');
import cdk = require('@aws-cdk/cdk');

export interface TwitterServerlessApplicationProps {
  searchText: string;
  tweetProcessorFunction: lambda.IFunction;
  batchSize?: number;
  streamModeEnabled?: boolean;
  pollingFrequencyMinutes?: number;
}

export class TwitterServerlessApplication extends cdk.Construct {
  private static readonly SsmPrefix = 'twitter-event-source';

  constructor(scope: cdk.Construct, id: string, props: TwitterServerlessApplicationProps) {
    super(scope, id);

    new serverless.CfnApplication(this, 'Resource', {
      location: {
        applicationId: 'arn:aws:serverlessrepo:us-east-1:077246666028:applications/aws-serverless-twitter-event-source',
        semanticVersion: '2.0.0'
      },
      parameters: {
        SearchText: props.searchText,
        TweetProcessorFunctionName: props.tweetProcessorFunction.functionName,
        SSMParameterPrefix: TwitterServerlessApplication.SsmPrefix,
        StreamModeEnabled: (props.streamModeEnabled === undefined ? undefined : props.streamModeEnabled.toString()),
        BatchSize: (props.batchSize === undefined ? undefined : props.batchSize.toString()),
        PollingFrequencyInMinutes: props.pollingFrequencyMinutes as any
      }
    });
  }
}
