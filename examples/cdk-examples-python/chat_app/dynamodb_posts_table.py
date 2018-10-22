import aws_cdk.aws_dynamodb as dynamodb
import aws_cdk.cdk as cdk


class DynamoPostsTable(cdk.Construct):
    def __init__(self, parent: cdk.Construct, name: str):
        super().__init__(parent, name)

        table = dynamodb.Table(self, "Table", readCapacity=5, writeCapacity=5)

        table.add_partition_key(name="Alias", type=dynamodb.AttributeType.String)
        table.add_sort_key(name="Timestamp", type=dynamodb.AttributeType.String)
