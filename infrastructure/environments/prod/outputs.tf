output "amplify_app_id" {
  description = "Amplify app ID"
  value       = module.amplify.app_id
}

output "amplify_default_domain" {
  description = "Default Amplify domain"
  value       = module.amplify.default_domain
}

output "ses_domain_verification_token" {
  description = "SES domain verification TXT record value (null if using email identity)"
  value       = module.email.domain_verification_token
}

output "ses_dkim_tokens" {
  description = "SES DKIM CNAME record values (empty if using email identity)"
  value       = module.email.dkim_tokens
}
