# ===== STANDARD MODULE CONTRACT (every module takes these 6) =====

variable "prefix" {
  description = "Org or customer shortcode used in resource names (e.g. 'proops')"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.prefix))
    error_message = "prefix must be lowercase letters/digits only (it is one segment of the resource name)."
  }
}

variable "project" {
  description = "Project shortcode (e.g. 'blogcms')"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]+$", var.project))
    error_message = "project must be lowercase letters/digits only (it is one segment of the resource name)."
  }
}

variable "environment" {
  description = "Environment name: dev / test / prod"
  type        = string

  validation {
    condition     = contains(["dev", "test", "prod"], var.environment)
    error_message = "environment must be one of: dev, test, prod."
  }
}

variable "region_code" {
  description = "Compact region code used in names (e.g. 'use2' for us-east-2)"
  type        = string

  validation {
    condition     = can(regex("^[a-z]{3,4}[0-9]$", var.region_code))
    error_message = "region_code must look like 'use2' or 'apse2'."
  }
}

variable "region" {
  description = "Full AWS region name (e.g. 'us-east-2'). Must equal the provider's region (checked at plan)."
  type        = string
}

variable "tags" {
  description = "Layer-1 common tags from the env (Project, Environment, ResponsibleParty, Owner, Email)"
  type        = map(string)

  validation {
    condition     = alltrue([for k in ["Project", "Environment", "ResponsibleParty", "Owner", "Email"] : contains(keys(var.tags), k)])
    error_message = "tags must contain Project, Environment, ResponsibleParty, Owner and Email."
  }
  # In CI these values arrive as TF_VAR_* secrets; an unset secret becomes "" silently
  validation {
    condition     = alltrue([for v in values(var.tags) : trimspace(v) != ""])
    error_message = "Every common tag needs a non-empty value (check the TF_VAR_* secrets in CI)."
  }
}

# ===== EC2-SPECIFIC INPUTS =====

variable "purpose" {
  description = "What this EC2 is for — last segment of the name (e.g. 'api-server')"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.purpose))
    error_message = "purpose must be lowercase kebab-case (e.g. 'api-server')."
  }
}

variable "application_role" {
  description = "Human-readable ApplicationRole tag (e.g. 'EC2 API Server'). Defaults to 'EC2 <purpose>'."
  type        = string
  default     = null
}

variable "sensitive_data" {
  description = "Does this instance hold sensitive data? Becomes the SensitiveData tag."
  type        = bool
  default     = false
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"

  validation {
    condition     = can(regex("^t3\\.(nano|micro|small)$", var.instance_type))
    error_message = "Lab only allows t3.nano, t3.micro or t3.small (cost control)."
  }
}

variable "vpc_security_group_ids" {
  description = "Security group IDs to attach. Empty = the VPC's default SG."
  type        = list(string)
  default     = []
}

variable "subnet_id" {
  description = "Subnet ID to launch into. null = a default subnet of the default VPC."
  type        = string
  default     = null
}

variable "root_volume_size" {
  description = "Root EBS volume size in GiB (gp3, encrypted)"
  type        = number
  default     = 8
}
