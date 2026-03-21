output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs for data layer and compute placement"
  value       = [for s in aws_subnet.private : s.id]
}

output "vpc_endpoint_security_group_id" {
  description = "Security group ID for VPC Interface Endpoints"
  value       = aws_security_group.vpc_endpoint.id
}
