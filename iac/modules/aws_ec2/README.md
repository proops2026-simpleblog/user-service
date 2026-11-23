# aws_ec2 module

Wraps [`terraform-aws-modules/ec2-instance/aws`](https://registry.terraform.io/modules/terraform-aws-modules/ec2-instance/aws) (`~> 5.6`) with proops2026 house rules:

- Name built from the naming convention (see below)
- Two-layer tags: the env's common tags + per-resource `Name` / `ApplicationRole` / `SensitiveData`
- IMDSv2 required, encrypted gp3 root volume, root volume tagged like the instance
- AMI looked up at plan time (latest Amazon Linux 2023), never hardcoded
- Plan fails if `region` does not match the caller's provider region

## Usage

```hcl
module "api_server" {
  source = "../modules/aws_ec2"

  # Standard 6
  prefix      = "proops"
  project     = "blogcms"
  environment = "dev"
  region_code = "use2"
  region      = "us-east-2"
  tags        = local.tags # Project, Environment, ResponsibleParty, Owner, Email

  # EC2-specific
  purpose          = "api-server"
  application_role = "EC2 API Server"
  instance_type    = "t3.micro"
}
```

## Inputs

| Name | Description | Type | Default | Required |
|---|---|---|---|---|
| prefix | Org / customer shortcode (lowercase, no dashes) | `string` | - | yes |
| project | Project shortcode (lowercase, no dashes) | `string` | - | yes |
| environment | `dev` / `test` / `prod` | `string` | - | yes |
| region_code | Compact region (`use2`, `apse2`) | `string` | - | yes |
| region | Full AWS region; must equal the provider region | `string` | - | yes |
| tags | Layer-1 tags; must include Project, Environment, ResponsibleParty, Owner, Email | `map(string)` | - | yes |
| purpose | Last segment of the name, kebab-case | `string` | - | yes |
| application_role | `ApplicationRole` tag | `string` | `"EC2 <purpose>"` | no |
| sensitive_data | `SensitiveData` tag | `bool` | `false` | no |
| instance_type | `t3.nano` / `t3.micro` / `t3.small` (lab cost guard) | `string` | `"t3.micro"` | no |
| subnet_id | Subnet to launch into | `string` | `null` (default VPC) | no |
| vpc_security_group_ids | Security groups | `list(string)` | `[]` (VPC default SG) | no |
| root_volume_size | Root volume GiB | `number` | `8` | no |

## Outputs

| Name | Description |
|---|---|
| instance | Full upstream ec2-instance module object |
| id | EC2 instance ID |
| public_ip | Public IP |
| private_ip | Private IP |
| name | Generated resource name |
| tags | Final merged tags on the instance |

## Naming convention

`{prefix}-{project}-{environment}-ec2-{region_code}-{purpose}`

Example: `proops-blogcms-dev-ec2-use2-api-server` (root volume: `…-api-server-root`)
