provider "aws" {
  region = var.aws_region
}

# Call our reusable blueprint, passing in our variables
module "menu_images_cdn" {
  source = "../../modules/secure-cdn"

  # We combine the prefix from our .tfvars with the random suffix
  bucket_name = "${var.bucket_prefix}-${random_id.suffix.hex}"
  environment = var.environment
}

resource "random_id" "suffix" {
  byte_length = 4
}