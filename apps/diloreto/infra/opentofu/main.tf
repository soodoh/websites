variable "aws_region" {
  description = "AWS region containing the DiLoreto production stack."
  type        = string
}

variable "branch_name" {
  type    = string
  default = "main"
}

variable "domain_name" {
  type    = string
  default = "diloreto.com"
}

variable "deployment_role_name" {
  type    = string
  default = "diloreto-website-github-deploy"
}

variable "github_oidc_provider_arn" {
  description = "OIDC provider ARN output from the account-foundation root."
  type        = string
}

variable "operational_alarm_topic_arn" {
  description = "SNS topic ARN output from the account-foundation root."
  type        = string
}

variable "enable_operational_alarm" {
  description = "Create the 5xx alarm wired to the shared operational topic."
  type        = bool
  default     = true
}

variable "deployment_marker_path" {
  description = "Deployment marker path that must receive the no-store cache policy."
  type        = string
  default     = "/__deployment.json"
}

variable "managed_by" {
  description = "Keep CloudFormation through the no-change import, then change to OpenTofu after handoff."
  type        = string
  default     = "CloudFormation"

  validation {
    condition     = contains(["CloudFormation", "OpenTofu"], var.managed_by)
    error_message = "managed_by must be CloudFormation or OpenTofu."
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  base_tags = {
    Project   = "diloreto-website"
    ManagedBy = var.managed_by
  }

  alarm_tags = merge(local.base_tags, {
    Environment = "production"
  })

  # Amplify preserves this JSON's key order, so load the canonical read form to keep plans stable.
  custom_headers = replace(
    chomp(file("${path.module}/custom-headers.json.tftpl")),
    "$DEPLOYMENT_MARKER_PATH",
    var.deployment_marker_path,
  )
}

resource "aws_amplify_app" "production" {
  name                        = "diloreto-website"
  description                 = "Static site for diloreto.com, deployed by GitHub Actions and served directly by Amplify Hosting."
  platform                    = "WEB"
  enable_branch_auto_deletion = false
  custom_headers              = local.custom_headers

  custom_rule {
    source = "https://www.${var.domain_name}"
    target = "https://${var.domain_name}"
    status = "301"
  }

  custom_rule {
    source = "https://paul.${var.domain_name}"
    target = "https://pauldiloreto.com"
    status = "301"
  }

  custom_rule {
    source = "/<*>"
    target = "/404.html"
    status = "404-200"
  }

  tags = local.base_tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_amplify_branch" "production" {
  app_id                      = aws_amplify_app.production.id
  branch_name                 = var.branch_name
  description                 = "Production branch populated by GitHub Actions manual deployments."
  stage                       = "PRODUCTION"
  enable_auto_build           = false
  enable_performance_mode     = false
  enable_pull_request_preview = false
  tags                        = local.base_tags
}

resource "aws_amplify_domain_association" "production" {
  app_id                 = aws_amplify_app.production.id
  domain_name            = var.domain_name
  enable_auto_sub_domain = false
  wait_for_verification  = false

  sub_domain {
    branch_name = aws_amplify_branch.production.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.production.branch_name
    prefix      = "www"
  }

  sub_domain {
    branch_name = aws_amplify_branch.production.branch_name
    prefix      = "paul"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudwatch_metric_alarm" "amplify_5xx" {
  count = var.enable_operational_alarm ? 1 : 0

  alarm_name          = "diloreto-amplify-production-5xx"
  alarm_description   = "Amplify Hosting returned at least two 5xx responses in two of three five-minute periods."
  namespace           = "AWS/AmplifyHosting"
  metric_name         = "5xxErrors"
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = 2
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.operational_alarm_topic_arn]
  ok_actions          = [var.operational_alarm_topic_arn]

  dimensions = {
    App = aws_amplify_app.production.id
  }

  tags = local.alarm_tags
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [var.github_oidc_provider_arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:soodoh@18269267/websites@1358469291:environment:production-diloreto"]
    }
  }
}

resource "aws_iam_role" "github_deployment" {
  name                 = var.deployment_role_name
  description          = "Publishes validated static artifacts to the diloreto-website Amplify main branch."
  max_session_duration = 3600
  assume_role_policy   = data.aws_iam_policy_document.github_assume_role.json
  tags                 = local.base_tags
}

data "aws_iam_policy_document" "github_deployment" {
  statement {
    effect = "Allow"
    actions = [
      "amplify:CreateDeployment",
      "amplify:StartDeployment",
    ]
    resources = ["${aws_amplify_branch.production.arn}/deployments/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["amplify:GetJob"]
    resources = ["${aws_amplify_branch.production.arn}/jobs/*"]
  }
}

resource "aws_iam_role_policy" "github_deployment" {
  name   = "PublishAmplifyArtifacts"
  role   = aws_iam_role.github_deployment.id
  policy = data.aws_iam_policy_document.github_deployment.json
}

output "amplify_app_id" {
  value = aws_amplify_app.production.id
}

output "amplify_app_arn" {
  value = aws_amplify_app.production.arn
}

output "amplify_default_domain" {
  value = aws_amplify_app.production.default_domain
}

output "amplify_branch_name" {
  value = aws_amplify_branch.production.branch_name
}

output "amplify_branch_arn" {
  value = aws_amplify_branch.production.arn
}

output "amplify_branch_url" {
  value = "https://${aws_amplify_branch.production.branch_name}.${aws_amplify_app.production.default_domain}"
}

output "amplify_domain_arn" {
  value = aws_amplify_domain_association.production.arn
}

output "amplify_certificate_record" {
  value = aws_amplify_domain_association.production.certificate_verification_dns_record
}

output "github_deployment_role_arn" {
  value = aws_iam_role.github_deployment.arn
}

output "production_url" {
  value = "https://${var.domain_name}"
}

output "paul_redirect_url" {
  value = "https://paul.${var.domain_name}"
}
