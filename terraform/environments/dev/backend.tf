terraform {
  backend "s3" {
    # Replace with the exact name of the bucket you created manually
    bucket         = "momotaro-terraform-state-12345-dev-new-ui" 
    
    # The path inside the bucket where the state file will live
    key            = "dev/secure-cdn/terraform.tfstate" 
    
    region         = "ca-central-1"
    encrypt        = true
    
    # Replace with the exact name of the DynamoDB table you created
    dynamodb_table = "momotaro-terraform-locks-dev-new-ui" 
  }
}