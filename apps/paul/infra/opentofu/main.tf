variable "aws_region" {
  description = "AWS region containing the Paul production stack."
  type        = string
}

variable "amplify_app_name" {
  type    = string
  default = "pauldiloreto-portfolio"
}

variable "amplify_app_id" {
  description = "Physical ID of the imported Amplify app, used to keep IAM policy ARNs known during in-place app updates."
  type        = string
}

variable "domain_name" {
  type    = string
  default = "pauldiloreto.com"
}

variable "production_branch_name" {
  type    = string
  default = "main"
}

variable "hosted_zone_comment" {
  description = "Existing Route 53 hosted-zone comment preserved during import."
  type        = string
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

variable "resource_tags" {
  description = "Optional import-only override for exact existing tags; leave null in the active configuration."
  type        = map(string)
  default     = null
}

variable "github_deployment_role_name" {
  description = "Physical name of the imported GitHub deployment role."
  type        = string
}

variable "managed_by" {
  description = "Infrastructure owner recorded in resource tags. CloudFormation is valid only during an import handoff."
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
  target_tags = {
    Project     = "paul-portfolio"
    Environment = "production"
    ManagedBy   = var.managed_by
  }
  tags = var.resource_tags == null ? local.target_tags : var.resource_tags

  arn_partition = split(":", var.github_oidc_provider_arn)[1]
  aws_account   = split(":", var.github_oidc_provider_arn)[4]
  amplify_arn   = "arn:${local.arn_partition}:amplify:${var.aws_region}:${local.aws_account}:apps/${var.amplify_app_id}"
  branch_arn    = "${local.amplify_arn}/branches/${var.production_branch_name}"

  # Amplify preserves this JSON's key order, so load the canonical read form to keep plans stable.
  custom_headers = replace(
    chomp(file("${path.module}/custom-headers.json.tftpl")),
    "$DEPLOYMENT_MARKER_PATH",
    var.deployment_marker_path,
  )
}

resource "aws_route53_zone" "production" {
  name    = var.domain_name
  comment = var.hosted_zone_comment
  tags    = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_amplify_app" "production" {
  name                        = var.amplify_app_name
  description                 = "Provider-neutral static portfolio deployed exclusively by GitHub Actions."
  platform                    = "WEB"
  enable_branch_auto_deletion = false
  custom_headers              = local.custom_headers

  custom_rule {
    source = "https://www.${var.domain_name}"
    target = "https://${var.domain_name}"
    status = "301"
  }

  custom_rule {
    source = "/<*>"
    target = "/404.html"
    status = "404-200"
  }

  tags = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_amplify_branch" "production" {
  app_id                      = aws_amplify_app.production.id
  branch_name                 = var.production_branch_name
  description                 = "Production branch deployed directly by the protected GitHub Actions environment."
  enable_auto_build           = false
  enable_performance_mode     = false
  enable_pull_request_preview = false
  framework                   = "TanStack Start (static)"
  stage                       = "PRODUCTION"
  tags                        = local.tags
}

resource "aws_amplify_domain_association" "production" {
  app_id                 = aws_amplify_app.production.id
  domain_name            = var.domain_name
  enable_auto_sub_domain = false
  # Import omits this create-time waiter; false prevents a state-only handoff diff.
  wait_for_verification = false

  sub_domain {
    branch_name = aws_amplify_branch.production.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = aws_amplify_branch.production.branch_name
    prefix      = "www"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudwatch_metric_alarm" "amplify_5xx" {
  count = var.enable_operational_alarm ? 1 : 0

  alarm_name          = "paul-amplify-production-5xx"
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
    App = var.amplify_app_id
  }

  tags = local.tags
}

data "aws_iam_policy_document" "github_assume_role" {
  statement {
    sid     = "GitHubProductionEnvironmentOnly"
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
      values   = ["repo:soodoh@18269267/websites@1358469291:environment:production-portfolio"]
    }
  }
}

resource "aws_iam_role" "github_deployment" {
  name                 = var.github_deployment_role_name
  description          = "GitHub Actions OIDC role for direct deployments to this app's production branch."
  max_session_duration = 10800
  assume_role_policy   = data.aws_iam_policy_document.github_assume_role.json
  tags                 = local.tags
}

data "aws_iam_policy_document" "github_deployment" {
  statement {
    sid       = "ReadTargetApp"
    effect    = "Allow"
    actions   = ["amplify:GetApp"]
    resources = [local.amplify_arn]
  }

  statement {
    sid       = "DeployTargetBranches"
    effect    = "Allow"
    actions   = ["amplify:GetBranch", "amplify:ListJobs"]
    resources = [local.branch_arn]
  }

  statement {
    sid       = "CreateTargetBranchDeployments"
    effect    = "Allow"
    actions   = ["amplify:CreateDeployment", "amplify:StartDeployment"]
    resources = ["${local.branch_arn}/deployments/*"]
  }

  statement {
    sid       = "ManageTargetBranchJobs"
    effect    = "Allow"
    actions   = ["amplify:GetJob", "amplify:StopJob"]
    resources = ["${local.branch_arn}/jobs/*"]
  }
}

resource "aws_iam_role_policy" "github_deployment" {
  name   = "DeployVerifiedStaticArtifacts"
  role   = aws_iam_role.github_deployment.id
  policy = data.aws_iam_policy_document.github_deployment.json
}

output "amplify_app_id" {
  value = aws_amplify_app.production.id
}

output "github_deployment_role_arn" {
  value = aws_iam_role.github_deployment.arn
}

output "amplify_default_domain" {
  value = aws_amplify_app.production.default_domain
}

output "production_branch_url" {
  value = "https://${aws_amplify_branch.production.branch_name}.${aws_amplify_app.production.default_domain}"
}

output "hosted_zone_id" {
  value = aws_route53_zone.production.zone_id
}

output "route53_name_servers" {
  value = join(",", aws_route53_zone.production.name_servers)
}

output "amplify_certificate_record" {
  value = aws_amplify_domain_association.production.certificate_verification_dns_record
}
