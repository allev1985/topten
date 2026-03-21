variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "myfaves"

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "project_name must contain only lowercase alphanumeric characters and hyphens."
  }
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

# --- Repository ---

variable "repository_url" {
  description = "GitHub repository URL (e.g. https://github.com/org/repo)"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify to access the repository"
  type        = string
  sensitive   = true
}

variable "branch_name" {
  description = "Git branch to deploy (e.g. main, dev)"
  type        = string
}

variable "framework" {
  description = "Framework identifier for Amplify"
  type        = string
  default     = "Next.js - SSR"
}

# --- VPC connectivity ---

variable "vpc_id" {
  description = "VPC ID for the Amplify SSR security group"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for SSR Lambda ENI placement (written to SSM for amplify/backend.ts)"
  type        = list(string)
}

variable "vpc_endpoint_security_group_id" {
  description = "VPC endpoint security group ID for egress rule"
  type        = string
}

# --- SSM / Secrets ---

variable "ssm_parameter_arns" {
  description = "Map of SSM parameter ARNs the Amplify service role needs read access to"
  type        = map(string)
}

# --- Non-sensitive environment variables ---

variable "environment_variables" {
  description = "Non-sensitive environment variables to set on the Amplify app (e.g. NEXT_PUBLIC_APP_URL)"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
