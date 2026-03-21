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

variable "vpc_id" {
  description = "VPC ID where the cache will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the ElastiCache subnet group"
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 1
    error_message = "At least 1 private subnet is required for the subnet group."
  }
}

variable "amplify_ssr_security_group_id" {
  description = "Security group ID of the Amplify SSR compute, used to allow ingress on port 6379"
  type        = string
}

variable "snapshot_retention_limit" {
  description = "Number of days to retain automatic snapshots. 0 disables snapshots."
  type        = number
  default     = 0

  validation {
    condition     = var.snapshot_retention_limit >= 0 && var.snapshot_retention_limit <= 35
    error_message = "snapshot_retention_limit must be between 0 and 35."
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
