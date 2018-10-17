import aws_cdk.cdk as cdk
import aws_cdk.aws_dynamodb as dynamodb


# TODO: Convert this to a class with an __init__ method, instead of a method, to match
#       the example code better.
def HelloCDK(parent: cdk.App, name: str, **props):
    self = cdk.Stack(parent, name, props)

    table = dynamodb.Table(self, "Table", {"readCapacity": 1, "writeCapacity": 1})
    table.addPartitionKey(dict(name="ID", type=dynamodb.AttributeType.String))
    table.addSortKey(dict(name="Timestamp", type=dynamodb.AttributeType.Number))

    return self


app = cdk.App()
HelloCDK(app, "Hello")
app.run()
