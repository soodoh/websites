variable "aws_account_id" {
  type    = string
  default = "725669362139"
}

variable "aws_region" {
  type    = string
  default = "us-west-2"
}

variable "contentful_space_id" {
  description = "Non-secret Contentful space identifier."
  type        = string
}

variable "operational_alarm_topic_arn" {
  description = "SNS topic ARN output from the account-foundation root."
  type        = string
}

variable "github_oidc_provider_arn" {
  description = "OIDC provider ARN output from the account-foundation root."
  type        = string
}

variable "amplify_service_role_name" {
  description = "Physical name of the existing CDK-created Amplify service role."
  type        = string
}

variable "amplify_service_policy_name" {
  description = "Physical name of the existing CDK-created service-role inline policy."
  type        = string
}

variable "amplify_compute_role_name" {
  description = "Physical name of the existing CDK-created Amplify compute role."
  type        = string
}

variable "amplify_compute_policy_name" {
  description = "Physical name of the existing CDK-created compute-role inline policy."
  type        = string
}

variable "github_deployment_role_name" {
  description = "Physical name of the existing CDK-created GitHub deployment role."
  type        = string
}

variable "github_deployment_policy_name" {
  description = "Physical name of the existing CDK-created deployment-role inline policy."
  type        = string
}

variable "amplify_5xx_alarm_name" {
  description = "Physical name of the existing CDK-created 5xx alarm."
  type        = string
}

variable "amplify_latency_alarm_name" {
  description = "Physical name of the latency alarm."
  type        = string
  default     = "carolyn-amplify-production-latency"
}

variable "enable_custom_headers" {
  description = "Apply the target Amplify custom-header policy after ownership handoff."
  type        = bool
  default     = true
}

variable "enable_latency_alarm" {
  description = "Create the target latency alarm after ownership handoff."
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "Amplify compute log retention. Keep the imported value through handoff, then select the target value."
  type        = number
  default     = 30
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.aws_account_id]
}

provider "awscc" {
  region = var.aws_region
}

data "aws_partition" "current" {}

locals {
  domain_name              = "carolyndiloreto.com"
  legacy_domain_name       = "diloreto.com"
  legacy_domain_prefix     = "carolyn"
  repository_url           = "https://github.com/soodoh/websites"
  production_branch        = "main"
  contentful_state_bucket  = "websites-carolyn-contentful-tofu-state-${var.aws_account_id}-${var.aws_region}"
  contentful_state_key     = "contentful/terraform.tfstate"
  contentful_parameter     = "/carolyn-portfolio/prod/contentful-access-token"
  project_auth_parameter   = "/carolyn-portfolio/prod/project-auth-secret"
  contentful_parameter_arn = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${var.aws_account_id}:parameter${local.contentful_parameter}"
  project_auth_arn         = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${var.aws_account_id}:parameter${local.project_auth_parameter}"

  tags = {
    Project     = "carolyn-portfolio"
    Environment = "production"
    ManagedBy   = "OpenTofu"
  }

  # Amplify preserves this JSON's key order, so load the canonical read form to keep plans stable.
  custom_headers = chomp(file("${path.module}/custom-headers.json.tftpl"))
}

data "aws_iam_policy_document" "amplify_service_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:${data.aws_partition.current.partition}:amplify:${var.aws_region}:${var.aws_account_id}:apps/*"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.aws_account_id]
    }
  }
}

resource "aws_iam_role" "amplify_service" {
  name               = var.amplify_service_role_name
  description        = "Allows Amplify builds to read production secrets and Amplify SSR to publish bounded CloudWatch logs"
  assume_role_policy = data.aws_iam_policy_document.amplify_service_assume_role.json
  tags               = local.tags
}

