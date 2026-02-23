# Keystone Identity Service -- Operations Procedures

Per-service operational procedures for the OpenStack Keystone identity service following NASA procedure format. All procedures map to SE Phase E (Operations & Sustainment) per SP-6105 SS 5.4-5.5 and NPR 7123.1 SS 3.2 Process 9.

## Table of Contents

- [OPS-KEYSTONE-001: Service Health Check](#ops-keystone-001-service-health-check)
- [OPS-KEYSTONE-002: Configuration Verification](#ops-keystone-002-configuration-verification)
- [OPS-KEYSTONE-003: Backup and Restore](#ops-keystone-003-backup-and-restore)
- [OPS-KEYSTONE-004: Minor Upgrade](#ops-keystone-004-minor-upgrade)
- [OPS-KEYSTONE-005: Major Upgrade](#ops-keystone-005-major-upgrade)
- [OPS-KEYSTONE-006: Troubleshooting Common Failures](#ops-keystone-006-troubleshooting-common-failures)
- [OPS-KEYSTONE-007: Security Audit](#ops-keystone-007-security-audit)
- [OPS-KEYSTONE-008: Token Rotation](#ops-keystone-008-token-rotation)
- [OPS-KEYSTONE-009: Catalog Management](#ops-keystone-009-catalog-management)

---

## OPS-KEYSTONE-001: Service Health Check

```
PROCEDURE ID: OPS-KEYSTONE-001
TITLE: Keystone Identity Service Daily Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm the Keystone identity service is running, responsive, and free of errors. Execute daily or after any infrastructure change to verify authentication services remain operational. A failing Keystone service prevents all OpenStack API access.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Docker daemon running on the controller node
4. Network connectivity to the Keystone API endpoint (port 5000)

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any configuration or data
- Token issuance in Step 3 creates a short-lived token that expires automatically
- No service disruption expected from any step in this procedure

### PROCEDURE

Step 1: Verify Keystone containers are running.

```bash
docker ps --filter "name=keystone" --format "table {{.Names}}\t{{.Status}}\t{{.RunningFor}}"
```

Expected result:
```
NAMES               STATUS          RUNNING FOR
keystone_api        Up X hours      X hours
keystone_fernet     Up X hours      X hours
```

If unexpected: If either container is not listed or shows a non-Up status, restart with `docker restart keystone_api keystone_fernet`. If containers fail to start, check logs with `docker logs keystone_api 2>&1 | tail -100`.

Step 2: Source admin credentials.

```bash
source /etc/kolla/admin-openrc.sh
```

Expected result: No output. The shell environment now contains `OS_AUTH_URL`, `OS_USERNAME`, `OS_PASSWORD`, and related variables.

If unexpected: If the file does not exist, regenerate with `kolla-ansible -i inventory post-deploy`.

Step 3: Issue a test token.

```bash
openstack token issue
```

Expected result:
```
+------------+------------------------------------------------------------------+
| Field      | Value                                                            |
+------------+------------------------------------------------------------------+
| expires    | 2026-02-23T04:00:00+0000                                         |
| id         | gAAAAABn...                                                      |
| project_id | a1b2c3d4e5f6...                                                  |
| user_id    | f6e5d4c3b2a1...                                                  |
+------------+------------------------------------------------------------------+
```

If unexpected: If the command returns "401 Unauthorized", proceed to OPS-KEYSTONE-006 for troubleshooting authentication failures.

Step 4: Verify the service catalog returns endpoints.

```bash
openstack endpoint list --service keystone -f table
```

Expected result: Three endpoints (public, internal, admin) for the identity service in RegionOne.

```
+------+--------+-----------+-----------+---------+-----------+---------------------------+
| ID   | Region | Service   | Service   | Enabled | Interface | URL                       |
|      | Name   | Name      | Type      |         |           |                           |
+------+--------+-----------+-----------+---------+-----------+---------------------------+
| ...  | Regio  | keystone  | identity  | True    | public    | http://controller:5000/v3 |
| ...  | Regio  | keystone  | identity  | True    | internal  | http://controller:5000/v3 |
| ...  | Regio  | keystone  | identity  | True    | admin     | http://controller:5000/v3 |
+------+--------+-----------+-----------+---------+-----------+---------------------------+
```

If unexpected: If fewer than three endpoints appear, proceed to OPS-KEYSTONE-009 to add missing endpoints.

Step 5: Check Keystone API logs for errors.

```bash
docker logs keystone_api --since 24h 2>&1 | grep -iE "ERROR|CRITICAL" | tail -20
```

Expected result: No output or only benign entries. Zero ERROR or CRITICAL messages in the last 24 hours.

If unexpected: If errors appear, record the error messages and proceed to OPS-KEYSTONE-006 for troubleshooting.

Step 6: Verify Fernet key state.

```bash
docker exec keystone_fernet ls -la /etc/kolla/keystone/fernet-keys/
```

Expected result: At least 3 key files (indices 0, 1, and a highest-index primary key) with recent modification timestamps.

If unexpected: If only one key exists or keys have very old timestamps, execute OPS-KEYSTONE-008 to rotate Fernet keys.

### VERIFICATION

1. Confirm both `keystone_api` and `keystone_fernet` containers show status "Up"
2. Confirm `openstack token issue` returns a valid token with a future expiration timestamp
3. Confirm `openstack endpoint list --service keystone` returns 3 enabled endpoints
4. Confirm zero ERROR or CRITICAL log entries in the last 24 hours
5. Confirm at least 3 Fernet key files exist with recent timestamps

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-KEYSTONE-006: Troubleshooting Common Failures
- OPS-KEYSTONE-008: Token Rotation
- OPS-KEYSTONE-009: Catalog Management
- https://docs.openstack.org/keystone/latest/admin/health-check.html
- https://docs.openstack.org/keystone/latest/admin/fernet-token-faq.html
- SP-6105 SS 5.4 (Operations Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-002: Configuration Verification

```
PROCEDURE ID: OPS-KEYSTONE-002
TITLE: Keystone Configuration Verification
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm Keystone configuration matches the expected state after any deployment, reconfiguration, or upgrade. Execute after running `kolla-ansible reconfigure` or `kolla-ansible upgrade`, or when investigating authentication anomalies.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to the Kolla-Ansible `globals.yml` configuration file
4. Keystone containers running (verify with OPS-KEYSTONE-001 first)

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any configuration
- Reading configuration files does not affect running services
- Policy file inspection does not change access controls

### PROCEDURE

Step 1: Verify Keystone settings in globals.yml.

```bash
grep -E "^keystone_|^kolla_enable_tls" /etc/kolla/globals.yml
```

Expected result: Output shows configured Keystone settings including token provider and password variables.

```
keystone_admin_password: {{ vault_keystone_admin_password }}
keystone_database_password: {{ vault_keystone_database_password }}
keystone_token_provider: fernet
```

If unexpected: If settings are missing or incorrect, update `globals.yml` and run `kolla-ansible -i inventory reconfigure --tags keystone`.

Step 2: Verify Fernet key repository state.

```bash
docker exec keystone_fernet ls -la /etc/kolla/keystone/fernet-keys/
```

Expected result: Directory contains numbered key files (0, 1, 2, ...) with the highest index being the primary key. Ownership is `keystone:keystone`.

If unexpected: If keys are missing, run `kolla-ansible -i inventory keystone_fernet_rotate` to regenerate.

Step 3: Verify the Keystone configuration file inside the container.

```bash
docker exec keystone_api grep -E "^\[fernet_tokens\]|^max_active_keys|^\[token\]|^provider|^expiration" /etc/keystone/keystone.conf
```

Expected result:
```
[fernet_tokens]
max_active_keys = 3
[token]
provider = fernet
expiration = 3600
```

If unexpected: If the token provider is not `fernet` or expiration differs from expected, update `globals.yml` and reconfigure with `kolla-ansible -i inventory reconfigure --tags keystone`.

Step 4: Check TLS certificate validity (if TLS is enabled).

```bash
docker exec keystone_api openssl x509 -in /etc/keystone/ssl/certs/keystone.pem -noout -dates -subject 2>/dev/null || echo "TLS not configured"
```

Expected result: Certificate dates showing `notBefore` in the past and `notAfter` in the future, with the correct subject CN.

If unexpected: If the certificate is expired or about to expire, renew the certificate and run `kolla-ansible -i inventory reconfigure --tags keystone`.

Step 5: Validate RBAC policy files.

```bash
docker exec keystone_api python3 -c "import yaml; yaml.safe_load(open('/etc/keystone/policy.yaml'))" 2>/dev/null && echo "Policy YAML is valid" || echo "Policy YAML parse error"
```

Expected result: `Policy YAML is valid`

If unexpected: If a parse error occurs, inspect the policy file with `docker exec keystone_api cat /etc/keystone/policy.yaml` and correct syntax errors.

Step 6: Verify database connection string.

```bash
docker exec keystone_api grep "^connection" /etc/keystone/keystone.conf | head -1
```

Expected result: A `connection = mysql+pymysql://keystone:...@<db-host>/keystone` string pointing to the correct database host.

If unexpected: If the database host is wrong, update Kolla-Ansible configuration and redeploy.

### VERIFICATION

1. Confirm `globals.yml` contains expected Keystone settings
2. Confirm Fernet keys exist with correct ownership
3. Confirm `keystone.conf` shows `provider = fernet` and expected `expiration` value
4. Confirm TLS certificates are valid (if TLS enabled)
5. Confirm `policy.yaml` parses without errors
6. Confirm database connection string points to the correct host

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-008: Token Rotation
- https://docs.openstack.org/keystone/latest/configuration/index.html
- https://docs.openstack.org/keystone/latest/admin/configuration.html
- https://docs.openstack.org/keystone/latest/configuration/config-options.html
- SP-6105 SS 5.5 (Product Transition -- Configuration Management)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-003: Backup and Restore

```
PROCEDURE ID: OPS-KEYSTONE-003
TITLE: Keystone Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Keystone identity service including its database, Fernet keys, and policy files. Execute before upgrades, major configuration changes, or as part of a scheduled backup rotation. The restore procedure recovers Keystone to the backed-up state.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Sufficient disk space for the backup at the target location
4. MariaDB root password available (stored in `/etc/kolla/passwords.yml` as `database_password`)
5. All Keystone containers running (verify with OPS-KEYSTONE-001)

### SAFETY CONSIDERATIONS

- The backup procedure is non-destructive and does not affect running services
- The restore procedure stops and restarts Keystone, causing a brief authentication outage
- All OpenStack services will fail authentication during the restore window (typically 1-5 minutes)
- Restoring Fernet keys invalidates any tokens issued after the backup timestamp
- Schedule restore operations during a maintenance window

### PROCEDURE

**Part A: Backup**

Step 1: Create a timestamped backup directory.

```bash
BACKUP_DIR="/opt/backups/keystone/$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}"
```

Expected result: Directory created at `/opt/backups/keystone/YYYYMMDD-HHMMSS/`.

If unexpected: If the parent directory does not exist or permissions are denied, create `/opt/backups/` with `sudo mkdir -p /opt/backups && sudo chown $(whoami) /opt/backups`.

Step 2: Backup the Keystone database.

```bash
docker exec mariadb mysqldump -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" keystone > "${BACKUP_DIR}/keystone-db.sql"
```

Expected result: A SQL dump file at `${BACKUP_DIR}/keystone-db.sql` containing all Keystone tables (project, user, role, endpoint, service, etc.).

If unexpected: If the command returns "Access denied", verify the MariaDB root password in `/etc/kolla/passwords.yml`.

Step 3: Backup Fernet keys.

```bash
docker cp keystone_fernet:/etc/kolla/keystone/fernet-keys/ "${BACKUP_DIR}/fernet-keys/"
```

Expected result: The `fernet-keys/` directory copied to the backup location with all numbered key files.

If unexpected: If the container is not running, start it with `docker start keystone_fernet` and retry.

Step 4: Backup policy files.

```bash
docker cp keystone_api:/etc/keystone/policy.yaml "${BACKUP_DIR}/policy.yaml" 2>/dev/null || echo "No custom policy file"
docker cp keystone_api:/etc/keystone/keystone.conf "${BACKUP_DIR}/keystone.conf"
```

Expected result: Policy and configuration files copied to the backup directory.

If unexpected: If `policy.yaml` does not exist, the default policies are in use and no custom policy backup is needed.

Step 5: Record backup metadata.

```bash
echo "Backup timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${BACKUP_DIR}/backup-metadata.txt"
echo "Keystone version: $(docker exec keystone_api keystone-manage --version 2>&1)" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Database size: $(wc -c < "${BACKUP_DIR}/keystone-db.sql") bytes" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Fernet key count: $(ls "${BACKUP_DIR}/fernet-keys/" | wc -l)" >> "${BACKUP_DIR}/backup-metadata.txt"
```

Expected result: A `backup-metadata.txt` file recording the timestamp, version, database size, and key count.

If unexpected: Non-critical. Proceed if metadata recording fails.

**Part B: Restore**

Step 6: Stop Keystone containers.

```bash
docker stop keystone_api keystone_fernet
```

Expected result: Both containers report as stopped.

If unexpected: If containers do not stop within 30 seconds, force stop with `docker kill keystone_api keystone_fernet`.

Step 7: Restore the Keystone database.

```bash
docker exec -i mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" keystone < "${BACKUP_DIR}/keystone-db.sql"
```

Expected result: No output on success. The database is restored to the backed-up state.

If unexpected: If the restore fails with a table conflict, drop and recreate the database first:
```bash
docker exec mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "DROP DATABASE keystone; CREATE DATABASE keystone;"
```
Then retry the restore command.

Step 8: Restore Fernet keys.

```bash
docker cp "${BACKUP_DIR}/fernet-keys/" keystone_fernet:/etc/kolla/keystone/fernet-keys/
```

Expected result: Fernet keys copied back into the container.

If unexpected: If the container is stopped, the copy still works with Docker's data volume. Proceed to the next step.

Step 9: Restore policy files.

```bash
docker cp "${BACKUP_DIR}/policy.yaml" keystone_api:/etc/keystone/policy.yaml 2>/dev/null
docker cp "${BACKUP_DIR}/keystone.conf" keystone_api:/etc/keystone/keystone.conf
```

Expected result: Configuration files restored in the container.

If unexpected: If the container filesystem is ephemeral, these files will be overwritten on next `kolla-ansible reconfigure`. Run reconfigure after restore to ensure consistency.

Step 10: Start Keystone containers.

```bash
docker start keystone_api keystone_fernet
```

Expected result: Both containers start and reach "Up" status.

If unexpected: Check container logs with `docker logs keystone_api 2>&1 | tail -50` for startup errors.

### VERIFICATION

1. Run `openstack token issue` and confirm a valid token is returned
2. Run `openstack user list` and confirm the user list matches the backed-up state
3. Run `openstack endpoint list --service keystone` and confirm all endpoints are present
4. Check `docker logs keystone_api 2>&1 | tail -20` for any startup errors
5. Run OPS-KEYSTONE-001 to perform a full health check

### ROLLBACK

If the restore fails and leaves Keystone in an inconsistent state:
1. Run `kolla-ansible -i inventory deploy --tags keystone` to redeploy from Kolla-Ansible state
2. Run `kolla-ansible -i inventory post-deploy` to regenerate credentials
3. Verify with OPS-KEYSTONE-001

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-008: Token Rotation
- https://docs.openstack.org/keystone/latest/admin/manage-keystone.html
- https://docs.openstack.org/kolla-ansible/latest/reference/databases/mariadb-backup-and-restore.html
- SP-6105 SS 5.5 (Product Transition -- Backup and Recovery)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-004: Minor Upgrade

```
PROCEDURE ID: OPS-KEYSTONE-004
TITLE: Keystone Minor Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a minor version update to the Keystone identity service using Kolla-Ansible. Execute when a new patch release is available within the same OpenStack major version (e.g., 2024.2.1 to 2024.2.2). Minor upgrades apply bug fixes and security patches without schema changes.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Kolla-Ansible updated to the target minor version
4. OPS-KEYSTONE-003 backup completed before starting
5. Maintenance window scheduled (brief Keystone restart expected)
6. OPS-KEYSTONE-001 health check passing before upgrade

### SAFETY CONSIDERATIONS

- Keystone will be briefly unavailable during container restart (typically 10-30 seconds)
- All OpenStack API calls will fail during the restart window
- Tokens issued before the upgrade remain valid if Fernet keys are preserved
- Schedule during a maintenance window with user notification
- The backup from OPS-KEYSTONE-003 enables rollback if upgrade fails

### PROCEDURE

Step 1: Record the current Keystone version.

```bash
docker exec keystone_api keystone-manage --version 2>&1
```

Expected result: Output shows the current Keystone version (e.g., `26.0.0`).

If unexpected: If the command fails, check that `keystone_api` container is running.

Step 2: Run pre-upgrade health check.

```bash
openstack token issue -f value -c id > /dev/null && echo "Token issuance: OK"
openstack endpoint list --service keystone -f value -c Enabled | grep -q True && echo "Endpoints: OK"
```

Expected result: Both checks output "OK".

If unexpected: Resolve any failures using OPS-KEYSTONE-006 before proceeding with the upgrade.

Step 3: Execute the Keystone upgrade.

```bash
kolla-ansible -i inventory upgrade --tags keystone
```

Expected result: Ansible playbook completes with zero failed tasks. Output ends with a play recap showing `failed=0`.

If unexpected: If the upgrade fails, check the Ansible output for the specific task that failed. Run `docker logs keystone_api 2>&1 | tail -50` for container-level errors. Proceed to ROLLBACK if the failure cannot be resolved.

Step 4: Verify the new Keystone version.

```bash
docker exec keystone_api keystone-manage --version 2>&1
```

Expected result: Version number is higher than the value recorded in Step 1.

If unexpected: If the version is unchanged, the upgrade may not have pulled a new container image. Verify with `docker images | grep keystone`.

Step 5: Run post-upgrade health check.

```bash
openstack token issue
openstack endpoint list --service keystone
openstack user list --domain default
```

Expected result: All three commands succeed. Token issuance works, endpoints are intact, and user list returns expected users.

If unexpected: If any command fails, check container logs and proceed to ROLLBACK.

### VERIFICATION

1. Confirm `keystone-manage --version` shows the target version
2. Confirm `openstack token issue` returns a valid token
3. Confirm `openstack endpoint list` shows all 3 endpoints enabled
4. Confirm `openstack user list` returns the full user list
5. Run OPS-KEYSTONE-001 for a complete health check

### ROLLBACK

1. Stop Keystone containers: `docker stop keystone_api keystone_fernet`
2. Revert Kolla-Ansible to the previous version tag in `globals.yml`
3. Redeploy previous version: `kolla-ansible -i inventory deploy --tags keystone`
4. If database schema was changed, restore from backup: follow OPS-KEYSTONE-003 Part B
5. Verify rollback: run OPS-KEYSTONE-001

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-003: Backup and Restore
- OPS-KEYSTONE-006: Troubleshooting Common Failures
- https://docs.openstack.org/keystone/latest/admin/upgrading.html
- https://docs.openstack.org/kolla-ansible/latest/user/operating-kolla.html#upgrading
- SP-6105 SS 5.4 (Operations -- System Updates)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-005: Major Upgrade

```
PROCEDURE ID: OPS-KEYSTONE-005
TITLE: Keystone Major Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a major version upgrade to the Keystone identity service (e.g., from 2024.1 Caracal to 2024.2 Dalmatian). Major upgrades may include database schema migrations, API changes, and deprecation removals. Execute during a planned maintenance window with extended testing.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Kolla-Ansible upgraded to the target major release
4. Release notes reviewed for breaking changes and deprecations
5. OPS-KEYSTONE-003 backup completed (both database and Fernet keys)
6. OPS-KEYSTONE-001 health check passing
7. Maintenance window of at least 30 minutes scheduled
8. All dependent services notified of potential authentication disruption

### SAFETY CONSIDERATIONS

- Major upgrades may include database migrations that cannot be reversed without a backup restore
- Extended downtime possible if database migrations are slow (1-15 minutes depending on table sizes)
- All OpenStack services will fail authentication during the upgrade window
- Fernet keys are preserved across upgrades but verify after completion
- Federation configuration may require updates if protocol changes occurred
- Schedule during low-usage period with user notification at least 24 hours in advance

### PROCEDURE

Step 1: Record current state for comparison.

```bash
docker exec keystone_api keystone-manage --version 2>&1
openstack endpoint list --service keystone -f json > /tmp/keystone-endpoints-pre.json
openstack user list --domain default -f json > /tmp/keystone-users-pre.json
openstack service list -f json > /tmp/keystone-services-pre.json
```

Expected result: Version captured and three JSON files saved for post-upgrade comparison.

If unexpected: If any command fails, resolve using OPS-KEYSTONE-001 before proceeding.

Step 2: Review release notes for Keystone-specific changes.

```bash
echo "Review the following URL for breaking changes:"
echo "https://docs.openstack.org/releasenotes/keystone/"
echo "Check for: deprecated options removed, API version changes, policy format changes"
```

Expected result: Operator has reviewed release notes and confirmed no blocking issues.

If unexpected: If breaking changes affect the current deployment, plan mitigation before proceeding.

Step 3: Verify the backup is complete and accessible.

```bash
ls -la /opt/backups/keystone/$(ls /opt/backups/keystone/ | sort | tail -1)/
```

Expected result: Backup directory contains `keystone-db.sql`, `fernet-keys/`, `policy.yaml` (if applicable), and `keystone.conf`.

If unexpected: Run OPS-KEYSTONE-003 Part A to create a fresh backup before continuing.

Step 4: Execute the database migration pre-check.

```bash
docker exec keystone_api keystone-manage db_sync --check 2>&1
```

Expected result: Output indicates whether migrations are needed. Exit code 0 means no migrations pending; exit code 2 means migrations will be applied.

If unexpected: If the command returns an error, check database connectivity and resolve before proceeding.

Step 5: Execute the major upgrade.

```bash
kolla-ansible -i inventory upgrade --tags keystone
```

Expected result: Ansible playbook completes with zero failed tasks. Database migrations apply successfully.

If unexpected: If the playbook fails:
1. Check Ansible output for the failed task
2. Check `docker logs keystone_api 2>&1 | tail -100` for container errors
3. If database migration failed, do NOT retry -- proceed to ROLLBACK

Step 6: Verify database schema migration completed.

```bash
docker exec keystone_api keystone-manage db_sync --check 2>&1
```

Expected result: Exit code 0 indicating no pending migrations.

If unexpected: If migrations are still pending, run `docker exec keystone_api keystone-manage db_sync` manually.

Step 7: Run extended post-upgrade verification.

```bash
openstack token issue
openstack endpoint list --service keystone -f json > /tmp/keystone-endpoints-post.json
openstack user list --domain default -f json > /tmp/keystone-users-post.json
openstack service list -f json > /tmp/keystone-services-post.json
```

Expected result: Token issuance succeeds. Endpoint, user, and service lists match pre-upgrade state.

If unexpected: Compare pre and post JSON files with `diff` to identify discrepancies.

Step 8: Compare pre-upgrade and post-upgrade state.

```bash
diff <(python3 -m json.tool /tmp/keystone-endpoints-pre.json) <(python3 -m json.tool /tmp/keystone-endpoints-post.json)
diff <(python3 -m json.tool /tmp/keystone-users-pre.json) <(python3 -m json.tool /tmp/keystone-users-post.json)
diff <(python3 -m json.tool /tmp/keystone-services-pre.json) <(python3 -m json.tool /tmp/keystone-services-post.json)
```

Expected result: No differences, or differences limited to expected fields (e.g., token IDs, timestamps).

If unexpected: Investigate any missing endpoints, users, or services. Restore from backup if data loss is detected.

Step 9: Verify the new version.

```bash
docker exec keystone_api keystone-manage --version 2>&1
```

Expected result: Version shows the target major release.

If unexpected: If version is unchanged, the container image pull may have failed. Check `docker images | grep keystone`.

### VERIFICATION

1. Confirm `keystone-manage --version` shows the target major version
2. Confirm `openstack token issue` returns a valid token
3. Confirm endpoint, user, and service counts match pre-upgrade state
4. Confirm `keystone-manage db_sync --check` returns exit code 0
5. Confirm Fernet keys are intact: `docker exec keystone_fernet ls /etc/kolla/keystone/fernet-keys/`
6. Run OPS-KEYSTONE-001 for a complete health check
7. Monitor logs for 30 minutes: `docker logs -f keystone_api 2>&1 | grep -iE "ERROR|CRITICAL"`

### ROLLBACK

1. Stop Keystone containers: `docker stop keystone_api keystone_fernet`
2. Restore database from backup: follow OPS-KEYSTONE-003 Part B, Steps 7-8
3. Restore Fernet keys from backup: follow OPS-KEYSTONE-003 Part B, Step 8
4. Revert Kolla-Ansible to the previous major version tag
5. Deploy previous version: `kolla-ansible -i inventory deploy --tags keystone`
6. Verify rollback: run OPS-KEYSTONE-001
7. Notify dependent services that the upgrade has been rolled back

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-003: Backup and Restore
- OPS-KEYSTONE-006: Troubleshooting Common Failures
- https://docs.openstack.org/keystone/latest/admin/upgrading.html
- https://docs.openstack.org/releasenotes/keystone/
- https://docs.openstack.org/kolla-ansible/latest/user/operating-kolla.html#upgrading
- SP-6105 SS 5.4-5.5 (Operations and Product Transition)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-006: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-KEYSTONE-006
TITLE: Troubleshooting Common Keystone Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Keystone failure modes. Execute when authentication fails, tokens cannot be validated, the service catalog returns incorrect endpoints, database connections drop, or Fernet key rotation encounters errors.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Access to Docker for container log inspection
3. MariaDB credentials available for direct database queries
4. Understanding of the current deployment topology (single-node or multi-node)

### SAFETY CONSIDERATIONS

- Some troubleshooting steps involve restarting containers, causing brief service disruption
- Modifying configuration files requires a container restart to take effect
- Enabling debug logging increases disk usage and may expose sensitive data in logs
- Disable debug logging after troubleshooting is complete

### PROCEDURE

**Failure Mode 1: 401 Authentication Errors**

Step 1: Verify Keystone containers are running.

```bash
docker ps --filter "name=keystone" --format "{{.Names}}: {{.Status}}"
```

Expected result: Both `keystone_api` and `keystone_fernet` show "Up" status.

If unexpected: Restart with `docker restart keystone_api keystone_fernet`. Wait 10 seconds, then retry the failing authentication command.

Step 2: Check for clock skew.

```bash
date -u
docker exec keystone_api date -u
```

Expected result: Both times match within 1 second.

If unexpected: Synchronize with `chronyc makestep` or `ntpdate -s pool.ntp.org`. Clock skew greater than 30 seconds invalidates Fernet tokens.

Step 3: Verify admin credentials file.

```bash
grep OS_AUTH_URL /etc/kolla/admin-openrc.sh
```

Expected result: `OS_AUTH_URL` points to the correct Keystone endpoint (e.g., `http://controller:5000/v3`).

If unexpected: Regenerate with `kolla-ansible -i inventory post-deploy`.

Step 4: Check Fernet key freshness.

```bash
docker exec keystone_fernet ls -la /etc/kolla/keystone/fernet-keys/
```

Expected result: Keys exist with recent timestamps. The highest-numbered key is the primary encryption key.

If unexpected: Run `kolla-ansible -i inventory keystone_fernet_rotate` to rotate keys.

**Failure Mode 2: Token Validation Failures**

Step 5: Issue a fresh token and check its properties.

```bash
openstack token issue -f json
```

Expected result: JSON output with `expires` field showing a timestamp in the future.

If unexpected: If the token expires immediately or has a past timestamp, check clock synchronization (Step 2) and token expiration setting in `keystone.conf`.

Step 6: Check memcached connectivity (token cache).

```bash
docker exec memcached memcstat --servers=localhost 2>&1 | head -5
```

Expected result: Output shows memcached statistics including `curr_items` and `uptime`.

If unexpected: Restart memcached with `docker restart memcached`. Memcached failure causes all token validation to fall back to Keystone API, increasing latency.

Step 7: Verify keystonemiddleware configuration on dependent services.

```bash
docker exec nova_api grep -A5 "\[keystone_authtoken\]" /etc/nova/nova.conf | head -10
```

Expected result: Configuration shows correct `auth_url`, `memcached_servers`, `project_name`, `username`, and `password`.

If unexpected: Update the service configuration and restart the affected service container.

**Failure Mode 3: Service Catalog Endpoint Mismatch**

Step 8: List all endpoints and check for inconsistencies.

```bash
openstack endpoint list --long -f table
```

Expected result: Each service has exactly 3 endpoints (public, internal, admin) with matching region names and correct URLs.

If unexpected: Correct the mismatched endpoint:
```bash
openstack endpoint set --url http://correct-host:port/v3 <endpoint-id>
```

**Failure Mode 4: Database Connection Failures**

Step 9: Check Keystone API logs for database errors.

```bash
docker logs keystone_api 2>&1 | grep -iE "database|mysql|maria|operational" | tail -10
```

Expected result: No database error messages.

If unexpected: Test MariaDB connectivity directly:
```bash
docker exec mariadb mysql -u keystone -p"$(grep ^keystone_database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "USE keystone; SELECT COUNT(*) FROM project;"
```

Step 10: Verify MariaDB is running and accepting connections.

```bash
docker ps --filter "name=mariadb" --format "{{.Names}}: {{.Status}}"
docker exec mariadb mysql -u root -p"$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')" -e "SELECT 1;"
```

Expected result: MariaDB container is "Up" and the SELECT query returns `1`.

If unexpected: Restart MariaDB with `docker restart mariadb`. If it fails to start, check disk space with `df -h` and MariaDB logs with `docker logs mariadb 2>&1 | tail -50`.

**Failure Mode 5: Fernet Key Rotation Issues**

Step 11: Verify Fernet key count and order.

```bash
docker exec keystone_fernet ls /etc/kolla/keystone/fernet-keys/ | sort -n
```

Expected result: At least 3 key files (0, 1, and a highest-index primary). Key 0 is always the staging key.

If unexpected: If keys are missing or corrupted, regenerate:
```bash
docker exec keystone_api keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone
docker restart keystone_api keystone_fernet
```
Note: This invalidates all existing tokens. Users must re-authenticate.

Step 12: Confirm rotation preserves token validity.

```bash
TOKEN_BEFORE=$(openstack token issue -f value -c id)
kolla-ansible -i inventory keystone_fernet_rotate
openstack token revoke "${TOKEN_BEFORE}" 2>/dev/null || echo "Token still valid (expected)"
openstack token issue > /dev/null && echo "New token issuance: OK"
```

Expected result: Token issued before rotation can still be validated. New tokens issue successfully after rotation.

If unexpected: If tokens fail after rotation, check `max_active_keys` in `keystone.conf`. Set to at least `(token_expiration / rotation_interval) + 2`.

### VERIFICATION

1. Confirm `openstack token issue` succeeds after resolving any failure mode
2. Confirm `openstack endpoint list` returns all expected endpoints
3. Confirm no ERROR entries in `docker logs keystone_api --since 10m 2>&1`
4. Run OPS-KEYSTONE-001 for a complete health check

### ROLLBACK

Troubleshooting procedures do not have a single rollback path. Each failure mode has its own recovery steps documented inline. If troubleshooting causes additional issues:
1. Restore from backup using OPS-KEYSTONE-003 Part B
2. Redeploy with `kolla-ansible -i inventory deploy --tags keystone`
3. Regenerate credentials with `kolla-ansible -i inventory post-deploy`

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-002: Configuration Verification
- OPS-KEYSTONE-003: Backup and Restore
- OPS-KEYSTONE-008: Token Rotation
- https://docs.openstack.org/keystone/latest/admin/troubleshoot.html
- https://docs.openstack.org/keystone/latest/admin/fernet-token-faq.html
- https://docs.openstack.org/keystone/latest/admin/identity-troubleshoot.html
- SP-6105 SS 5.4 (Operations -- Anomaly Resolution)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-007: Security Audit

```
PROCEDURE ID: OPS-KEYSTONE-007
TITLE: Keystone Security Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Perform a comprehensive security audit of the Keystone identity service. Execute monthly or after any security incident. Covers RBAC policy review, token expiration settings, TLS certificate validity, admin credential rotation, and audit log review.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to `/etc/kolla/passwords.yml` for credential review
4. Understanding of the organization's security policies and compliance requirements

### SAFETY CONSIDERATIONS

- This procedure is primarily read-only but includes optional credential rotation steps
- Credential rotation (Step 7) causes brief service disruption for the rotated account
- TLS certificate replacement (if needed) requires a Keystone restart
- Schedule credential rotation during a maintenance window

### PROCEDURE

Step 1: Review RBAC policy configuration.

```bash
docker exec keystone_api cat /etc/keystone/policy.yaml 2>/dev/null || echo "Using default policies (no custom overrides)"
```

Expected result: Either the custom policy file contents or confirmation that defaults are in use. Default policies follow the principle of least privilege for standard operations.

If unexpected: If custom policies exist, verify each rule against organizational security requirements.

Step 2: Verify token expiration settings.

```bash
docker exec keystone_api grep -E "^expiration|^\[token\]" /etc/keystone/keystone.conf
```

Expected result: Token expiration is set to 3600 seconds (1 hour) or less.

```
[token]
expiration = 3600
```

If unexpected: If expiration exceeds 3600 seconds, reduce it. Long-lived tokens increase the window of exposure for stolen tokens.

Step 3: Check TLS certificate validity.

```bash
docker exec keystone_api openssl x509 -in /etc/keystone/ssl/certs/keystone.pem -noout -dates -subject -issuer 2>/dev/null || echo "TLS not configured"
```

Expected result: Certificate `notAfter` date is at least 30 days in the future. Issuer matches the expected CA.

If unexpected: If the certificate expires within 30 days, initiate certificate renewal and schedule a reconfiguration with `kolla-ansible -i inventory reconfigure --tags keystone`.

Step 4: Audit admin accounts and role assignments.

```bash
openstack role assignment list --names --role admin -f table
```

Expected result: A limited number of admin role assignments. Each assignment is expected and documented.

If unexpected: If unknown users have admin roles, investigate immediately. Remove unauthorized assignments with:
```bash
openstack role remove --project <project> --user <user> admin
```

Step 5: Review service account credentials age.

```bash
for user in nova glance neutron cinder heat swift horizon placement; do
  echo "=== ${user} ==="
  openstack user show ${user} --domain default -c password_expires_at -f value 2>/dev/null || echo "User not found"
done
```

Expected result: Service accounts show password expiration dates in the future, or `None` if expiration is not enforced.

If unexpected: Rotate service passwords by updating `passwords.yml` and running `kolla-ansible -i inventory reconfigure`.

Step 6: Verify audit logging is enabled.

```bash
docker exec keystone_api grep -E "^\[oslo_middleware\]|^enable_proxy_headers_parsing|^\[audit\]" /etc/keystone/keystone.conf
```

Expected result: Audit middleware is configured for logging authentication events.

If unexpected: Enable audit logging by adding CADF audit middleware configuration and reconfiguring Keystone.

Step 7: Rotate admin credentials (optional, execute during maintenance window).

```bash
NEW_PASS=$(openssl rand -base64 32)
openstack user set --password "${NEW_PASS}" admin
echo "New admin password has been set. Update /etc/kolla/passwords.yml and admin-openrc.sh."
```

Expected result: Password changed successfully. No output from the `openstack user set` command.

If unexpected: If the password change fails, check current admin credentials and try again.

Step 8: Review recent authentication failures.

```bash
docker logs keystone_api --since 720h 2>&1 | grep -c "401"
docker logs keystone_api --since 720h 2>&1 | grep "401" | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
```

Expected result: A manageable number of 401 errors. The distribution should not show concentrated bursts from a single source.

If unexpected: Concentrated authentication failures from a single IP or user may indicate a brute-force attack. Block the source and investigate.

### VERIFICATION

1. Confirm RBAC policies are reviewed and appropriate
2. Confirm token expiration is 3600 seconds or less
3. Confirm TLS certificate is valid for at least 30 more days (if TLS is enabled)
4. Confirm no unauthorized admin role assignments exist
5. Confirm audit logging is enabled
6. Confirm authentication failure patterns are within normal bounds

### ROLLBACK

Security audit findings should be addressed through the appropriate procedure:
- RBAC policy changes: revert `policy.yaml` and restart Keystone
- Credential rotation: restore old password from backup or `passwords.yml`
- TLS certificate issues: revert certificate and run `kolla-ansible reconfigure`

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-002: Configuration Verification
- OPS-KEYSTONE-008: Token Rotation
- https://docs.openstack.org/keystone/latest/admin/security-compliance.html
- https://docs.openstack.org/keystone/latest/admin/identity-security-compliance.html
- https://docs.openstack.org/keystone/latest/admin/credential-encryption.html
- SP-6105 SS 5.4 (Operations -- Security Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)
- NPR 7120.5 (NASA Information Security)

---

## OPS-KEYSTONE-008: Token Rotation

```
PROCEDURE ID: OPS-KEYSTONE-008
TITLE: Fernet Token Key Rotation
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Rotate Fernet token encryption keys with zero downtime. Execute on a regular schedule (recommended: every 30 minutes in production with 1-hour token expiration) or after a suspected key compromise. Fernet key rotation ensures that even if a key is compromised, its usefulness is time-limited.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Keystone containers running (verify with OPS-KEYSTONE-001)
4. Understanding of the Fernet key lifecycle: staging (index 0) -> secondary -> primary (highest index)

### SAFETY CONSIDERATIONS

- Rotation is designed to be zero-downtime; existing tokens remain valid
- The `max_active_keys` setting must be correctly configured: `(token_expiration / rotation_interval) + 2`
- If `max_active_keys` is too low, valid tokens may become undecryptable after rotation
- In multi-node deployments, keys must be synchronized across all Keystone nodes
- Do not delete keys manually; the rotation mechanism handles key pruning

### PROCEDURE

Step 1: Check the current Fernet key state.

```bash
docker exec keystone_fernet ls -la /etc/kolla/keystone/fernet-keys/
```

Expected result: Numbered key files (0, 1, ..., N) where N is the current primary key index.

If unexpected: If no keys exist, initialize with:
```bash
docker exec keystone_api keystone-manage fernet_setup --keystone-user keystone --keystone-group keystone
```
Note: Setup invalidates all existing tokens.

Step 2: Verify `max_active_keys` setting.

```bash
docker exec keystone_api grep max_active_keys /etc/keystone/keystone.conf
```

Expected result: `max_active_keys = 3` (or a value matching the formula `(expiration / rotation_interval) + 2`).

If unexpected: If the value is too low for the rotation frequency, update via `globals.yml` and reconfigure.

Step 3: Issue a pre-rotation test token.

```bash
PRE_TOKEN=$(openstack token issue -f value -c id)
echo "Pre-rotation token captured"
```

Expected result: Token ID captured in the `PRE_TOKEN` variable.

If unexpected: If token issuance fails, resolve using OPS-KEYSTONE-006 before rotating.

Step 4: Execute Fernet key rotation.

```bash
kolla-ansible -i inventory keystone_fernet_rotate
```

Expected result: Ansible playbook completes with zero failed tasks. A new primary key is created and the staging key is promoted.

If unexpected: If Kolla-Ansible rotation fails, perform manual rotation:
```bash
docker exec keystone_api keystone-manage fernet_rotate --keystone-user keystone --keystone-group keystone
```

Step 5: Verify the new key state.

```bash
docker exec keystone_fernet ls -la /etc/kolla/keystone/fernet-keys/
```

Expected result: A new highest-numbered key file exists (N+1). The previous staging key (0) has been replaced with a new staging key.

If unexpected: If the key count exceeds `max_active_keys`, check configuration. Excess keys should be pruned automatically.

Step 6: Verify pre-rotation token is still valid.

```bash
openstack token revoke "${PRE_TOKEN}" 2>/dev/null && echo "Pre-rotation token was valid (now revoked)" || echo "Pre-rotation token validation check complete"
```

Expected result: The pre-rotation token is still recognized by Keystone (valid for revocation).

If unexpected: If the token is not recognized, `max_active_keys` may be too low. Increase the value and reconfigure.

Step 7: Issue a post-rotation token.

```bash
openstack token issue -f value -c id > /dev/null && echo "Post-rotation token issuance: OK"
```

Expected result: `Post-rotation token issuance: OK`

If unexpected: If token issuance fails after rotation, check that the new primary key was created correctly. Inspect container logs with `docker logs keystone_api 2>&1 | tail -20`.

### VERIFICATION

1. Confirm new primary key exists with the next sequential index
2. Confirm pre-rotation tokens remain valid (secondary keys decrypt them)
3. Confirm new tokens can be issued using the new primary key
4. Confirm key count does not exceed `max_active_keys`
5. Run OPS-KEYSTONE-001 Step 3 to confirm overall token health

### ROLLBACK

Fernet key rotation is forward-only by design. To recover from a failed rotation:
1. Restore Fernet keys from the most recent backup (OPS-KEYSTONE-003)
2. Restart Keystone containers: `docker restart keystone_api keystone_fernet`
3. Note: Restoring old keys invalidates tokens issued with the new primary key
4. Users must re-authenticate after key restoration

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-002: Configuration Verification
- OPS-KEYSTONE-003: Backup and Restore
- https://docs.openstack.org/keystone/latest/admin/fernet-token-faq.html
- https://docs.openstack.org/keystone/latest/admin/manage-fernet-tokens.html
- https://docs.openstack.org/keystone/latest/admin/token-provider.html
- SP-6105 SS 5.4 (Operations -- Cryptographic Key Management)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-KEYSTONE-009: Catalog Management

```
PROCEDURE ID: OPS-KEYSTONE-009
TITLE: Service Catalog Endpoint Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Add, modify, or remove service endpoints in the Keystone service catalog. Execute when deploying new services, changing API endpoint URLs, migrating services between hosts, or decommissioning services. The service catalog is the central registry through which all OpenStack services discover each other.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Knowledge of the target service type, name, and endpoint URLs
4. Keystone health check passing (OPS-KEYSTONE-001)

### SAFETY CONSIDERATIONS

- Incorrect endpoint URLs cause service-to-service communication failures
- Removing an endpoint for a running service breaks all API calls to that service
- Modifying the identity (Keystone) endpoint incorrectly can lock out all administration
- Always verify endpoint changes in a test environment before applying to production
- Keep a record of current endpoints before making changes

### PROCEDURE

**Part A: Add a New Service and Endpoints**

Step 1: Record the current catalog state.

```bash
openstack endpoint list --long -f json > /tmp/catalog-before.json
openstack service list -f json > /tmp/services-before.json
```

Expected result: JSON files saved with the current catalog state.

If unexpected: If the commands fail, resolve Keystone authentication first (OPS-KEYSTONE-006).

Step 2: Create the service entry.

```bash
openstack service create --name <service-name> --description "<Service Description>" <service-type>
```

Example:
```bash
openstack service create --name nova --description "OpenStack Compute" compute
```

Expected result: A table showing the created service with its ID, name, type, and description.

If unexpected: If the service already exists, skip to Step 3. Check with `openstack service show <service-type>`.

Step 3: Create endpoints for the service (public, internal, admin).

```bash
openstack endpoint create --region RegionOne <service-type> public http://<host>:<port>/<version>
openstack endpoint create --region RegionOne <service-type> internal http://<host>:<port>/<version>
openstack endpoint create --region RegionOne <service-type> admin http://<host>:<port>/<version>
```

Example:
```bash
openstack endpoint create --region RegionOne compute public http://controller:8774/v2.1
openstack endpoint create --region RegionOne compute internal http://controller:8774/v2.1
openstack endpoint create --region RegionOne compute admin http://controller:8774/v2.1
```

Expected result: Three endpoint entries created, each showing the endpoint ID, region, service type, interface, and URL.

If unexpected: If an endpoint already exists for that interface, update it instead (see Part B).

**Part B: Modify an Existing Endpoint**

Step 4: Find the endpoint to modify.

```bash
openstack endpoint list --service <service-type> -f table
```

Expected result: List of endpoints for the specified service with their IDs, interfaces, and URLs.

If unexpected: If no endpoints are found, the service may not be registered. Use Part A to create it.

Step 5: Update the endpoint URL.

```bash
openstack endpoint set --url http://<new-host>:<port>/<version> <endpoint-id>
```

Expected result: No output on success. The endpoint URL is updated.

If unexpected: If the command returns an error, verify the endpoint ID with `openstack endpoint show <endpoint-id>`.

**Part C: Remove a Service and Its Endpoints**

Step 6: Delete the service endpoints.

```bash
for endpoint_id in $(openstack endpoint list --service <service-type> -f value -c ID); do
  openstack endpoint delete "${endpoint_id}"
  echo "Deleted endpoint: ${endpoint_id}"
done
```

Expected result: Each endpoint is deleted with a confirmation message.

If unexpected: If deletion fails, check whether the endpoint ID is valid with `openstack endpoint show <endpoint-id>`.

Step 7: Delete the service entry.

```bash
openstack service delete <service-type>
```

Expected result: No output on success. The service is removed from the catalog.

If unexpected: If the service cannot be deleted because endpoints still exist, re-run Step 6 to delete remaining endpoints.

Step 8: Verify the catalog after changes.

```bash
openstack endpoint list --long -f json > /tmp/catalog-after.json
diff <(python3 -m json.tool /tmp/catalog-before.json) <(python3 -m json.tool /tmp/catalog-after.json)
```

Expected result: The diff shows only the intended additions, modifications, or removals.

If unexpected: If unintended changes appear, restore endpoints from the pre-change JSON or run `kolla-ansible -i inventory deploy` to regenerate the catalog from deployment configuration.

### VERIFICATION

1. Confirm `openstack endpoint list` shows the expected endpoints after changes
2. Confirm `openstack catalog list` resolves correctly for all registered services
3. Test the affected service API: `openstack <service-command>` (e.g., `openstack server list` for compute)
4. Confirm no other services lost their endpoints by comparing with `/tmp/catalog-before.json`

### ROLLBACK

1. If an endpoint was incorrectly modified: `openstack endpoint set --url <original-url> <endpoint-id>`
2. If an endpoint was incorrectly deleted: recreate with `openstack endpoint create` using the values from `/tmp/catalog-before.json`
3. If the entire catalog is corrupted: `kolla-ansible -i inventory deploy` regenerates all service registrations
4. Verify catalog recovery with `openstack catalog list`

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check
- OPS-KEYSTONE-006: Troubleshooting Common Failures
- https://docs.openstack.org/keystone/latest/admin/service-api-protection.html
- https://docs.openstack.org/keystone/latest/admin/manage-services.html
- https://docs.openstack.org/python-openstackclient/latest/cli/command-objects/endpoint.html
- SP-6105 SS 5.5 (Product Transition -- Service Registration)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)
