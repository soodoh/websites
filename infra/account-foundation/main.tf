variable "aws_region" {
  description = "AWS region for the account's production resources."
  type        = string
}

variable "notification_email" {
  description = "Email address for production alarm and budget notifications."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.notification_email))
    error_message = "notification_email must be an email address."
  }
}

variable "monthly_budget_amount" {
  description = "Account-wide monthly budget in USD."
  type        = number
  default     = 5

  validation {
    condition     = var.monthly_budget_amount >= 1
    error_message = "monthly_budget_amount must be at least 1."
  }
}

variable "resource_name_prefix" {
  description = "Prefix for shared account resource names."
  type        = string
  default     = "websites-production"

  validation {
    condition     = can(regex("^[A-Za-z0-9_-]+$", var.resource_name_prefix))
    error_message = "resource_name_prefix may contain letters, digits, underscores, and hyphens only."
  }
}

variable "operational_alarm_topic_name" {
  description = "Physical SNS topic name. Set this during adoption when a legacy stack generated the name."
  type        = string
  default     = null
}

variable "operational_alarm_topic_display_name" {
  description = "SNS display name. Set this during adoption when the existing value differs from the standard."
  type        = string
  default     = "Websites production alarms"
}

variable "operational_alarm_topic_tags" {
  description = "Exact existing SNS topic tags during import. Leave null when they match the foundation tags."
  type        = map(string)
  default     = null
}

variable "monthly_budget_name" {
  description = "Physical monthly budget name. Set this during adoption when it differs from the standard name."
  type        = string
  default     = null
}

variable "manage_github_oidc_provider" {
  description = "Whether this root owns the account GitHub Actions OIDC provider. Keep false while a legacy site stack owns it."
  type        = bool
  default     = true
}

variable "existing_github_oidc_provider_arn" {
  description = "Existing provider ARN used while legacy ownership is retained."
  type        = string
  default     = null

  validation {
    condition = (
      var.manage_github_oidc_provider ||
      (var.existing_github_oidc_provider_arn != null && can(regex(
        "^arn:[^:]+:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$",
        var.existing_github_oidc_provider_arn,
      )))
    )
    error_message = "existing_github_oidc_provider_arn is required when manage_github_oidc_provider is false."
  }
}

variable "oidc_provider_tags" {
  description = "Existing OIDC provider tags during import. Leave null when they already match the foundation tags."
  type        = map(string)
  default     = null
}

variable "state_bucket_name" {
  description = "Globally unique S3 bucket name for this account's OpenTofu state."
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$", var.state_bucket_name))
    error_message = "state_bucket_name must be a valid S3 bucket name."
  }
}

variable "managed_by" {
  description = "Ownership tag for foundation resources. Override with CloudFormation only during a legacy import."
  type        = string
  default     = "OpenTofu"

  validation {
    condition     = contains(["CloudFormation", "OpenTofu"], var.managed_by)
    error_message = "managed_by must be CloudFormation or OpenTofu."
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  tags = {
    Project     = "websites"
    Environment = "production"
    ManagedBy   = var.managed_by
  }
}

resource "aws_iam_openid_connect_provider" "github_actions" {
  count = var.manage_github_oidc_provider ? 1 : 0

  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  tags = var.oidc_provider_tags == null ? local.tags : var.oidc_provider_tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket" "tofu_state" {
  bucket = var.state_bucket_name
  tags   = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "tofu_state" {
  bucket = aws_s3_bucket.tofu_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tofu_state" {
  bucket = aws_s3_bucket.tofu_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "tofu_state" {
  bucket                  = aws_s3_bucket.tofu_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "tofu_state" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.tofu_state.arn,
      "${aws_s3_bucket.tofu_state.arn}/*",
    ]

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "tofu_state" {
  bucket = aws_s3_bucket.tofu_state.id
  policy = data.aws_iam_policy_document.tofu_state.json
}

resource "aws_sns_topic" "operational_alarms" {
  name = coalesce(
    var.operational_alarm_topic_name,
    "${var.resource_name_prefix}-alarms",
  )
  display_name = var.operational_alarm_topic_display_name
  tags         = var.operational_alarm_topic_tags == null ? local.tags : var.operational_alarm_topic_tags
}

resource "aws_sns_topic_subscription" "operational_alarm_email" {
  topic_arn = aws_sns_topic.operational_alarms.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

resource "aws_budgets_budget" "monthly_account" {
  name = coalesce(
    var.monthly_budget_name,
    "${var.resource_name_prefix}-account-monthly",
  )
  budget_type  = "COST"
  limit_amount = tostring(var.monthly_budget_amount)
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "FORECASTED"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.notification_email]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    notification_type          = "ACTUAL"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    subscriber_email_addresses = [var.notification_email]
  }

}

output "state_bucket_name" {
  description = "Versioned, encrypted S3 bucket used by the account's OpenTofu roots."
  value       = aws_s3_bucket.tofu_state.id
}

output "github_oidc_provider_arn" {
  description = "GitHub Actions OIDC provider ARN consumed by site roots."
  value = var.manage_github_oidc_provider ? (
    aws_iam_openid_connect_provider.github_actions[0].arn
  ) : var.existing_github_oidc_provider_arn
}

output "operational_alarm_topic_arn" {
  description = "Shared operational alarm topic ARN consumed by site roots."
  value       = aws_sns_topic.operational_alarms.arn
}
