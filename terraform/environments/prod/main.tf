provider "aws" {
  region = "ca-central-1" # Keeping it in Canada!
}

# Call our reusable blueprint, but feed it PROD data
module "menu_images_cdn" {
  source = "../../modules/secure-cdn"

  bucket_name = "prod-momotaro-menu-images-${random_id.suffix.hex}"
  environment = "prod"
}

resource "random_id" "suffix" {
  byte_length = 4
}