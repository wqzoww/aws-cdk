import aws_cdk.aws_cognito.cloudformation as cognito_cloudformation
import aws_cdk.cdk as cdk


class CognitoChatRoomPool(cdk.Construct):
    def __init__(self, parent: cdk.Construct, name: str):
        super().__init__(parent, name)

        # Create chat room user pool
        chatPool = cognito_cloudformation.UserPoolResource(
            self,
            "UserPool",
            adminCreateUserConfig={"allowAdminCreateUserOnly": False},
            policies={
                "passwordPolicy": {"minimumLength": 6, "requireNumbers": True}
            },
            schema=[
                {"attributeDataType": "String", "name": "email", "required": True}
            ],
            autoVerifiedAttributes=["email"],
        )

        # Now for the client
        cognito_cloudformation.UserPoolClientResource(
            self,
            "UserPoolClient",
            clientName="Chat-Room",
            explicitAuthFlows=["ADMIN_NO_SRP_AUTH"],
            refreshTokenValidity=30,
            userPoolId=chatPool.ref,
        )
