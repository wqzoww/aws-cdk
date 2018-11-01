import aws_cdk.cdk as cdk
import aws_cdk.aws_sqs as sqs


class CloudFormationExample(cdk.Stack):
    def __init__(self, parent: cdk.App, name: str, **kwargs):
        super().__init__(parent, name, **kwargs)

        sqs.cloudformation.QueueResource(self, "MyQueue", visibilityTimeout=300)


app = cdk.App()
CloudFormationExample(app, "CloudFormation")
app.run()
