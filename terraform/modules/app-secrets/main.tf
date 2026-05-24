resource "aws_ssm_parameter" "api_key" {
  name  = "/momotaro/${var.environment}/API_KEY"
  type  = "SecureString"
  value = var.api_key

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "api_dine_in" {
  name  = "/momotaro/${var.environment}/API_DINE_IN"
  type  = "String"
  value = var.api_dine_in

  tags = {
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_iam_user" "eso" {
  name = "momotaro-${var.environment}-eso"
}

resource "aws_iam_access_key" "eso" {
  user = aws_iam_user.eso.name
}

resource "aws_iam_user_policy" "eso_ssm" {
  name = "momotaro-${var.environment}-eso-ssm-read"
  user = aws_iam_user.eso.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:*:parameter/momotaro/${var.environment}/*"
      }
    ]
  })
}
