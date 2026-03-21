output "parameter_arns" {
  description = "Map of parameter name to ARN, for building IAM policies"
  value = merge(
    {
      database_url     = aws_ssm_parameter.database_url.arn
      redis_url        = aws_ssm_parameter.redis_url.arn
      auth_secret      = aws_ssm_parameter.auth_secret.arn
      smtp_credentials = aws_ssm_parameter.smtp_credentials.arn
      app_url          = aws_ssm_parameter.app_url.arn
      smtp_host        = aws_ssm_parameter.smtp_host.arn
      smtp_port        = aws_ssm_parameter.smtp_port.arn
      smtp_from        = aws_ssm_parameter.smtp_from.arn
      log_level        = aws_ssm_parameter.log_level.arn
    },
    var.google_places_api_key != "" ? {
      google_places_api_key = aws_ssm_parameter.google_places_api_key[0].arn
    } : {}
  )
}
