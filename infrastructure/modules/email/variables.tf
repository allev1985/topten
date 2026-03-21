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

variable "domain" {
  description = "Domain to verify with SES for sending email. If empty, email_address is used instead."
  type        = string
  default     = ""
}

variable "email_address" {
  description = "Individual email address to verify with SES. Used when no domain is available (e.g. sandbox testing)."
  type        = string
  default     = ""

  validation {
    condition     = var.email_address == "" || can(regex("^[^@]+@[^@]+\\.[^@]+$", var.email_address))
    error_message = "email_address must be a valid email address or empty."
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
