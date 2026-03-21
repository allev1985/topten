mock_provider "aws" {}
mock_provider "random" {}

run "plan" {
  command = plan

  module {
    source = "./modules/cache"
  }

  variables {
    project_name                  = "myfaves"
    environment                   = "dev"
    vpc_id                        = "vpc-mock123"
    private_subnet_ids            = ["subnet-mock1", "subnet-mock2"]
    amplify_ssr_security_group_id = "sg-mock123"
    snapshot_retention_limit      = 0
  }

  # Cache name contains project name and environment
  assert {
    condition     = aws_elasticache_serverless_cache.main.name == "myfaves-dev"
    error_message = "Cache name should be 'myfaves-dev', got '${aws_elasticache_serverless_cache.main.name}'"
  }

  # Security group is created
  assert {
    condition     = aws_security_group.redis.name == "myfaves-dev-redis"
    error_message = "Redis security group name should be 'myfaves-dev-redis'"
  }

  # App user has password authentication mode
  assert {
    condition     = aws_elasticache_user.app.authentication_mode[0].type == "password"
    error_message = "App user should have password authentication mode"
  }
}
