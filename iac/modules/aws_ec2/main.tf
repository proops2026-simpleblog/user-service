# aws_ec2 — facade over terraform-aws-modules/ec2-instance/aws.
# Upstream does the resource work; this module adds house rules:
# naming convention, two-layer tags, IMDSv2, encrypted gp3 root volume.

terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
}

# Which region is the caller's provider really pointing at?
data "aws_region" "current" {}

# Latest Amazon Linux 2023 — never hardcode AMI IDs (they differ per region and go stale)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

locals {
  # {prefix}-{project}-{environment}-{type}-{region_code}-{purpose} — built once, used twice
  name = "${var.prefix}-${var.project}-${var.environment}-ec2-${var.region_code}-${var.purpose}"

  # Layer 2 — per-resource tags merged on top of the env's layer-1 tags (later keys win)
  tags = merge(var.tags, {
    Name            = local.name
    ApplicationRole = coalesce(var.application_role, "EC2 ${var.purpose}")
    SensitiveData   = tostring(var.sensitive_data)
  })
}

module "ec2" {
  source  = "terraform-aws-modules/ec2-instance/aws"
  version = "~> 5.6" # >= 5.6, < 6.0 — minor upgrades only; majors break

  name          = local.name
  ami           = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  subnet_id = var.subnet_id
  # [] would make every plan try to strip the default SG AWS attaches → perpetual diff.
  # null = "let AWS choose", which is what an empty list means to the caller.
  vpc_security_group_ids = length(var.vpc_security_group_ids) > 0 ? var.vpc_security_group_ids : null

  # IMDSv2 only — blocks SSRF-style credential theft from instance metadata
  metadata_options = {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  root_block_device = [{
    volume_type = "gp3"
    volume_size = var.root_volume_size
    encrypted   = true
  }]

  tags = local.tags

  # Instance tags do not reach the root EBS volume — trainer rule needs Owner/Email there too
  volume_tags = merge(local.tags, { Name = "${local.name}-root" })
}

# Fail at plan time if the caller passed region="x" but the provider points at region "y"
resource "terraform_data" "region_guard" {
  lifecycle {
    precondition {
      condition     = data.aws_region.current.name == var.region
      error_message = "var.region (${var.region}) does not match the provider region (${data.aws_region.current.name})."
    }
  }
}
