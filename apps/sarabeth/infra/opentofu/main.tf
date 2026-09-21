variable "aws_region" {
  description = "AWS region containing the Sarabeth production stack."
  type        = string
  default     = "us-west-2"
}

variable "aws_account_id" {
  description = "Production AWS account ID."
  type        = string
  default     = "015989770400"
}

variable "github_owner" {
  type    = string
  default = "soodoh"
}

variable "github_repository" {
  type    = string
  default = "websites"
}

variable "github_branch" {
  type    = string
  default = "main"
}

variable "domain_name" {
  type    = string
  default = "sarabethbelon.com"
}

variable "github_oidc_provider_arn" {
  description = "OIDC provider ARN output from the account-foundation root."
  type        = string
}

variable "account_state_bucket_name" {
  description = "S3 bucket output from the account-foundation root."
  type        = string
}

variable "operational_alarm_topic_arn" {
  description = "SNS topic ARN output from the account-foundation root."
  type        = string
}

variable "contentful_space_id" {
  description = "Non-secret Contentful space identifier used during production builds."
  type        = string
}

variable "amplify_cloudfront_target" {
  description = "CloudFront hostname returned by the existing Amplify domain association."
  type        = string
}

variable "amplify_certificate_record_name" {
  description = "ACM validation record name returned by the existing Amplify domain association."
  type        = string
}

variable "amplify_certificate_record_value" {
  description = "ACM validation record value returned by the existing Amplify domain association."
  type        = string
}

variable "write_target_custom_headers" {
  description = "Use Amplify's required top-level YAML only for a reviewed header update, then return to canonical JSON."
  type        = bool
  default     = false
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
  repository_url          = "https://github.com/${var.github_owner}/${var.github_repository}"
  contentful_state_bucket = "websites-sarabeth-contentful-tofu-state-${var.aws_account_id}-${var.aws_region}"
  contentful_state_key    = "contentful/terraform.tfstate"

  tags = {
    Project     = "sarabeth-studio"
    Environment = "production"
    ManagedBy   = "OpenTofu"
  }

  target_custom_headers = chomp(file("${path.module}/custom-headers.json.tftpl"))

  target_custom_headers_write = <<-YAML
    customHeaders:
      - pattern: "**/*"
        headers:
          - key: "Strict-Transport-Security"
            value: "max-age=63072000; includeSubDomains"
          - key: "X-Content-Type-Options"
            value: "nosniff"
          - key: "Referrer-Policy"
            value: "strict-origin-when-cross-origin"
          - key: "X-Frame-Options"
            value: "DENY"
          - key: "Permissions-Policy"
            value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
      - pattern: "**/*.html"
        headers:
          - key: "Cache-Control"
            value: "no-cache, no-store, must-revalidate"
      - pattern: "/"
        headers:
          - key: "Cache-Control"
            value: "no-cache, no-store, must-revalidate"
      - pattern: "/assets/*"
        headers:
          - key: "Cache-Control"
            value: "public, max-age=31536000, immutable"
      - pattern: "/__tsr/staticServerFnCache/*"
        headers:
          - key: "Cache-Control"
            value: "public, max-age=31536000, immutable"
      - pattern: "/__deployment.json"
        headers:
          - key: "Cache-Control"
            value: "no-cache, no-store, must-revalidate"
  YAML

  custom_headers = var.write_target_custom_headers ? local.target_custom_headers_write : local.target_custom_headers
}

