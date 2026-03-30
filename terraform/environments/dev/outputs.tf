output "FINAL_CLOUDFRONT_URL" {
  description = "Put this base URL into your Python script/Database"
  value       = "https://${module.menu_images_cdn.cloudfront_domain_name}"
}

output "FINAL_S3_BUCKET" {
  description = "The bucket your Python script will upload to"
  value       = module.menu_images_cdn.s3_bucket_name
}