terraform {
  backend "s3" {
    bucket         = "myfaves-terraform-state-dev"
    key            = "dev/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "myfaves-terraform-locks-dev"
    encrypt        = true
  }
}
