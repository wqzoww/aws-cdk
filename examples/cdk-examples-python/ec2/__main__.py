import aws_cdk.aws_autoscaling as autoscaling
import aws_cdk.aws_ec2 as ec2
import aws_cdk.aws_elasticloadbalancing as elb
import aws_cdk.cdk as cdk


class AppWithVPC(cdk.Stack):
    def __init__(self, parent: cdk.App, name: str, **kwargs):
        super().__init__(parent, name, **kwargs)

        vpc = ec2.VpcNetwork(self, "MyVpc")
        asg = autoscaling.AutoScalingGroup(
            self,
            "MyASG",
            vpc=vpc,
            instanceType=ec2.InstanceTypePair(
                ec2.InstanceClass.Standard3, ec2.InstanceSize.XLarge
            ),
            machineImage=ec2.AmazonLinuxImage(),
        )
        clb = elb.LoadBalancer(self, "LB", vpc=vpc, internetFacing=True)

        clb.add_listener(externalPort=80)
        clb.add_target(asg)


class MyApp(cdk.Stack):
    def __init__(self, parent: cdk.App, name: str, *, vpc, **kwargs):
        super().__init__(parent, name, **kwargs)

        fleet = autoscaling.AutoScalingGroup(
            self,
            "MyASG",
            vpc=vpc,
            instanceType=ec2.InstanceTypePair(
                ec2.InstanceClass.Standard3, ec2.InstanceSize.XLarge
            ),
            machineImage=ec2.AmazonLinuxImage(),
        )

        clb = elb.LoadBalancer(self, "LB", vpc=vpc, internetFacing=True)
        clb.add_listener(externalPort=80)
        clb.add_target(fleet)


class CommonInfrastructure(cdk.Stack):
    def __init__(self, parent: cdk.App, name: str, **kwargs):
        super().__init__(parent, name, **kwargs)

        self.vpc = ec2.VpcNetwork(self, "VPC")


app = cdk.App()

infra = CommonInfrastructure(app, "infra")

AppWithVPC(app, "app-with-vpc")
MyApp(app, "my-app", infra=infra)

app.run()
