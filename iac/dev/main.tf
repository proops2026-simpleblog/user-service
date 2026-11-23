locals {
  # Layer 1 — common tags for every resource in this env (set once, passed to every module)
  tags = {
    Project          = var.project
    Environment      = var.environment
    ResponsibleParty = var.responsible_party
    Owner            = var.owner
    Email            = var.email
  }
}

module "api_server" {
  source = "../modules/aws_ec2"

  # Standard 6 — every module gets these
  prefix      = var.prefix
  project     = var.project
  environment = var.environment
  region_code = var.region_code
  region      = var.region
  tags        = local.tags

  # EC2-specific
  purpose          = var.purpose
  application_role = "EC2 API Server (user-service)"
  instance_type    = var.instance_type
}
