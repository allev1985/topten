output "state_bucket_id" {
  description = "The S3 bucket ID for Terraform state storage"
  value       = aws_s3_bucket.state.id
}

output "state_bucket_arn" {
  description = "The S3 bucket ARN for Terraform state storage"
  value       = aws_s3_bucket.state.arn
}

output "lock_table_id" {
  description = "The DynamoDB table name for Terraform state locking"
  value       = aws_dynamodb_table.locks.id
}

output "lock_table_arn" {
  description = "The DynamoDB table ARN for Terraform state locking"
  value       = aws_dynamodb_table.locks.arn
}
