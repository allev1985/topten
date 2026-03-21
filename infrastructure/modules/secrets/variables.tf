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

# --- Database connection components ---

variable "db_endpoint" {
  description = "RDS cluster writer endpoint"
  type        = string
}

variable "db_port" {
  description = "RDS cluster port"
  type        = number
}

variable "db_name" {
  description = "Database name"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

# --- Redis connection components ---

variable "redis_endpoint" {
  description = "ElastiCache endpoint address"
  type        = string
}

variable "redis_port" {
  description = "ElastiCache endpoint port"
  type        = number
}

variable "redis_username" {
  description = "ElastiCache app username"
  type        = string
}

variable "redis_auth_token" {
  description = "ElastiCache auth token"
  type        = string
  sensitive   = true
}

# --- SES SMTP credentials ---

variable "smtp_username" {
  description = "SES SMTP username (IAM access key ID)"
  type        = string
}

variable "smtp_password" {
  description = "SES SMTP password"
  type        = string
  sensitive   = true
}

variable "smtp_from" {
  description = "From address for outbound emails"
  type        = string
}

# --- Application secrets ---

variable "auth_secret" {
  description = "BetterAuth secret key"
  type        = string
  sensitive   = true
}

variable "google_places_api_key" {
  description = "Google Places API key (server-side only)"
  type        = string
  sensitive   = true
  default     = ""
}

# --- Non-sensitive config ---

variable "app_url" {
  description = "Public application URL (e.g. https://main.d1234.amplifyapp.com)"
  type        = string
}

variable "log_level" {
  description = "Application log level"
  type        = string
  default     = "info"

  validation {
    condition     = contains(["trace", "debug", "info", "warn", "error", "fatal"], var.log_level)
    error_message = "log_level must be one of: trace, debug, info, warn, error, fatal."
  }
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