data "aws_iam_policy_document" "workload_boundary" {
  statement {
    sid    = "AmplifyJobs"
    effect = "Allow"
    actions = [
      "amplify:GetApp",
      "amplify:GetBranch",
      "amplify:GetJob",
      "amplify:ListJobs",
      "amplify:StartJob",
      "amplify:StopJob",
      "amplify:UpdateBranch",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "ContentfulBuildParameter"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${var.aws_account_id}:parameter/sarabeth-studio/production/contentful/access-token"]
  }

  statement {
    sid    = "ContentfulOpenTofuState"
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:ListBucket",
      "s3:PutObject",
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::${local.contentful_state_bucket}",
      "arn:${data.aws_partition.current.partition}:s3:::${local.contentful_state_bucket}/${local.contentful_state_key}",
      "arn:${data.aws_partition.current.partition}:s3:::${local.contentful_state_bucket}/${local.contentful_state_key}.tflock",
    ]
  }

  statement {
    sid       = "YouTubeRuntimeParameter"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${var.aws_account_id}:parameter/sarabeth-studio/production/youtube/api-key"]
  }

  statement {
    sid       = "ContactEmail"
    effect    = "Allow"
    actions   = ["ses:SendEmail"]
    resources = ["arn:${data.aws_partition.current.partition}:ses:${var.aws_region}:${var.aws_account_id}:identity/${var.domain_name}"]

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "ses:Recipients"
      values   = ["sarabethstudio@gmail.com"]
    }
  }

  statement {
    sid       = "ContactEmailRateLimit"
    effect    = "Allow"
    actions   = ["dynamodb:UpdateItem"]
    resources = ["arn:${data.aws_partition.current.partition}:dynamodb:${var.aws_region}:${var.aws_account_id}:table/sarabeth-contact-email-rate-limit"]
  }

  statement {
    sid    = "ApplicationLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:DescribeLogGroups",
      "logs:PutLogEvents",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_policy" "workload_boundary" {
  name        = "sarabeth-amplify-workload-boundary"
  description = "Maximum permissions for roles created by the sarabeth Amplify infrastructure stack."
  policy      = data.aws_iam_policy_document.workload_boundary.json

  lifecycle {
    prevent_destroy = true
  }
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
  name                 = "sarabeth-amplify-service"
  description          = "Allows Amplify builds to read the Contentful SSM parameter and deliver SSR logs."
  permissions_boundary = aws_iam_policy.workload_boundary.arn
  assume_role_policy   = data.aws_iam_policy_document.amplify_service_assume_role.json
}

data "aws_iam_policy_document" "amplify_service" {
  statement {
    sid       = "ReadContentfulBuildParameter"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${var.aws_account_id}:parameter/sarabeth-studio/production/contentful/access-token"]
  }

  statement {
    sid       = "VerifyAmplifyBuildSource"
    effect    = "Allow"
    actions   = ["amplify:GetJob"]
    resources = ["arn:${data.aws_partition.current.partition}:amplify:${var.aws_region}:${var.aws_account_id}:apps/*/branches/*/jobs/*"]
  }

  statement {
    sid       = "DescribeAmplifyLogGroups"
    effect    = "Allow"
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }

  statement {
    sid       = "CreateAmplifyLogGroups"
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup"]
    resources = ["arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/amplify/*"]
  }

  statement {
    sid       = "WriteAmplifyLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${var.aws_account_id}:log-group:/aws/amplify/*:log-stream:*"]
  }
}

resource "aws_iam_role_policy" "amplify_service" {
  name   = "ContentfulBuildParameterAndSsrLogs"
  role   = aws_iam_role.amplify_service.id
  policy = data.aws_iam_policy_document.amplify_service.json
}

resource "aws_dynamodb_table" "email_rate_limit" {
  name         = "sarabeth-contact-email-rate-limit"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "window"

  attribute {
    name = "window"
    type = "S"
  }

  server_side_encryption {
    enabled = true
  }

  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }

  tags = local.tags
}

resource "aws_amplify_app" "production" {
  name                        = "sarabeth-studio-production"
  description                 = "Production TanStack Start application for sarabethbelon.com."
  repository                  = local.repository_url
  platform                    = "WEB_COMPUTE"
  iam_service_role_arn        = aws_iam_role.amplify_service.arn
  enable_branch_auto_deletion = false
  custom_headers              = local.custom_headers

  custom_rule {
    source = "https://www.${var.domain_name}"
    target = "https://${var.domain_name}"
    status = "301"
  }

  dynamic "custom_rule" {
    for_each = toset(["about", "contact", "engagements", "lessons", "media", "privacy"])
    content {
      source = "/${custom_rule.value}"
      target = "/${custom_rule.value}.html"
      status = "200"
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
      values   = ["${aws_amplify_app.production.arn}/branches/${var.github_branch}"]
    }

    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.aws_account_id]
    }
  }
}

