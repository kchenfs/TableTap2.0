output "eso_access_key_id" {
  description = "AWS access key ID for External Secrets Operator"
  value       = aws_iam_access_key.eso.id
}

output "eso_secret_access_key" {
  description = "AWS secret access key for External Secrets Operator"
  value       = aws_iam_access_key.eso.secret
  sensitive   = true
}
