terraform {
  backend "s3" {
    bucket         = "myfaves-terraform-state-prod"
    key            = "prod/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "myfaves-terraform-locks-prod"
    encrypt        = true
  }
}
