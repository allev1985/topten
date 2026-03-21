output "smtp_username" {
  description = "SMTP username (IAM access key ID)"
  value       = aws_iam_access_key.ses_smtp.id
}

output "smtp_password" {
  description = "SMTP password (SES-specific secret derived from IAM secret key)"
  value       = aws_iam_access_key.ses_smtp.ses_smtp_password_v4
  sensitive   = true
}

output "domain_verification_token" {
  description = "TXT record value for SES domain verification (null if using email identity)"
  value       = local.use_domain ? aws_ses_domain_identity.main[0].verification_token : null
}

output "dkim_tokens" {
  description = "CNAME record values for DKIM verification (empty if using email identity)"
  value       = local.use_domain ? aws_ses_domain_dkim.main[0].dkim_tokens : []
}
