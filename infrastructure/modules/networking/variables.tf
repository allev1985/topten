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
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "aws_region must be a valid AWS region identifier (e.g. ap-southeast-2)."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC (e.g. 10.0.0.0/16)"
  type        = string

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block."
  }

  validation {
    condition     = tonumber(split("/", var.vpc_cidr)[1]) <= 16
    error_message = "vpc_cidr prefix must be /16 or larger to accommodate subnets."
  }
}

variable "subnets" {
  description = <<-EOT
    Map of subnet definitions keyed by a stable identifier (e.g. AZ name).
    Each entry defines a public and private CIDR for that AZ.
    Example:
      {
        "ap-southeast-2a" = { public_cidr = "10.0.1.0/24", private_cidr = "10.0.10.0/24" }
        "ap-southeast-2b" = { public_cidr = "10.0.2.0/24", private_cidr = "10.0.11.0/24" }
      }
  EOT
  type = map(object({
    public_cidr  = string
    private_cidr = string
  }))

  validation {
    condition     = length(var.subnets) >= 1
    error_message = "At least 1 availability zone must be defined."
  }

  validation {
    condition     = alltrue([for s in values(var.subnets) : can(cidrhost(s.public_cidr, 0)) && can(cidrhost(s.private_cidr, 0))])
    error_message = "All subnet CIDRs must be valid CIDR blocks."
  }
}

variable "nat_gateway_azs" {
  description = <<-EOT
    Set of AZ keys (matching keys in var.subnets) where NAT Gateways should be placed.
    Use a single AZ for dev (cost saving), all AZs for prod (high availability).
  EOT
  type        = set(string)

  validation {
    condition     = length(var.nat_gateway_azs) >= 1
    error_message = "At least one NAT gateway AZ must be specified."
  }
}

variable "enable_flow_logs" {
  description = "Whether to enable VPC flow logs to CloudWatch"
  type        = bool
  default     = true
}

variable "flow_log_retention_days" {
  description = "Number of days to retain VPC flow logs in CloudWatch"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.flow_log_retention_days)
    error_message = "flow_log_retention_days must be a valid CloudWatch Logs retention value."
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
