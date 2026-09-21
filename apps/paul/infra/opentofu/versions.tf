terraform {
  required_version = "= 1.12.6"

  required_providers {
    aws = {
      source  = "registry.terraform.io/hashicorp/aws"
      version = "= 6.65.0"
    }
  }

  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
