terraform {
  required_version = ">= 1.10" # use_lockfile (S3-native state locking) needs 1.10+
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state (S3, bucket passed at init by the pipeline). One key per env:
  # dev and test can never overwrite each other's state.
  # Bucket is passed at init so no account ID is hardcoded:
  #   terraform init -backend-config="bucket=$TFSTATE_BUCKET"
  backend "s3" {
    key          = "day28/user-service/test/terraform.tfstate"
    region       = "us-east-2"
    use_lockfile = true
    encrypt      = true
  }
}

provider "aws" {
  region = var.region
}