resource "aws_iam_role" "amplify_compute" {
  name                 = "sarabeth-amplify-compute-main"
  description          = "Least-privilege contact email and YouTube playlist access for the production Amplify compute branch."
  permissions_boundary = aws_iam_policy.workload_boundary.arn
  assume_role_policy   = data.aws_iam_policy_document.amplify_compute_assume_role.json
}

data "aws_iam_policy_document" "amplify_compute" {
  statement {
    sid       = "SendContactEmail"
    effect    = "Allow"
    actions   = ["ses:SendEmail"]
    resources = ["arn:${data.aws_partition.current.partition}:ses:${var.aws_region}:${var.aws_account_id}:identity/${var.domain_name}"]

    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = ["contact@${var.domain_name}"]
    }

    condition {
      test     = "ForAllValues:StringEquals"
      variable = "ses:Recipients"
      values   = ["sarabethstudio@gmail.com"]
    }
  }

  statement {
    sid       = "UpdateContactEmailRateLimit"
    effect    = "Allow"
    actions   = ["dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.email_rate_limit.arn]
  }

  statement {
    sid       = "ReadYouTubeApiKey"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${var.aws_account_id}:parameter/sarabeth-studio/production/youtube/api-key"]
  }
}

resource "aws_iam_role_policy" "amplify_compute" {
  name   = "ProductionRuntimeAccess"
  role   = aws_iam_role.amplify_compute.id
  policy = data.aws_iam_policy_document.amplify_compute.json
}

resource "awscc_amplify_branch" "production" {
  app_id                      = aws_amplify_app.production.id
  branch_name                 = var.github_branch
  description                 = "Production branch; releases are started only after GitHub Actions CI succeeds."
  compute_role_arn            = aws_iam_role.amplify_compute.arn
  enable_auto_build           = false
  enable_performance_mode     = false
  enable_pull_request_preview = false
  enable_skew_protection      = false
  framework                   = "TanStack Start"
  stage                       = "PRODUCTION"

  environment_variables = [
    {
      name  = "AMPLIFY_MONOREPO_APP_ROOT"
      value = "apps/sarabeth"
    },
    {
      name  = "CONTENTFUL_ACCESS_TOKEN_PARAMETER"
      value = "/sarabeth-studio/production/contentful/access-token"
    },
    {
      name  = "CONTENTFUL_SPACE_ID"
      value = var.contentful_space_id
    },
    {
      name  = "EMAIL_RATE_LIMIT_TABLE"
      value = aws_dynamodb_table.email_rate_limit.name
    },
    {
      name  = "YOUTUBE_API_KEY_PARAMETER"
      value = "/sarabeth-studio/production/youtube/api-key"
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
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.contentful_state.arn,
      "${aws_s3_bucket.contentful_state.arn}/*",
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

resource "aws_s3_bucket_policy" "contentful_state" {
  bucket = aws_s3_bucket.contentful_state.id
  policy = data.aws_iam_policy_document.contentful_state_bucket.json
}

resource "aws_cloudwatch_log_group" "amplify_compute" {
  name              = "/aws/amplify/${aws_amplify_app.production.id}"
  retention_in_days = 30
  tags              = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_cloudwatch_metric_alarm" "amplify_5xx" {
  alarm_name          = "sarabeth-amplify-production-5xx"
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
  dimensions          = { App = aws_amplify_app.production.id }
  tags                = local.tags
}

resource "aws_cloudwatch_metric_alarm" "amplify_latency" {
  alarm_name          = "sarabeth-amplify-production-latency"
  alarm_description   = "Amplify Hosting average time to first byte exceeded five seconds twice."
  namespace           = "AWS/AmplifyHosting"
  metric_name         = "Latency"
  statistic           = "Average"
  unit                = "Seconds"
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

data "aws_iam_policy_document" "routine_deployment_assume_role" {
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
      values   = ["repo:soodoh@18269267/websites@1358469291:environment:production-sarabeth"]
    }
  }
}

resource "aws_iam_role" "routine_deployment" {
  name                 = "sarabeth-amplify-deploy-main"
  description          = "GitHub Actions role restricted to production releases of this Amplify app."
  permissions_boundary = aws_iam_policy.workload_boundary.arn
  max_session_duration = 3600
  assume_role_policy   = data.aws_iam_policy_document.routine_deployment_assume_role.json
}

data "aws_iam_policy_document" "routine_deployment" {
  statement {
    effect    = "Allow"
    actions   = ["amplify:GetBranch", "amplify:UpdateBranch"]
    resources = [awscc_amplify_branch.production.arn]
  }

  statement {
    effect    = "Allow"
    actions   = ["amplify:GetJob", "amplify:StartJob"]
    resources = ["${awscc_amplify_branch.production.arn}/jobs/*"]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.contentful_state.arn]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.contentful_state.arn}/${local.contentful_state_key}"]
  }

  statement {
    effect    = "Allow"
    actions   = ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.contentful_state.arn}/${local.contentful_state_key}.tflock"]
  }
}

