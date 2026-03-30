variable "bucket_name" {
  description = "The name of the S3 bucket for menu images"
  type        = string
}

variable "environment" {
  description = "The environment (e.g., dev, prod)"
  type        = string
}