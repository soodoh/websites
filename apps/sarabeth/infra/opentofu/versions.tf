terraform {
  required_version = "1.16.3"

  required_providers {
    aws = {
      source  = "registry.terraform.io/hashicorp/aws"
      version = "6.66.0"
    }
    awscc = {
      source  = "registry.terraform.io/hashicorp/awscc"
      version = "= 1.102.0"
    }
  }

  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
