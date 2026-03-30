variable "aws_region" {
  description = "The AWS region to deploy into"
  type        = string
  default     = "ca-central-1"
}

variable "environment" {
  description = "The environment name (e.g., dev, prod)"
  type        = string
}

variable "bucket_prefix" {
  description = "The prefix for the S3 bucket name"
  type        = string
}