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
  description = "VPC ID where the database will be deployed"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs for the DB subnet group"
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 1
    error_message = "At least 1 private subnet is required for the DB subnet group."
  }
}

variable "amplify_ssr_security_group_id" {
  description = "Security group ID of the Amplify SSR compute, used to allow ingress on port 5432"
  type        = string
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "16.4"
}

variable "database_name" {
  description = "Name of the default database to create"
  type        = string
  default     = "myfaves"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.database_name))
    error_message = "database_name must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "myfaves_admin"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]*$", var.master_username))
    error_message = "master_username must start with a letter and contain only alphanumeric characters and underscores."
  }
}

variable "min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity in ACUs (0.5 minimum)"
  type        = number
  default     = 0.5

  validation {
    condition     = var.min_capacity >= 0.5 && var.min_capacity <= 128
    error_message = "min_capacity must be between 0.5 and 128 ACUs."
  }
}

variable "max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity in ACUs"
  type        = number
  default     = 2

  validation {
    condition     = var.max_capacity >= 1 && var.max_capacity <= 128
    error_message = "max_capacity must be between 1 and 128 ACUs."
  }
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups"
  type        = number
  default     = 7

  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "backup_retention_period must be between 1 and 35 days."
  }
}

variable "deletion_protection" {
  description = "Enable deletion protection on the cluster"
  type        = bool
  default     = false
}

variable "enable_performance_insights" {
  description = "Enable Performance Insights on the cluster instance"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
