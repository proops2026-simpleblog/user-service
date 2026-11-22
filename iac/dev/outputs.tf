output "api_server_name" {
  description = "Name produced by the convention"
  value       = module.api_server.name
}

output "api_server_id" {
  description = "EC2 instance ID"
  value       = module.api_server.id
}

output "api_server_public_ip" {
  description = "Public IP"
  value       = module.api_server.public_ip
}

output "api_server_tags" {
  description = "Final merged tags on the instance"
  value       = module.api_server.tags
}
