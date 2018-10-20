import aws_cdk.aws_autoscaling as autoscaling
import aws_cdk.aws_ec2 as ec2
import aws_cdk.aws_elasticloadbalancing as elb
import aws_cdk.cdk as cdk


def AppWithVPC(parent: cdk.App, name: str, **props):
    self = cdk.Stack(parent, name, props)

    vpc = ec2.VpcNetwork(self, "MyVpc")
    asg = autoscaling.AutoScalingGroup(
        self,
        "MyASG",
        {
            "vpc": vpc,
            "instanceType": ec2.InstanceTypePair(
                ec2.InstanceClass.Standard3, ec2.InstanceSize.XLarge
            ),
            "machineImage": ec2.AmazonLinuxImage(),
        },
    )
    clb = elb.LoadBalancer(self, "LB", {"vpc": vpc, "internetFacing": True})

    clb.add_listener({"externalPort": 80})
    clb.add_target(asg)

    return self


def MyApp(parent: cdk.App, name: str, **props):
    self = cdk.Stack(parent, name, props)

    vpc = props["infra"].vpc

    fleet = autoscaling.AutoScalingGroup(
        self,
        "MyASG",
        {
            "vpc": vpc,
            "instanceType": ec2.InstanceTypePair(
                ec2.InstanceClass.Standard3, ec2.InstanceSize.XLarge
            ),
            "machineImage": ec2.AmazonLinuxImage(),
        },
    )

    clb = elb.LoadBalancer(self, "LB", {"vpc": vpc, "internetFacing": True})
    clb.add_listener({"externalPort": 80})
    clb.add_target(fleet)

    return self


def CommonInfrastructure(parent: cdk.App, name: str, **props):
    self = cdk.Stack(parent, name, props)

    self.vpc = ec2.VpcNetwork(self, "VPC")

    return self


app = cdk.App()

infra = CommonInfrastructure(app, "infra")

AppWithVPC(app, "app-with-vpc")
MyApp(app, "my-app", infra=infra)

app.run()
