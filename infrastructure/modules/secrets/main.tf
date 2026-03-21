locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )

  prefix = "/${var.project_name}/${var.environment}"

  # Compose connection strings matching what the application expects.
  # DATABASE_URL: postgresql://user:pass@host:port/dbname?sslmode=require
  # REDIS_URL:    rediss://user:pass@host:port (rediss:// = TLS)
  database_url = "postgresql://${var.db_username}:${var.db_password}@${var.db_endpoint}:${var.db_port}/${var.db_name}?sslmode=require"
  redis_url    = "rediss://${var.redis_username}:${var.redis_auth_token}@${var.redis_endpoint}:${var.redis_port}"
}

data "aws_region" "current" {}

# ------------------------------------------------------------------------------
# SSM Parameter Store — SecureString for secrets, String for config
# ------------------------------------------------------------------------------

resource "aws_ssm_parameter" "database_url" {
  name  = "${local.prefix}/database-url"
  type  = "SecureString"
  value = local.database_url
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "redis_url" {
  name  = "${local.prefix}/redis-url"
  type  = "SecureString"
  value = local.redis_url
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "auth_secret" {
  name  = "${local.prefix}/auth-secret"
  type  = "SecureString"
  value = var.auth_secret
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "smtp_credentials" {
  name = "${local.prefix}/smtp-credentials"
  type = "SecureString"
  value = jsonencode({
    username = var.smtp_username
    password = var.smtp_password
  })
  tags = local.common_tags
}

resource "aws_ssm_parameter" "google_places_api_key" {
  count = var.google_places_api_key != "" ? 1 : 0
  name  = "${local.prefix}/google-places-api-key"
  type  = "SecureString"
  value = var.google_places_api_key
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "app_url" {
  name  = "${local.prefix}/app-url"
  type  = "String"
  value = var.app_url
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "smtp_host" {
  name  = "${local.prefix}/smtp-host"
  type  = "String"
  value = "email-smtp.${data.aws_region.current.id}.amazonaws.com"
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "smtp_port" {
  name  = "${local.prefix}/smtp-port"
  type  = "String"
  value = "587"
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "smtp_from" {
  name  = "${local.prefix}/smtp-from"
  type  = "String"
  value = var.smtp_from
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "log_level" {
  name  = "${local.prefix}/log-level"
  type  = "String"
  value = var.log_level
  tags  = local.common_tags
}
