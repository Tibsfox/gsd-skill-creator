RUNBOOK: RB-SWIFT-001 -- Container Access Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed and configured (`openstack`, `swift`)
2. Admin or member credentials sourced (`source /etc/kolla/admin-openrc.sh`)
3. Swift proxy server container is running (`docker ps --filter name=swift_proxy_server`)
4. Keystone service is operational (`openstack token issue`)

## PROCEDURE

Step 1: Identify the failing container and operation
```bash
# Check error details -- note the container name and operation (GET/PUT/DELETE)
# User reports 403 Forbidden or 401 Unauthorized on container operations
```
Expected: Error message with HTTP status code and container name
If not: Collect the exact error output for later steps

Step 2: Verify the container exists and check its metadata
```bash
openstack container show <container-name>
```
Expected: Container metadata including account, bytes_used, object_count
If not: Container may not exist or user may be in the wrong project. Verify project scope: `openstack project list`

Step 3: Check container ACLs
```bash
swift stat <container-name>
```
Expected: Output includes `Read ACL` and `Write ACL` fields showing access grants
If not: If ACLs are empty, only the container owner (project) has access

Step 4: Verify the token is scoped to the correct project
```bash
openstack token issue
```
Expected: Token shows the correct project ID matching the container's account (AUTH_<project-id>)
If not: Re-authenticate with the correct project: `openstack --os-project-name <project> token issue`

Step 5: Verify user role assignments for the target project
```bash
openstack role assignment list --user <user-id> --project <project-id> --names
```
Expected: User has `member`, `admin`, or `swiftoperator` role on the project
If not: Grant the appropriate role: `openstack role add --project <project> --user <user> member`

Step 6: Check cross-project access (if accessing another project's container)
```bash
# Verify the target container has cross-project ACL
swift stat <container-name> | grep "Read ACL\|Write ACL"
# ACL must include the requesting project-id or user-id
```
Expected: ACL contains `<requesting-project-id>:*` or `<requesting-project-id>:<user-id>`
If not: The container owner must grant access: `swift post <container> --read-acl "<project-id>:*"`

Step 7: Test access with explicit credentials
```bash
swift download <container-name> <object-name> -o /dev/null
```
Expected: Download succeeds with 200 status
If not: Check proxy server logs: `docker logs swift_proxy_server 2>&1 | tail -50`

Step 8: Check proxy server auth pipeline configuration
```bash
docker exec swift_proxy_server grep -A5 keystoneauth /etc/swift/proxy-server.conf
```
Expected: `operator_roles` includes the user's role (typically `member, admin`)
If not: Add the role to operator_roles and reconfigure: `kolla-ansible -i inventory reconfigure --tags swift`

## VERIFICATION

1. Repeat the original failing operation -- it should succeed with 200 status
2. Verify Swift service health: `openstack object store account show` returns account info
3. Confirm no 401/403 errors in proxy logs: `docker logs swift_proxy_server 2>&1 | grep -c "401\|403"` shows 0 new errors

## ROLLBACK

1. If ACLs were modified, restore the previous configuration:
   ```bash
   swift post <container-name> --read-acl "<original-read-acl>"
   swift post <container-name> --write-acl "<original-write-acl>"
   ```
2. If roles were added, remove them:
   ```bash
   openstack role remove --project <project> --user <user> <role>
   ```
3. Verify container access returns to pre-change state

## RELATED RUNBOOKS

- RB-KEYSTONE-001: Token Issuance and Authentication -- when the issue is token-level rather than ACL-level
- RB-KEYSTONE-003: RBAC Policy Troubleshooting -- when role assignment exists but policy denies access
- RB-SWIFT-003: Quota and Rate Limit Management -- when 403 is caused by quota enforcement
