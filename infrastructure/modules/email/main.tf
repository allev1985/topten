locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )

  use_domain = var.domain != ""
}

# ------------------------------------------------------------------------------
# SES Domain Identity (when a domain is provided)
# Requires DNS verification — the output provides the verification token
# that must be added as a TXT record.
# ------------------------------------------------------------------------------

resource "aws_ses_domain_identity" "main" {
  count  = local.use_domain ? 1 : 0
  domain = var.domain
}

resource "aws_ses_domain_dkim" "main" {
  count  = local.use_domain ? 1 : 0
  domain = aws_ses_domain_identity.main[0].domain
}

# ------------------------------------------------------------------------------
# SES Email Identity (when no domain is available — sandbox mode)
# ------------------------------------------------------------------------------

resource "aws_ses_email_identity" "main" {
  count = local.use_domain ? 0 : (var.email_address != "" ? 1 : 0)
  email = var.email_address
}

# ------------------------------------------------------------------------------
# SMTP Credentials
# SES SMTP uses an IAM user with ses:SendRawEmail permission.
# The access key is converted to SMTP credentials by AWS.
# ------------------------------------------------------------------------------

resource "aws_iam_user" "ses_smtp" {
  name = "${var.project_name}-${var.environment}-ses-smtp"
  tags = local.common_tags
}

resource "aws_iam_user_policy" "ses_smtp" {
  name = "ses-send-email"
  user = aws_iam_user.ses_smtp.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = "ses:SendRawEmail"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_access_key" "ses_smtp" {
  user = aws_iam_user.ses_smtp.name
}
