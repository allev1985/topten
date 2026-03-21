mock_provider "aws" {}

run "plan" {
  command = plan

  module {
    source = "./modules/state-backend"
  }

  variables {
    project_name = "myfaves"
    environment  = "dev"
  }

  # S3 bucket versioning is enabled
  assert {
    condition     = aws_s3_bucket_versioning.state.versioning_configuration[0].status == "Enabled"
    error_message = "S3 bucket versioning should be enabled"
  }

  # S3 public access block has all 4 settings true
  assert {
    condition     = aws_s3_bucket_public_access_block.state.block_public_acls == true
    error_message = "block_public_acls should be true"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.state.block_public_policy == true
    error_message = "block_public_policy should be true"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.state.ignore_public_acls == true
    error_message = "ignore_public_acls should be true"
  }

  assert {
    condition     = aws_s3_bucket_public_access_block.state.restrict_public_buckets == true
    error_message = "restrict_public_buckets should be true"
  }

  # DynamoDB encryption is enabled
  assert {
    condition     = aws_dynamodb_table.locks.server_side_encryption[0].enabled == true
    error_message = "DynamoDB server-side encryption should be enabled"
  }

  # DynamoDB point-in-time recovery is enabled
  assert {
    condition     = aws_dynamodb_table.locks.point_in_time_recovery[0].enabled == true
    error_message = "DynamoDB point-in-time recovery should be enabled"
  }
}