resource "aws_iam_role_policy" "routine_deployment" {
  name   = "ReleaseSpecificAmplifyApp"
  role   = aws_iam_role.routine_deployment.id
  policy = data.aws_iam_policy_document.routine_deployment.json
}

resource "aws_amplify_domain_association" "production" {
  app_id                 = aws_amplify_app.production.id
  domain_name            = var.domain_name
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

resource "aws_route53_zone" "production" {
  name    = var.domain_name
  comment = "Production authoritative zone managed by sarabeth-studio OpenTofu."
  tags    = local.tags

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_route53_record" "apex_ipv4" {
  zone_id = aws_route53_zone.production.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.amplify_cloudfront_target
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "apex_ipv6" {
  zone_id = aws_route53_zone.production.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = var.amplify_cloudfront_target
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_ipv4" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.amplify_cloudfront_target
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "www_ipv6" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "www.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = var.amplify_cloudfront_target
    zone_id                = "Z2FDTNDATAQYW2"
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "amplify_certificate_validation" {
  zone_id = aws_route53_zone.production.zone_id
  name    = var.amplify_certificate_record_name
  type    = "CNAME"
  ttl     = 60
  records = [var.amplify_certificate_record_value]
}

resource "aws_route53_record" "mail_from_mx" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "mail.${var.domain_name}"
  type    = "MX"
  ttl     = 3600
  records = ["10 feedback-smtp.us-west-2.amazonses.com"]
}

resource "aws_route53_record" "mail_from_spf" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "mail.${var.domain_name}"
  type    = "TXT"
  ttl     = 3600
  records = ["v=spf1 include:amazonses.com ~all"]
}

resource "aws_route53_record" "dkim_one" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "cdvixypkuk3bhikurkjjlpzhtdyvkxlu._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 3600
  records = ["cdvixypkuk3bhikurkjjlpzhtdyvkxlu.dkim.amazonses.com"]
}

resource "aws_route53_record" "dkim_two" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "f53nvk4kwn642ycmamvoee6qw4ukhofb._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 3600
  records = ["f53nvk4kwn642ycmamvoee6qw4ukhofb.dkim.amazonses.com"]
}

resource "aws_route53_record" "dkim_three" {
  zone_id = aws_route53_zone.production.zone_id
  name    = "y7w6a6ou2nzlwdzd4dfkci5wxmkydzir._domainkey.${var.domain_name}"
  type    = "CNAME"
  ttl     = 3600
  records = ["y7w6a6ou2nzlwdzd4dfkci5wxmkydzir.dkim.amazonses.com"]
}

data "aws_iam_policy_document" "infrastructure_assume_role" {
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
      values   = ["repo:soodoh@18269267/websites@1358469291:environment:production-sarabeth"]
    }
  }
}

resource "aws_iam_role" "infrastructure" {
  name                 = "sarabeth-amplify-infrastructure-github"
  description          = "Protected GitHub Actions role for sarabeth-studio OpenTofu changes."
  max_session_duration = 14400
  assume_role_policy   = data.aws_iam_policy_document.infrastructure_assume_role.json
}

