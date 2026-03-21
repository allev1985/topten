mock_provider "aws" {}

run "plan" {
  command = plan

  module {
    source = "./modules/networking"
  }

  variables {
    project_name = "myfaves"
    environment  = "dev"
    aws_region   = "ap-southeast-2"
    vpc_cidr     = "10.1.0.0/16"
    subnets = {
      "ap-southeast-2a" = { public_cidr = "10.1.1.0/24", private_cidr = "10.1.10.0/24" }
      "ap-southeast-2b" = { public_cidr = "10.1.2.0/24", private_cidr = "10.1.11.0/24" }
    }
    nat_gateway_azs         = ["ap-southeast-2a"]
    enable_flow_logs        = true
    flow_log_retention_days = 14
  }

  # VPC CIDR matches input
  assert {
    condition     = aws_vpc.main.cidr_block == "10.1.0.0/16"
    error_message = "VPC CIDR block should be 10.1.0.0/16, got ${aws_vpc.main.cidr_block}"
  }

  # Private subnets are created (output is not empty)
  assert {
    condition     = length(output.private_subnet_ids) > 0
    error_message = "Private subnets output should not be empty"
  }

  # VPC endpoint security group is created
  assert {
    condition     = aws_security_group.vpc_endpoint.name == "myfaves-dev-vpc-endpoint"
    error_message = "VPC endpoint security group name should be 'myfaves-dev-vpc-endpoint'"
  }
}
