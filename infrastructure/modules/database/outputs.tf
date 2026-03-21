output "security_group_id" {
  description = "Security group ID for the RDS cluster (used by amplify module for egress rules)"
  value       = aws_security_group.rds.id
}

output "cluster_endpoint" {
  description = "Writer endpoint for the Aurora cluster"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_port" {
  description = "Port the Aurora cluster listens on"
  value       = aws_rds_cluster.main.port
}

output "database_name" {
  description = "Name of the default database"
  value       = aws_rds_cluster.main.database_name
}

output "master_username" {
  description = "Master username for the database"
  value       = aws_rds_cluster.main.master_username
}

output "master_password" {
  description = "Master password for the database"
  value       = random_password.master.result
  sensitive   = true
}