data "aws_iam_policy_document" "infrastructure" {
  statement {
    sid       = "Amplify"
    effect    = "Allow"
    actions   = ["amplify:*"]
    resources = ["*"]
  }

  statement {
    sid     = "StateBucket"
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.contentful_state.arn,
      "${aws_s3_bucket.contentful_state.arn}/*",
      "arn:${data.aws_partition.current.partition}:s3:::${var.account_state_bucket_name}",
      "arn:${data.aws_partition.current.partition}:s3:::${var.account_state_bucket_name}/*",
    ]
  }

  statement {
    sid    = "ProjectIam"
    effect = "Allow"
    actions = [
      "iam:CreatePolicy",
      "iam:CreatePolicyVersion",
      "iam:CreateRole",
      "iam:DeletePolicy",
      "iam:DeletePolicyVersion",
      "iam:DeleteRole",
      "iam:DeleteRolePermissionsBoundary",
      "iam:DeleteRolePolicy",
      "iam:GetPolicy",
      "iam:GetPolicyVersion",
      "iam:GetRole",
      "iam:GetRolePolicy",
      "iam:ListAttachedRolePolicies",
      "iam:ListInstanceProfilesForRole",
      "iam:ListPolicyTags",
      "iam:ListPolicyVersions",
      "iam:ListRolePolicies",
      "iam:ListRoleTags",
      "iam:PutRolePermissionsBoundary",
      "iam:PutRolePolicy",
      "iam:TagPolicy",
      "iam:TagRole",
      "iam:UntagPolicy",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:UpdateRole",
      "iam:UpdateRoleDescription",
    ]
    resources = [
      aws_iam_policy.workload_boundary.arn,
      "arn:${data.aws_partition.current.partition}:iam::${var.aws_account_id}:role/sarabeth-amplify-*",
    ]
  }

  statement {
    sid       = "PassProjectRoles"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = ["arn:${data.aws_partition.current.partition}:iam::${var.aws_account_id}:role/sarabeth-amplify-*"]
  }

  statement {
    sid    = "ProjectResources"
    effect = "Allow"
    actions = [
      "cloudwatch:DeleteAlarms",
      "cloudwatch:DescribeAlarms",
      "cloudwatch:ListTagsForResource",
      "cloudwatch:PutMetricAlarm",
      "cloudwatch:TagResource",
      "cloudwatch:UntagResource",
      "dynamodb:CreateTable",
      "dynamodb:DeleteTable",
      "dynamodb:DescribeContinuousBackups",
      "dynamodb:DescribeTable",
      "dynamodb:DescribeTimeToLive",
      "dynamodb:ListTagsOfResource",
      "dynamodb:TagResource",
      "dynamodb:UntagResource",
      "dynamodb:UpdateContinuousBackups",
      "dynamodb:UpdateTable",
      "dynamodb:UpdateTimeToLive",
      "logs:CreateLogGroup",
      "logs:DeleteLogGroup",
      "logs:DeleteRetentionPolicy",
      "logs:DescribeIndexPolicies",
      "logs:DescribeLogGroups",
      "logs:ListTagsForResource",
      "logs:PutRetentionPolicy",
      "logs:TagResource",
      "logs:UntagResource",
      "route53:ChangeResourceRecordSets",
      "route53:ChangeTagsForResource",
      "route53:CreateHostedZone",
      "route53:DeleteHostedZone",
      "route53:GetChange",
      "route53:GetDNSSEC",
      "route53:GetHostedZone",
      "route53:ListHostedZones",
      "route53:ListQueryLoggingConfigs",
      "route53:ListResourceRecordSets",
      "route53:ListTagsForResource",
    ]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "infrastructure" {
  name   = "ManageSarabethOpenTofu"
  role   = aws_iam_role.infrastructure.id
  policy = data.aws_iam_policy_document.infrastructure.json
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

output "amplify_branch_url" {
  value = "https://${var.github_branch}.${aws_amplify_app.production.default_domain}"
}

output "amplify_service_role_arn" {
  value = aws_iam_role.amplify_service.arn
}

output "amplify_compute_role_arn" {
  value = aws_iam_role.amplify_compute.arn
}

output "routine_deployment_role_arn" {
  value = aws_iam_role.routine_deployment.arn
}

output "infrastructure_role_arn" {
  value = aws_iam_role.infrastructure.arn
}

output "contentful_state_bucket_name" {
  value = aws_s3_bucket.contentful_state.id
}

output "compute_log_group_name" {
  value = aws_cloudwatch_log_group.amplify_compute.name
}

output "hosted_zone_id" {
  value = aws_route53_zone.production.zone_id
}
