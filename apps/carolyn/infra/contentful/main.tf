terraform {
  required_version = ">= 1.12.0, < 2.0.0"

  required_providers {
    contentful = {
      source  = "registry.terraform.io/cysp/contentful"
      version = "= 0.0.68"
    }
  }

  backend "s3" {
    bucket       = "websites-carolyn-contentful-tofu-state-725669362139-us-west-2"
    key          = "contentful/terraform.tfstate"
    region       = "us-west-2"
    encrypt      = true
    use_lockfile = true
  }
}

provider "contentful" {}

variable "contentful_space_id" {
  description = "Carolyn's production Contentful space ID."
  type        = string
}

variable "github_actions_token" {
  description = "Repository-scoped fine-grained token with Actions: write permission."
  sensitive   = true
  type        = string
}

resource "contentful_webhook" "github_deployment" {
  space_id = var.contentful_space_id

  name   = "Carolyn production deployment"
  url    = "https://api.github.com/repos/soodoh/websites/actions/workflows/deploy-carolyn.yml/dispatches"
  active = true

  topics = [
    "Entry.publish",
    "Entry.unpublish",
    "Asset.publish",
    "Asset.unpublish",
  ]

  filters = [
    {
      equals = {
        doc   = "sys.environment.sys.id"
        value = "master"
      }
    },
  ]

  headers = {
    Accept = {
      value = "application/vnd.github+json"
    }
    Authorization = {
      value  = "Bearer ${var.github_actions_token}"
      secret = true
    }
    "X-GitHub-Api-Version" = {
      value = "2022-11-28"
    }
    "User-Agent" = {
      value = "soodoh-websites-contentful-webhook"
    }
  }

  transformation = {
    method       = "POST"
    content_type = "application/json"
    body = jsonencode({
      ref = "main"
      inputs = {
        source = "contentful"
      }
    })
  }
}
