output "security_group_id" {
  description = "Security group ID for ElastiCache (used by amplify module for egress rules)"
  value       = aws_security_group.redis.id
}

output "endpoint" {
  description = "ElastiCache Serverless endpoint address"
  value       = aws_elasticache_serverless_cache.main.endpoint[0].address
}

output "port" {
  description = "ElastiCache Serverless endpoint port"
  value       = aws_elasticache_serverless_cache.main.endpoint[0].port
}

output "auth_token" {
  description = "Auth token for the Redis app user"
  value       = random_password.auth_token.result
  sensitive   = true
}

output "username" {
  description = "Username for the Redis app user"
  value       = aws_elasticache_user.app.user_name
}
