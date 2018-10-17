import aws_cdk.cdk as cdk
import aws_cdk.aws_sqs.cloudformation as sqs_cloudformation


# TODO: Convert this to a class with an __init__ method, instead of a method, to match
#       the example code better.
def CloudFormationExample(parent: cdk.App, name: str, **props):
    self = cdk.Stack(parent, name, props)

    sqs_cloudformation.QueueResource(self, "MyQueue", {"visiblityTimeout": 300})

    return self


app = cdk.App()
CloudFormationExample(app, "CloudFormation")
app.run()
