variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "api_key" {
  description = "API key for the dine-in Lambda endpoint"
  type        = string
  sensitive   = true
}

variable "api_dine_in" {
  description = "Dine-in API Gateway URL"
  type        = string
}
