RUNBOOK: RB-SWIFT-003 -- Quota and Rate Limit Management
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. OpenStack CLI tools installed (`openstack`, `swift`)
2. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
3. Swift proxy server is running (`docker ps --filter name=swift_proxy_server`)
4. Knowledge of the affected account/container name and the reported error

## PROCEDURE

Step 1: Identify the quota or rate limit error
```bash
# Typical error messages:
# 413 Request Entity Too Large -- quota exceeded
# 429 Too Many Requests -- rate limit hit
# 403 Forbidden with quota message -- account quota reached
```
Expected: Error message identifies whether it is a quota or rate limit issue
If not: Check proxy server logs for details: `docker logs swift_proxy_server 2>&1 | tail -30`

Step 2: Check account-level quota
```bash
swift stat
```
Expected: Output shows `Meta Quota-Bytes` if an account quota is set. Compare `Bytes` (current usage) against quota.
If not: If no quota is set, the issue is not account-level quota. Proceed to Step 3.

Step 3: Check container-level quota
```bash
swift stat <container-name>
```
Expected: Output shows `Meta Quota-Bytes` (max bytes) and/or `Meta Quota-Count` (max objects) if container quotas are set. Compare current usage against limits.
If not: If no container quota is set, proceed to Step 4 for rate limiting

Step 4: Check rate limiting configuration
```bash
docker exec swift_proxy_server grep -A10 "\[filter:ratelimit\]" /etc/swift/proxy-server.conf
```
Expected: Rate limit settings show `account_ratelimit`, `container_ratelimit_0`, and `container_listing_ratelimit_0` values
If not: If ratelimit filter is not present, rate limiting is not configured. Check other potential causes.

Step 5: Adjust account quota (if too restrictive)
```bash
# Set a new account quota (in bytes)
swift post -m "Quota-Bytes: 107374182400"  # 100 GB

# Remove account quota entirely
swift post -m "Quota-Bytes:"
```
Expected: Quota is updated; `swift stat` reflects the new quota value
If not: Verify admin role -- quota management may require admin or reseller-admin role

Step 6: Adjust container quota
```bash
# Set container byte quota (in bytes)
swift post <container-name> -m "Quota-Bytes: 10737418240"  # 10 GB

# Set container object count quota
swift post <container-name> -m "Quota-Count: 10000"

# Remove container quotas
swift post <container-name> -m "Quota-Bytes:" -m "Quota-Count:"
```
Expected: Quota updated; `swift stat <container-name>` shows new values
If not: Check that the `container_quotas` middleware is in the proxy pipeline

Step 7: Verify tempURL key configuration (if tempURL access is failing)
```bash
# Check if tempURL key is set on the account
swift stat | grep Temp-URL-Key

# Set or rotate tempURL key
swift post -m "Temp-URL-Key: $(openssl rand -hex 32)"

# Generate a test tempURL
swift tempurl GET 3600 /v1/AUTH_<account>/<container>/<object> <key>
```
Expected: Temp-URL-Key is present; generated URLs provide access for the specified duration
If not: Verify the `tempurl` middleware is in the proxy pipeline: `docker exec swift_proxy_server grep tempurl /etc/swift/proxy-server.conf`

Step 8: Verify the proxy pipeline includes required middleware
```bash
docker exec swift_proxy_server grep "^pipeline" /etc/swift/proxy-server.conf
```
Expected: Pipeline includes `account_quotas`, `container_quotas`, `ratelimit`, and `tempurl` middleware
If not: Add missing middleware via Kolla-Ansible config override and reconfigure: `kolla-ansible -i inventory reconfigure --tags swift`

## VERIFICATION

1. Repeat the original failing operation -- it should succeed (upload, download, or tempURL access)
2. Verify quotas reflect intended limits: `swift stat` and `swift stat <container>` show correct quota values
3. Confirm rate limits are not blocking normal operation (monitor proxy logs for 429 responses over a 5-minute window)

## ROLLBACK

1. Restore previous quota settings:
   ```bash
   swift post -m "Quota-Bytes: <original-value>"
   swift post <container-name> -m "Quota-Bytes: <original-value>"
   ```
2. If rate limit configuration was changed, revert the proxy-server.conf override and reconfigure:
   ```bash
   kolla-ansible -i inventory reconfigure --tags swift
   ```
3. Verify that quota and rate limit behavior returns to the pre-change state

## RELATED RUNBOOKS

- RB-SWIFT-001: Container Access Troubleshooting -- when 403 is ACL-related rather than quota-related
- RB-SWIFT-004: Object Expiration and Lifecycle Troubleshooting -- when expiration interacts with quota enforcement
- RB-KEYSTONE-001: Token Issuance and Authentication -- when quota API calls fail due to auth issues
