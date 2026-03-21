from checkov.terraform.checks.resource.base_resource_check import BaseResourceCheck
from checkov.common.models.enums import CheckResult, CheckCategories


class RDSClusterNotPubliclyAccessible(BaseResourceCheck):
    """CKV_MYFAVES_001 - Ensure RDS cluster is not publicly accessible."""

    def __init__(self):
        name = "Ensure RDS cluster is not publicly accessible"
        id = "CKV_MYFAVES_001"
        supported_resources = ["aws_rds_cluster_instance"]
        categories = [CheckCategories.NETWORKING]
        super().__init__(name=name, id=id, categories=categories, supported_resources=supported_resources)

    def scan_resource_conf(self, conf):
        publicly_accessible = conf.get("publicly_accessible", [False])
        if isinstance(publicly_accessible, list):
            publicly_accessible = publicly_accessible[0] if publicly_accessible else False
        if publicly_accessible is True:
            return CheckResult.FAILED
        return CheckResult.PASSED


class RDSClusterEncryptionEnabled(BaseResourceCheck):
    """CKV_MYFAVES_002 - Ensure RDS cluster has encryption enabled."""

    def __init__(self):
        name = "Ensure RDS cluster has encryption enabled"
        id = "CKV_MYFAVES_002"
        supported_resources = ["aws_rds_cluster"]
        categories = [CheckCategories.ENCRYPTION]
        super().__init__(name=name, id=id, categories=categories, supported_resources=supported_resources)

    def scan_resource_conf(self, conf):
        storage_encrypted = conf.get("storage_encrypted", [False])
        if isinstance(storage_encrypted, list):
            storage_encrypted = storage_encrypted[0] if storage_encrypted else False
        if storage_encrypted is True:
            return CheckResult.PASSED
        return CheckResult.FAILED


class S3BucketPublicAccessBlocked(BaseResourceCheck):
    """CKV_MYFAVES_003 - Ensure S3 bucket has public access blocked."""

    def __init__(self):
        name = "Ensure S3 bucket has public access blocked"
        id = "CKV_MYFAVES_003"
        supported_resources = ["aws_s3_bucket_public_access_block"]
        categories = [CheckCategories.GENERAL_SECURITY]
        super().__init__(name=name, id=id, categories=categories, supported_resources=supported_resources)

    def scan_resource_conf(self, conf):
        required_settings = [
            "block_public_acls",
            "block_public_policy",
            "ignore_public_acls",
            "restrict_public_buckets",
        ]
        for setting in required_settings:
            value = conf.get(setting, [False])
            if isinstance(value, list):
                value = value[0] if value else False
            if value is not True:
                return CheckResult.FAILED
        return CheckResult.PASSED


class RDSClusterEnforcesSSL(BaseResourceCheck):
    """CKV_MYFAVES_004 - Ensure RDS cluster enforces SSL."""

    def __init__(self):
        name = "Ensure RDS cluster enforces SSL"
        id = "CKV_MYFAVES_004"
        supported_resources = ["aws_rds_cluster_parameter_group"]
        categories = [CheckCategories.ENCRYPTION]
        super().__init__(name=name, id=id, categories=categories, supported_resources=supported_resources)

    def scan_resource_conf(self, conf):
        parameters = conf.get("parameter", [])
        if isinstance(parameters, list):
            for param in parameters:
                if isinstance(param, dict):
                    name = param.get("name", [""])[0] if isinstance(param.get("name"), list) else param.get("name", "")
                    value = param.get("value", [""])[0] if isinstance(param.get("value"), list) else param.get("value", "")
                    if name == "rds.force_ssl" and str(value) == "1":
                        return CheckResult.PASSED
        return CheckResult.FAILED


# Register checks by instantiating at module level
rds_cluster_not_publicly_accessible = RDSClusterNotPubliclyAccessible()
rds_cluster_encryption_enabled = RDSClusterEncryptionEnabled()
s3_bucket_public_access_blocked = S3BucketPublicAccessBlocked()
rds_cluster_enforces_ssl = RDSClusterEnforcesSSL()
