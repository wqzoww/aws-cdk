import aws_cdk.aws_lambda as lambda_
import aws_cdk.aws_s3 as s3
import aws_cdk.cdk as cdk

from .cognito_chat_room_pool import CognitoChatRoomPool
from .dynamodb_posts_table import DynamoPostsTable


def MyStack(parent: cdk.App, name: str, **props):
    self = cdk.Stack(parent, name, props)

    DynamoPostsTable(self, "Posts")

    CognitoChatRoomPool(self, "UserPool")

    bucket = s3.BucketRef.import_(self, "DougsBucket", {"bucketName": "dougs-chat-app"})

    ChatAppFunction(
        self,
        "StartAddBucket",
        bucket=bucket,
        zipFile="StartAddingPendingCognitoUser.zip",
    )

    ChatAppFunction(
        self,
        "FinishAddBucket",
        bucket=bucket,
        zipFile="FinishAddingPendingCognitoUser.zip",
    )

    ChatAppFunction(
        self, "SignInUserBucket", bucket=bucket, zipFile="SignInCognitoUser.zip"
    )

    ChatAppFunction(
        self, "VerifyBucket", bucket=bucket, zipFile="VerifyCognitoSignIn.zip"
    )

    ChatAppFunction(
        self,
        "StartChangeBucket",
        bucket=bucket,
        zipFile="StartChangingForgottenCognitoUserPassword.zip",
    )

    ChatAppFunction(
        self,
        "FinishChangeBucket",
        bucket=bucket,
        zipFile="FinishChangingForgottenCognitoUserPassword.zip",
    )

    ChatAppFunction(self, "GetPostsBucket", bucket=bucket, zipFile="GetPosts.zip")

    ChatAppFunction(self, "AddPostBucket", bucket=bucket, zipFile="AddPost.zip")

    ChatAppFunction(self, "DeletePostBucket", bucket=bucket, zipFile="DeletePost.zip")

    ChatAppFunction(
        self, "DeleteUserBucket", bucket=bucket, zipFile="DeleteCognitoUser.zip"
    )


#
# Extend Function as all of the Chat app functions have these common props.
#
def ChatAppFunction(parent: cdk.Construct, name: str, **props):
    """
    interface ChatAppFuncProps {
        bucket: s3.BucketRef;
        zipFile: string;
    }
    """
    return lambda_.Function(
        parent,
        name,
        {
            "code": lambda_.S3Code(props["bucket"], props["zipFile"]),
            "runtime": lambda_.Runtime.NodeJS610,
            "handler": "index.handler",
        },
    )


app = cdk.App()

# Add the stack to the app
# (apps can host many stacks, for example, one for each region)
MyStack(app, "ChatAppStack", env={"region": "us-west-2"})

app.run()
