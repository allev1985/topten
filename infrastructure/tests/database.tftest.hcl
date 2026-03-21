mock_provider "aws" {}
mock_provider "random" {}

run "plan" {
  command = plan

  module {
    source = "./modules/database"
  }

  variables {
    project_name                  = "myfaves"
    environment                   = "dev"
    vpc_id                        = "vpc-mock123"
    private_subnet_ids            = ["subnet-mock1", "subnet-mock2"]
    amplify_ssr_security_group_id = "sg-mock123"
    min_capacity                  = 0.5
    max_capacity                  = 2
    backup_retention_period       = 7
    deletion_protection           = false
  }

  # Cluster identifier contains project name and environment
  assert {
    condition     = aws_rds_cluster.main.cluster_identifier == "myfaves-dev"
    error_message = "Cluster identifier should be 'myfaves-dev', got '${aws_rds_cluster.main.cluster_identifier}'"
  }

  # Storage encryption is enabled
  assert {
    condition     = aws_rds_cluster.main.storage_encrypted == true
    error_message = "Storage encryption should be enabled on the RDS cluster"
  }

  # Instance is not publicly accessible
  assert {
    condition     = aws_rds_cluster_instance.main.publicly_accessible == false
    error_message = "RDS cluster instance should not be publicly accessible"
  }

  # Deletion protection matches input
  assert {
    condition     = aws_rds_cluster.main.deletion_protection == false
    error_message = "Deletion protection should match the input variable (false)"
  }

  # SSL is enforced via rds.force_ssl parameter
  assert {
    condition     = anytrue([for p in aws_rds_cluster_parameter_group.main.parameter : p.name == "rds.force_ssl" && p.value == "1"])
    error_message = "Cluster parameter group should contain rds.force_ssl parameter set to '1'"
  }
}
