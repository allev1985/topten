locals {
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags,
  )

  vpc_endpoint_services = {
    secretsmanager = "com.amazonaws.${var.aws_region}.secretsmanager"
    ssm            = "com.amazonaws.${var.aws_region}.ssm"
    sts            = "com.amazonaws.${var.aws_region}.sts"
    logs           = "com.amazonaws.${var.aws_region}.logs"
  }

  private_subnet_cidrs = [for s in values(var.subnets) : s.private_cidr]
}

# ------------------------------------------------------------------------------
# VPC
# ------------------------------------------------------------------------------

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-vpc"
  })
}

# ------------------------------------------------------------------------------
# Subnets (for_each keyed by AZ for stable identity)
# ------------------------------------------------------------------------------

resource "aws_subnet" "public" {
  for_each = var.subnets

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.public_cidr
  availability_zone       = each.key
  map_public_ip_on_launch = false

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  for_each = var.subnets

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.private_cidr
  availability_zone = each.key

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-${each.key}"
    Tier = "private"
  })
}

# ------------------------------------------------------------------------------
# Internet Gateway
# A single IGW provides HA by design — AWS manages redundancy across all AZs
# in the region. There is no multi-AZ consideration needed unlike NAT Gateways.
# ------------------------------------------------------------------------------

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-igw"
  })
}

# ------------------------------------------------------------------------------
# NAT Gateways (for_each keyed by AZ for stable identity)
# In dev, deploy to a single AZ for cost saving.
# In prod, deploy one per AZ for high availability.
# ------------------------------------------------------------------------------

resource "aws_eip" "nat" {
  for_each = var.nat_gateway_azs
  domain   = "vpc"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-nat-eip-${each.key}"
  })
}

resource "aws_nat_gateway" "main" {
  for_each = var.nat_gateway_azs

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public[each.key].id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-nat-${each.key}"
  })

  depends_on = [aws_internet_gateway.main]
}

# ------------------------------------------------------------------------------
# Route Tables
# ------------------------------------------------------------------------------

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-public-rt"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  for_each = var.subnets

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

# Each AZ gets its own private route table pointing to its NAT gateway.
# If a NAT gateway is not deployed in a given AZ (dev mode), traffic is
# routed to the first available NAT gateway via the sorted-key lookup.
locals {
  sorted_nat_azs = sort(tolist(var.nat_gateway_azs))
}

resource "aws_route_table" "private" {
  for_each = var.subnets

  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-rt-${each.key}"
  })
}

resource "aws_route" "private_nat" {
  for_each = var.subnets

  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = contains(tolist(var.nat_gateway_azs), each.key) ? aws_nat_gateway.main[each.key].id : aws_nat_gateway.main[local.sorted_nat_azs[0]].id
}

resource "aws_route_table_association" "private" {
  for_each = var.subnets

  subnet_id      = aws_subnet.private[each.key].id
  route_table_id = aws_route_table.private[each.key].id
}

# ------------------------------------------------------------------------------
# Network ACLs
# ------------------------------------------------------------------------------

# Public NACL — allows HTTP/S inbound, ephemeral return traffic, and all outbound.
resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = [for s in aws_subnet.public : s.id]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-public-nacl"
  })
}

resource "aws_network_acl_rule" "public_ingress_https" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 443
  to_port        = 443
}

resource "aws_network_acl_rule" "public_ingress_http" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 110
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 80
  to_port        = 80
}

resource "aws_network_acl_rule" "public_ingress_ephemeral" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 200
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "public_egress_all" {
  network_acl_id = aws_network_acl.public.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Private NACL — allows traffic within the VPC and NAT return traffic.
# No direct inbound from the internet.
resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = [for s in aws_subnet.private : s.id]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-private-nacl"
  })
}

resource "aws_network_acl_rule" "private_ingress_vpc" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = var.vpc_cidr
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "private_ingress_ephemeral" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 200
  egress         = false
  protocol       = "tcp"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

resource "aws_network_acl_rule" "private_egress_all" {
  network_acl_id = aws_network_acl.private.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# ------------------------------------------------------------------------------
# VPC Endpoints (Interface)
# ------------------------------------------------------------------------------

resource "aws_vpc_endpoint" "interface" {
  for_each = local.vpc_endpoint_services

  vpc_id              = aws_vpc.main.id
  service_name        = each.value
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.vpc_endpoint.id]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-vpce-${each.key}"
  })
}

# ------------------------------------------------------------------------------
# VPC Flow Logs (conditional)
# ------------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name              = "/aws/vpc/flow-logs/${var.project_name}-${var.environment}"
  retention_in_days = var.flow_log_retention_days

  tags = local.common_tags
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.project_name}-${var.environment}-vpc-flow-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0

  name = "${var.project_name}-${var.environment}-vpc-flow-logs"
  role = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
        ]
        Resource = "${aws_cloudwatch_log_group.flow_logs[0].arn}:*"
      }
    ]
  })
}

resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0

  vpc_id               = aws_vpc.main.id
  traffic_type         = "ALL"
  log_destination_type = "cloud-watch-logs"
  log_destination      = aws_cloudwatch_log_group.flow_logs[0].arn
  iam_role_arn         = aws_iam_role.flow_logs[0].arn

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-flow-log"
  })
}

# ------------------------------------------------------------------------------
# Security Groups — only VPC-level concerns live here.
# Service-specific SGs (RDS, Redis, Amplify SSR) are owned by their modules.
# ------------------------------------------------------------------------------

resource "aws_security_group" "vpc_endpoint" {
  name        = "${var.project_name}-${var.environment}-vpc-endpoint"
  description = "Security group for VPC Interface Endpoints"
  vpc_id      = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-${var.environment}-vpc-endpoint-sg"
  })
}

resource "aws_security_group_rule" "vpc_endpoint_from_private_subnets" {
  for_each = var.subnets

  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = aws_security_group.vpc_endpoint.id
  cidr_blocks       = [each.value.private_cidr]
  description       = "Allow ingress from private subnet ${each.key} on port 443"
}
