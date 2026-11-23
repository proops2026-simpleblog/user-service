# Env-level inputs. Values: terraform.tfvars (committed, env-specific)
# + personal.auto.tfvars (gitignored: owner, email, responsible_party).

variable "prefix" {
  description = "Org shortcode"
  type        = string
}

variable "project" {
  description = "Project shortcode"
  type        = string
}

variable "environment" {
  description = "dev / test / prod"
  type        = string
}

variable "region" {
  description = "AWS region assigned by the trainer"
  type        = string
}

variable "region_code" {
  description = "Compact region code used in names"
  type        = string
}

variable "responsible_party" {
  description = "Team contact email (ResponsibleParty tag)"
  type        = string
}

variable "owner" {
  description = "Trainee channel name (Owner tag) — trainer filters resources by this"
  type        = string
}

variable "email" {
  description = "Trainee email (Email tag) — trainer policy requires it on every resource"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type for the API server"
  type        = string
  default     = "t3.micro"
}

variable "purpose" {
  description = "Name suffix for the API server"
  type        = string
  default     = "api-server"
}
