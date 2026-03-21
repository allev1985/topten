terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  environment = "dev"
}

# ------------------------------------------------------------------------------
# Networking
# ------------------------------------------------------------------------------

module "networking" {
  source = "../../modules/networking"

  project_name = "myfaves"
  environment  = local.environment
  aws_region   = var.aws_region
  vpc_cidr     = "10.1.0.0/16"

  subnets = {
    "ap-southeast-2a" = { public_cidr = "10.1.1.0/24", private_cidr = "10.1.10.0/24" }
    "ap-southeast-2b" = { public_cidr = "10.1.2.0/24", private_cidr = "10.1.11.0/24" }
  }

  nat_gateway_azs = toset(["ap-southeast-2a"])

  enable_flow_logs        = true
  flow_log_retention_days = 14
}

# ------------------------------------------------------------------------------
# Amplify
# ------------------------------------------------------------------------------

module "amplify" {
  source = "../../modules/amplify"

  project_name = "myfaves"
  environment  = local.environment

  repository_url      = var.repository_url
  github_access_token = var.github_access_token
  branch_name         = "dev"

  vpc_id                         = module.networking.vpc_id
  private_subnet_ids             = module.networking.private_subnet_ids
  vpc_endpoint_security_group_id = module.networking.vpc_endpoint_security_group_id

  ssm_parameter_arns = module.secrets.parameter_arns

  environment_variables = {
    NEXT_PUBLIC_APP_URL = var.app_url
  }
}

# ------------------------------------------------------------------------------
# Database
# ------------------------------------------------------------------------------

module "database" {
  source = "../../modules/database"

  project_name = "myfaves"
  environment  = local.environment

  vpc_id                        = module.networking.vpc_id
  private_subnet_ids            = module.networking.private_subnet_ids
  amplify_ssr_security_group_id = module.amplify.amplify_ssr_security_group_id

  min_capacity            = 0.5
  max_capacity            = 2
  backup_retention_period = 7
  deletion_protection     = false
}

# ------------------------------------------------------------------------------
# Cache
# ------------------------------------------------------------------------------

module "cache" {
  source = "../../modules/cache"

  project_name = "myfaves"
  environment  = local.environment

  vpc_id                        = module.networking.vpc_id
  private_subnet_ids            = module.networking.private_subnet_ids
  amplify_ssr_security_group_id = module.amplify.amplify_ssr_security_group_id

  snapshot_retention_limit = 0
}

# ------------------------------------------------------------------------------
# Email (SES)
# ------------------------------------------------------------------------------

module "email" {
  source = "../../modules/email"

  project_name  = "myfaves"
  environment   = local.environment
  email_address = var.ses_email_address
}

# ------------------------------------------------------------------------------
# Secrets (SSM Parameter Store)
# ------------------------------------------------------------------------------

module "secrets" {
  source = "../../modules/secrets"

  project_name = "myfaves"
  environment  = local.environment

  db_endpoint = module.database.cluster_endpoint
  db_port     = module.database.cluster_port
  db_name     = module.database.database_name
  db_username = module.database.master_username
  db_password = module.database.master_password

  redis_endpoint   = module.cache.endpoint
  redis_port       = module.cache.port
  redis_username   = module.cache.username
  redis_auth_token = module.cache.auth_token

  smtp_username = module.email.smtp_username
  smtp_password = module.email.smtp_password
  smtp_from     = var.smtp_from

  auth_secret           = var.auth_secret
  google_places_api_key = var.google_places_api_key
  app_url               = var.app_url
  log_level             = "debug"
}

# ------------------------------------------------------------------------------
# Cross-module security group rules
# These wire the amplify SSR SG egress to database/cache SGs. Defined here
# in the root module to avoid circular dependencies between modules.
# ------------------------------------------------------------------------------

resource "aws_security_group_rule" "amplify_to_rds" {
  type                     = "egress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = module.amplify.amplify_ssr_security_group_id
  source_security_group_id = module.database.security_group_id
  description              = "Allow Amplify SSR egress to RDS on port 5432"
}

resource "aws_security_group_rule" "amplify_to_redis" {
  type                     = "egress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  security_group_id        = module.amplify.amplify_ssr_security_group_id
  source_security_group_id = module.cache.security_group_id
  description              = "Allow Amplify SSR egress to Redis on port 6379"
}
