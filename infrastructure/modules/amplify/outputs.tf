output "app_id" {
  description = "Amplify app ID"
  value       = aws_amplify_app.main.id
}

output "default_domain" {
  description = "Default Amplify domain (e.g. main.d1234abcd.amplifyapp.com)"
  value       = aws_amplify_app.main.default_domain
}

output "amplify_ssr_security_group_id" {
  description = "Security group ID for Amplify SSR Lambda ENIs (consumed by database and cache modules)"
  value       = aws_security_group.amplify_ssr.id
}
