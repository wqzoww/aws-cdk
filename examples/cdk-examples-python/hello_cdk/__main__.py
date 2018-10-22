import aws_cdk.cdk as cdk
import aws_cdk.aws_dynamodb as dynamodb


class HelloCDK(cdk.Stack):
    def __init__(self, parent: cdk.App, name: str, **kwargs):
        super().__init__(parent, name, **kwargs)

        table = dynamodb.Table(self, "Table", readCapacity=1, writeCapacity=1)
        table.add_partition_key(name="ID", type=dynamodb.AttributeType.String)
        table.add_sort_key(name="Timestamp", type=dynamodb.AttributeType.Number)


app = cdk.App()
HelloCDK(app, "Hello")
app.run()