data "aws_iam_policy_document" "amplify_service" {
  statement {
    actions = ["ssm:GetParameter"]
    resources = [
      local.contentful_parameter_arn,
      local.project_auth_arn,
    ]
  }

  statement {
    actions   = ["logs:CreateLogGroup"]
    resources = ["arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/amplify/*"]
  }

  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/amplify/*:log-stream:*"]
  }

  statement {
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "amplify_service" {
  name   = var.amplify_service_policy_name
  role   = aws_iam_role.amplify_service.id
  policy = data.aws_iam_policy_document.amplify_service.json
}

resource "aws_amplify_app" "production" {
  name                        = "carolyn-portfolio"
  description                 = "Carolyn DiLoreto portfolio production hosting"
  repository                  = local.repository_url
  platform                    = "WEB_COMPUTE"
  enable_branch_auto_deletion = false
  iam_service_role_arn        = aws_iam_role.amplify_service.arn
  build_spec                  = file("${path.root}/../../../../amplify.yml")
  custom_headers              = var.enable_custom_headers ? local.custom_headers : null

  cache_config {
    type = "AMPLIFY_MANAGED"
  }

  custom_rule {
    source = "https://www.${local.domain_name}"
    status = "301"
    target = "https://${local.domain_name}"
  }

  custom_rule {
    source = "https://${local.legacy_domain_prefix}.${local.legacy_domain_name}"
    status = "301"
    target = "https://${local.domain_name}"
  }

  dynamic "custom_rule" {
    for_each = toset(["/about", "/photography", "/projects"])
    content {
      source = "${custom_rule.value}/"
      status = "301"
      target = custom_rule.value
    }
  }

  tags = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

data "aws_iam_policy_document" "amplify_compute_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["amplify.amazonaws.com"]
    }

    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["${aws_amplify_app.production.arn}/branches/*"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.aws_account_id]
    }
  }
}

resource "aws_iam_role" "amplify_compute" {
  name               = var.amplify_compute_role_name
  description        = "App-scoped SSR role for the Carolyn Portfolio project authorization secret"
  assume_role_policy = data.aws_iam_policy_document.amplify_compute_assume_role.json
  tags               = local.tags
}

data "aws_iam_policy_document" "amplify_compute" {
  statement {
    actions   = ["ssm:GetParameter"]
    resources = [local.project_auth_arn]
  }
}

resource "aws_iam_role_policy" "amplify_compute" {
  name   = var.amplify_compute_policy_name
  role   = aws_iam_role.amplify_compute.id
  policy = data.aws_iam_policy_document.amplify_compute.json
}

resource "awscc_amplify_branch" "production" {
  app_id                      = aws_amplify_app.production.id
  branch_name                 = local.production_branch
  description                 = "Exact-SHA production releases from GitHub Actions"
  compute_role_arn            = aws_iam_role.amplify_compute.arn
  enable_auto_build           = false
  enable_performance_mode     = false
  enable_pull_request_preview = false
  framework                   = "Nitro"
  stage                       = "PRODUCTION"

  environment_variables = [
    {
      name  = "AMPLIFY_MONOREPO_APP_ROOT"
      value = "apps/carolyn"
    },
    {
      name  = "CONTENTFUL_SPACE_ID"
      value = var.contentful_space_id
    },
  ]

  tags = [for key, value in local.tags : {
    key   = key
    value = value
  }]

  # Cloud Control returns CloudFormation's immutable aws:* system tags.
  lifecycle {
    ignore_changes = [tags]
  }
}

resource "aws_amplify_domain_association" "production" {
  app_id                 = aws_amplify_app.production.id
  domain_name            = local.domain_name
  enable_auto_sub_domain = false
  wait_for_verification  = false

  sub_domain {
    branch_name = awscc_amplify_branch.production.branch_name
    prefix      = ""
  }

  sub_domain {
    branch_name = awscc_amplify_branch.production.branch_name
    prefix      = "www"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_amplify_domain_association" "legacy" {
  app_id                 = aws_amplify_app.production.id
  domain_name            = local.legacy_domain_name
  enable_auto_sub_domain = false
  wait_for_verification  = false

  sub_domain {
    branch_name = awscc_amplify_branch.production.branch_name
    prefix      = local.legacy_domain_prefix
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudwatch_log_group" "amplify_compute" {
  name              = "/aws/amplify/${aws_amplify_app.production.id}"
  retention_in_days = var.log_retention_days
  tags              = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudwatch_metric_alarm" "amplify_5xx" {
  alarm_name          = var.amplify_5xx_alarm_name
  alarm_description   = "Amplify Hosting returned at least two 5xx responses in two of three five-minute periods"
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
  dimensions          = { App = aws_amplify_app.production.id }
  tags                = local.tags
}

resource "aws_cloudwatch_metric_alarm" "amplify_latency" {
  count = var.enable_latency_alarm ? 1 : 0

  alarm_name          = var.amplify_latency_alarm_name
  alarm_description   = "Amplify Hosting average time to first byte exceeded five seconds in two of three five-minute periods"
  namespace           = "AWS/AmplifyHosting"
  metric_name         = "Latency"
  statistic           = "Average"
  period              = 300
  evaluation_periods  = 3
  datapoints_to_alarm = 2
  threshold           = 5
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [var.operational_alarm_topic_arn]
  ok_actions          = [var.operational_alarm_topic_arn]
  dimensions          = { App = aws_amplify_app.production.id }
  tags                = local.tags
}

resource "aws_s3_bucket" "contentful_state" {
  bucket = local.contentful_state_bucket
  tags   = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "contentful_state" {
  bucket = aws_s3_bucket.contentful_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "contentful_state" {
  bucket = aws_s3_bucket.contentful_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "contentful_state" {
  bucket                  = aws_s3_bucket.contentful_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_iam_policy_document" "contentful_state_bucket" {
  statement {
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.contentful_state.arn,
      "${aws_s3_bucket.contentful_state.arn}/*",
    ]

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "contentful_state" {
  bucket = aws_s3_bucket.contentful_state.id
  policy = data.aws_iam_policy_document.contentful_state_bucket.json
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
      values   = ["repo:soodoh@18269267/websites@1380705200:environment:production-carolyn"]
    }
  }
}

resource "aws_iam_role" "github_deployment" {
  name               = var.github_deployment_role_name
  description        = "Allows the Carolyn Portfolio production environment to release and monitor Amplify production"
  assume_role_policy = data.aws_iam_policy_document.github_assume_role.json
  tags               = local.tags
}

data "aws_iam_policy_document" "github_deployment" {
  statement {
    actions   = ["amplify:GetApp"]
    resources = [aws_amplify_app.production.arn]
  }

  statement {
    actions   = ["amplify:GetBranch", "amplify:UpdateBranch"]
    resources = [awscc_amplify_branch.production.arn]
  }

  statement {
    actions   = ["amplify:GetJob", "amplify:StartJob"]
    resources = ["${awscc_amplify_branch.production.arn}/jobs/*"]
  }

  statement {
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.contentful_state.arn]
  }

  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.contentful_state.arn}/${local.contentful_state_key}"]
  }

  statement {
    actions   = ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.contentful_state.arn}/${local.contentful_state_key}.tflock"]
  }
}

resource "aws_iam_role_policy" "github_deployment" {
  name   = var.github_deployment_policy_name
  role   = aws_iam_role.github_deployment.id
  policy = data.aws_iam_policy_document.github_deployment.json
}

output "amplify_app_id" {
  value = aws_amplify_app.production.id
}

output "amplify_default_domain" {
  value = aws_amplify_app.production.default_domain
}

output "amplify_production_url" {
  value = "https://${local.production_branch}.${aws_amplify_app.production.default_domain}"
}

output "production_branch_name" {
  value = local.production_branch
}

output "hosted_zone_id" {
  value = "Z32YJCERCJ1WLI"
}

output "hosted_zone_name_servers" {
  value = join(",", [
    "ns-1056.awsdns-04.org",
    "ns-1780.awsdns-30.co.uk",
    "ns-362.awsdns-45.com",
    "ns-917.awsdns-50.net",
  ])
}

output "github_deployment_role_arn" {
  value = aws_iam_role.github_deployment.arn
}

output "contentful_access_token_parameter" {
  value = local.contentful_parameter
}

output "project_auth_secret_parameter" {
  value = local.project_auth_parameter
}

output "contentful_state_bucket_name" {
  value = aws_s3_bucket.contentful_state.id
}
