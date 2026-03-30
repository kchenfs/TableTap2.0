output "FINAL_CLOUDFRONT_URL" {
  description = "The PROD CloudFront URL for your DynamoDB database"
  value       = "https://${module.menu_images_cdn.cloudfront_domain_name}"
}

output "FINAL_S3_BUCKET" {
  description = "The PROD bucket your Python script will upload to"
  value       = module.menu_images_cdn.s3_bucket_name
}