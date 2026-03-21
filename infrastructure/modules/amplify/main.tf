locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )
}

data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

# ------------------------------------------------------------------------------
# Security Group — Amplify SSR Lambda ENIs
# Internet and VPC endpoint egress rules are defined here.
# Egress rules to RDS and Redis SGs are created in the root module to
# avoid circular dependencies between amplify ↔ database/cache modules.
# ------------------------------------------------------------------------------

resource "aws_security_group" "amplify_ssr" {
  name        = "${var.project_name}-${var.environment}-amplify-ssr"
  description = "Security group for Amplify SSR Lambda ENIs"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-amplify-ssr-sg"
  })
}

resource "aws_security_group_rule" "egress_to_vpc_endpoints" {
  type                     = "egress"
  from_port                = 443
  to_port                  = 443
  protocol                 = "tcp"
  security_group_id        = aws_security_group.amplify_ssr.id
  source_security_group_id = var.vpc_endpoint_security_group_id
  description              = "Allow egress to VPC endpoints on port 443"
}

resource "aws_security_group_rule" "egress_to_internet_https" {
  type              = "egress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.amplify_ssr.id
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow HTTPS egress for SES and external APIs"
}

resource "aws_security_group_rule" "egress_to_internet_smtp" {
  type              = "egress"
  from_port         = 587
  to_port           = 587
  protocol          = "tcp"
  security_group_id = aws_security_group.amplify_ssr.id
  cidr_blocks       = ["0.0.0.0/0"]
  description       = "Allow SMTP egress for SES on port 587"
}

# ------------------------------------------------------------------------------
# IAM Service Role — least-privilege for Amplify
# ------------------------------------------------------------------------------

resource "aws_iam_role" "amplify" {
  name = "${var.project_name}-${var.environment}-amplify-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "amplify.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

# SSM Parameter Store read access (both String and SecureString parameters)
resource "aws_iam_role_policy" "amplify_ssm" {
  name = "ssm-read"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter", "ssm:GetParameters"]
        Resource = values(var.ssm_parameter_arns)
      }
    ]
  })
}

# KMS decrypt for SecureString parameters (uses the default aws/ssm key)
resource "aws_iam_role_policy" "amplify_kms" {
  name = "kms-decrypt"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = "arn:aws:kms:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:alias/aws/ssm"
      }
    ]
  })
}

# VPC ENI management for SSR Lambda functions
resource "aws_iam_role_policy" "amplify_vpc" {
  name = "vpc-eni-management"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeVpcs",
        ]
        Resource = "*"
      }
    ]
  })
}

# CloudWatch Logs for build and SSR function logs
resource "aws_iam_role_policy" "amplify_logs" {
  name = "cloudwatch-logs"
  role = aws_iam_role.amplify.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.id}:${data.aws_caller_identity.current.account_id}:log-group:/aws/amplify/*"
      }
    ]
  })
}

# ------------------------------------------------------------------------------
# SSM Parameters for VPC config — read by amplify/backend.ts at build time
# to configure SSR compute with VPC access
# ------------------------------------------------------------------------------

resource "aws_ssm_parameter" "amplify_vpc_subnet_ids" {
  name  = "/${var.project_name}/${var.environment}/amplify/vpc-subnet-ids"
  type  = "StringList"
  value = join(",", var.private_subnet_ids)
  tags  = local.common_tags
}

resource "aws_ssm_parameter" "amplify_vpc_security_group_id" {
  name  = "/${var.project_name}/${var.environment}/amplify/vpc-security-group-id"
  type  = "String"
  value = aws_security_group.amplify_ssr.id
  tags  = local.common_tags
}

# ------------------------------------------------------------------------------
# Amplify App
# ------------------------------------------------------------------------------

resource "aws_amplify_app" "main" {
  name       = "${var.project_name}-${var.environment}"
  repository = var.repository_url

  access_token         = var.github_access_token
  iam_service_role_arn = aws_iam_role.amplify.arn

  platform = "WEB_COMPUTE"

  environment_variables = var.environment_variables

  build_spec = <<-YAML
    version: 1
    frontend:
      phases:
        preBuild:
          commands:
            - corepack enable
            - pnpm install --frozen-lockfile
        build:
          commands:
            - pnpm build
      artifacts:
        baseDirectory: .next
        files:
          - '**/*'
      cache:
        paths:
          - .next/cache/**/*
          - node_modules/**/*
  YAML

  tags = local.common_tags
}

# ------------------------------------------------------------------------------
# Amplify Branch
# ------------------------------------------------------------------------------

resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.main.id
  branch_name = var.branch_name

  framework = var.framework
  stage     = var.environment == "prod" ? "PRODUCTION" : "DEVELOPMENT"

  enable_auto_build = true

  tags = local.common_tags
}
