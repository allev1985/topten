variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "repository_url" {
  description = "GitHub repository URL"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
}

variable "auth_secret" {
  description = "BetterAuth secret key"
  type        = string
  sensitive   = true
}

variable "google_places_api_key" {
  description = "Google Places API key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "ses_email_address" {
  description = "Email address to verify with SES (sandbox mode)"
  type        = string
  default     = ""
}

variable "smtp_from" {
  description = "From address for outbound emails"
  type        = string
}

variable "app_url" {
  description = "Public application URL"
  type        = string
}
