# Nova Compute Service -- Operations Procedures

Per-service operational procedures for the OpenStack Nova compute service following NASA procedure format. All procedures map to SE Phase E (Operations & Sustainment) per SP-6105 SS 5.4-5.5 and NPR 7123.1 SS 3.2 Process 9.

## Table of Contents

- [OPS-NOVA-001: Service Health Check](#ops-nova-001-service-health-check)
- [OPS-NOVA-002: Configuration Verification](#ops-nova-002-configuration-verification)
- [OPS-NOVA-003: Backup and Restore](#ops-nova-003-backup-and-restore)
- [OPS-NOVA-004: Minor Upgrade](#ops-nova-004-minor-upgrade)
- [OPS-NOVA-005: Major Upgrade](#ops-nova-005-major-upgrade)
- [OPS-NOVA-006: Troubleshooting Common Failures](#ops-nova-006-troubleshooting-common-failures)
- [OPS-NOVA-007: Security Audit](#ops-nova-007-security-audit)
- [OPS-NOVA-008: Live Migration](#ops-nova-008-live-migration)
- [OPS-NOVA-009: Flavor Management](#ops-nova-009-flavor-management)
- [OPS-NOVA-010: Hypervisor Maintenance](#ops-nova-010-hypervisor-maintenance)

---

## OPS-NOVA-001: Service Health Check

```
PROCEDURE ID: OPS-NOVA-001
TITLE: Nova Compute Service Daily Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm all Nova compute service components are running, compute nodes are registered and healthy, and the scheduler can place instances. Execute daily or after any infrastructure change. A failing Nova service prevents instance creation, management, and console access.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Docker daemon running on controller and compute nodes
4. Keystone health check passing (OPS-KEYSTONE-001)

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any configuration or data
- Listing hypervisors and services does not affect running instances
- No service disruption expected from any step

### PROCEDURE

Step 1: Verify Nova containers are running on the controller.

```bash
docker ps --filter "name=nova" --format "table {{.Names}}\t{{.Status}}" | sort
```

Expected result:
```
NAMES                  STATUS
nova_api               Up X hours
nova_conductor         Up X hours
nova_novncproxy        Up X hours
nova_scheduler         Up X hours
```

If unexpected: Restart any stopped containers with `docker restart <container-name>`. If containers fail to start, check logs with `docker logs <container-name> 2>&1 | tail -100`.

Step 2: Verify Nova containers are running on compute nodes.

```bash
docker ps --filter "name=nova_compute" --format "table {{.Names}}\t{{.Status}}"
docker ps --filter "name=nova_libvirt" --format "table {{.Names}}\t{{.Status}}"
```

Expected result:
```
NAMES                  STATUS
nova_compute           Up X hours
nova_libvirt           Up X hours
```

If unexpected: Restart with `docker restart nova_compute nova_libvirt`. Check for KVM module availability with `lsmod | grep kvm`.

Step 3: Source admin credentials and verify compute service list.

```bash
source /etc/kolla/admin-openrc.sh
openstack compute service list -f table
```

Expected result: All compute services show `Status=enabled` and `State=up`.

```
+------+----------------+------------+---------+-------+----------------------------+
| ID   | Binary         | Host       | Zone    | State | Status                     |
+------+----------------+------------+---------+-------+----------------------------+
| 1    | nova-scheduler | controller | internal| up    | enabled                    |
| 2    | nova-conductor | controller | internal| up    | enabled                    |
| 3    | nova-compute   | controller | nova    | up    | enabled                    |
+------+----------------+------------+---------+-------+----------------------------+
```

If unexpected: If any service shows `State=down`, check the corresponding container on that host. If `Status=disabled`, the service was manually disabled -- re-enable with `openstack compute service set --enable <host> <binary>`.

Step 4: Check hypervisor list and resource availability.

```bash
openstack hypervisor list -f table
openstack hypervisor stats show -f table
```

Expected result: Hypervisor list shows each compute node with its vCPU, memory, and disk stats. Stats summary shows aggregate resources.

If unexpected: If a hypervisor is missing, check that `nova_compute` is running on that host and run `nova-manage cell_v2 discover_hosts --verbose` to register it.

Step 5: Verify placement resource providers.

```bash
openstack resource provider list -f table
```

Expected result: One resource provider per compute node, matching the hypervisor list.

If unexpected: If resource providers are missing, check the Placement service with `docker ps --filter name=placement`. Restart if needed.

Step 6: Check Nova logs for errors on the controller.

```bash
for container in nova_api nova_scheduler nova_conductor; do
  echo "=== ${container} ==="
  docker logs ${container} --since 24h 2>&1 | grep -iE "ERROR|CRITICAL" | tail -5
done
```

Expected result: No output or only benign entries for each container.

If unexpected: Record error messages and proceed to OPS-NOVA-006 for troubleshooting.

### VERIFICATION

1. Confirm all Nova containers are running on controller and compute nodes
2. Confirm `openstack compute service list` shows all services as `up` and `enabled`
3. Confirm `openstack hypervisor list` shows all expected compute nodes
4. Confirm `openstack resource provider list` matches the hypervisor count
5. Confirm zero ERROR or CRITICAL log entries in the last 24 hours

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-KEYSTONE-001: Service Health Check (authentication prerequisite)
- OPS-NOVA-006: Troubleshooting Common Failures
- OPS-NOVA-010: Hypervisor Maintenance
- https://docs.openstack.org/nova/latest/admin/manage-the-cloud.html
- https://docs.openstack.org/nova/latest/admin/troubleshooting.html
- SP-6105 SS 5.4 (Operations Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-002: Configuration Verification

```
PROCEDURE ID: OPS-NOVA-002
TITLE: Nova Configuration Verification
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm Nova configuration matches the expected state after any deployment, reconfiguration, or upgrade. Execute after running `kolla-ansible reconfigure --tags nova` or when investigating compute anomalies.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to the Kolla-Ansible `globals.yml` configuration file
4. Nova containers running (verify with OPS-NOVA-001 first)

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any configuration
- Reading configuration files does not affect running services or instances

### PROCEDURE

Step 1: Verify Nova settings in globals.yml.

```bash
grep -E "^nova_|^enable_nova" /etc/kolla/globals.yml
```

Expected result: Output shows configured Nova settings including virt type and allocation ratios.

```
nova_compute_virt_type: "kvm"
nova_cpu_allocation_ratio: 4.0
nova_ram_allocation_ratio: 1.5
nova_disk_allocation_ratio: 1.0
nova_console: "novnc"
enable_nova_libvirt_container: "yes"
```

If unexpected: If settings are missing or incorrect, update `globals.yml` and run `kolla-ansible -i inventory reconfigure --tags nova`.

Step 2: Verify compute driver configuration.

```bash
docker exec nova_compute grep -E "^compute_driver|^virt_type" /etc/nova/nova.conf
```

Expected result:
```
compute_driver = libvirt.LibvirtDriver
virt_type = kvm
```

If unexpected: If `virt_type` shows `qemu` when `kvm` is expected, verify KVM module is loaded: `lsmod | grep kvm`. Load with `modprobe kvm_intel` or `modprobe kvm_amd`.

Step 3: Verify scheduler filter configuration.

```bash
docker exec nova_scheduler grep -E "^enabled_filters|^weight_classes" /etc/nova/nova.conf
```

Expected result: Filters include at minimum `AvailabilityZoneFilter`, `ComputeFilter`, `ComputeCapabilitiesFilter`, and `ImagePropertiesFilter`.

If unexpected: If critical filters are missing, add them in the Nova configuration and reconfigure.

Step 4: Verify cell mapping.

```bash
docker exec nova_api nova-manage cell_v2 list_cells 2>&1
```

Expected result: At least two cells: `cell0` (for failed instances) and `cell1` (for running instances), each with valid `transport_url` and `database` entries.

If unexpected: If `cell1` is missing, map it with `nova-manage cell_v2 map_cell0` and `nova-manage cell_v2 create_cell --name cell1`.

Step 5: Verify VNC console configuration.

```bash
docker exec nova_novncproxy grep -E "^novncproxy_base_url|^server_listen" /etc/nova/nova.conf
```

Expected result: The `novncproxy_base_url` points to the correct controller hostname or IP with port 6080.

If unexpected: Update the base URL in `globals.yml` and reconfigure.

Step 6: Verify Keystone authentication configuration.

```bash
docker exec nova_api grep -A8 "\[keystone_authtoken\]" /etc/nova/nova.conf | head -10
```

Expected result: Configuration shows correct `auth_url`, `project_name=service`, `username=nova`, and valid password.

If unexpected: Update credentials in `passwords.yml` and run `kolla-ansible -i inventory reconfigure --tags nova`. See OPS-KEYSTONE-006 for authentication troubleshooting.

### VERIFICATION

1. Confirm `globals.yml` contains expected Nova settings
2. Confirm compute driver is `libvirt.LibvirtDriver` with correct `virt_type`
3. Confirm scheduler filters include all required filters
4. Confirm cell mapping shows `cell0` and `cell1` with valid connections
5. Confirm VNC proxy URL is correct
6. Confirm Keystone auth configuration is valid

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-KEYSTONE-001: Service Health Check (authentication dependency)
- https://docs.openstack.org/nova/latest/configuration/index.html
- https://docs.openstack.org/nova/latest/admin/configuration/schedulers.html
- https://docs.openstack.org/nova/latest/admin/cells.html
- SP-6105 SS 5.5 (Product Transition -- Configuration Management)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-003: Backup and Restore

```
PROCEDURE ID: OPS-NOVA-003
TITLE: Nova Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Nova compute service including its databases (nova, nova_api, nova_cell0), instance definitions, and configuration files. Execute before upgrades, major configuration changes, or as part of scheduled backup rotation. The restore procedure recovers Nova to the backed-up state.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Sufficient disk space for the backup at the target location
4. MariaDB root password available
5. All Nova containers running (verify with OPS-NOVA-001)
6. No active instance operations (migrations, resizes) in progress

### SAFETY CONSIDERATIONS

- The backup procedure is non-destructive and does not affect running services or instances
- The restore procedure stops Nova services, causing inability to manage instances during the restore
- Running instances continue to run during the restore but cannot be managed (no create/stop/delete)
- Restoring Nova databases may cause inconsistencies with the actual instance state on hypervisors
- Schedule restore operations during a maintenance window
- After restore, run `nova-manage cell_v2 discover_hosts` to reconcile host mappings

### PROCEDURE

**Part A: Backup**

Step 1: Create a timestamped backup directory.

```bash
BACKUP_DIR="/opt/backups/nova/$(date +%Y%m%d-%H%M%S)"
mkdir -p "${BACKUP_DIR}"
```

Expected result: Directory created at `/opt/backups/nova/YYYYMMDD-HHMMSS/`.

If unexpected: Create parent directory with `sudo mkdir -p /opt/backups && sudo chown $(whoami) /opt/backups`.

Step 2: Backup the Nova databases.

```bash
DB_PASS=$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')
docker exec mariadb mysqldump -u root -p"${DB_PASS}" nova > "${BACKUP_DIR}/nova-db.sql"
docker exec mariadb mysqldump -u root -p"${DB_PASS}" nova_api > "${BACKUP_DIR}/nova-api-db.sql"
docker exec mariadb mysqldump -u root -p"${DB_PASS}" nova_cell0 > "${BACKUP_DIR}/nova-cell0-db.sql"
```

Expected result: Three SQL dump files containing all Nova tables.

If unexpected: If any dump fails with "Access denied", verify the MariaDB root password.

Step 3: Backup instance definitions.

```bash
openstack server list --all-projects -f json > "${BACKUP_DIR}/instance-list.json"
```

Expected result: JSON file listing all instances across all projects with their IDs, names, status, and host placement.

If unexpected: If the command fails, check Keystone authentication (OPS-KEYSTONE-001).

Step 4: Backup Nova configuration.

```bash
docker cp nova_api:/etc/nova/nova.conf "${BACKUP_DIR}/nova.conf"
docker cp nova_scheduler:/etc/nova/nova.conf "${BACKUP_DIR}/nova-scheduler.conf"
```

Expected result: Configuration files copied to the backup directory.

If unexpected: If containers are not running, proceed without config backup (configs can be regenerated by Kolla-Ansible).

Step 5: Record backup metadata.

```bash
echo "Backup timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${BACKUP_DIR}/backup-metadata.txt"
echo "Nova version: $(docker exec nova_api nova-manage --version 2>&1)" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Instance count: $(openstack server list --all-projects -f value | wc -l)" >> "${BACKUP_DIR}/backup-metadata.txt"
echo "Hypervisor count: $(openstack hypervisor list -f value -c 'Hypervisor Hostname' | wc -l)" >> "${BACKUP_DIR}/backup-metadata.txt"
```

Expected result: Metadata file with timestamp, version, instance count, and hypervisor count.

If unexpected: Non-critical. Proceed if metadata recording fails.

**Part B: Restore**

Step 6: Stop Nova containers on the controller.

```bash
docker stop nova_api nova_scheduler nova_conductor nova_novncproxy
```

Expected result: All containers stopped. Running instances on compute nodes continue running but are unmanageable.

If unexpected: Force stop with `docker kill <container-name>`.

Step 7: Restore Nova databases.

```bash
DB_PASS=$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}')
docker exec -i mariadb mysql -u root -p"${DB_PASS}" nova < "${BACKUP_DIR}/nova-db.sql"
docker exec -i mariadb mysql -u root -p"${DB_PASS}" nova_api < "${BACKUP_DIR}/nova-api-db.sql"
docker exec -i mariadb mysql -u root -p"${DB_PASS}" nova_cell0 < "${BACKUP_DIR}/nova-cell0-db.sql"
```

Expected result: No output on success. All three databases restored.

If unexpected: Drop and recreate databases before retrying the import.

Step 8: Start Nova containers.

```bash
docker start nova_api nova_scheduler nova_conductor nova_novncproxy
```

Expected result: All containers start and reach "Up" status.

If unexpected: Check container logs for startup errors.

Step 9: Reconcile host and instance mappings.

```bash
docker exec nova_api nova-manage cell_v2 discover_hosts --verbose
```

Expected result: All compute hosts discovered and mapped.

If unexpected: If hosts are not discovered, verify `nova_compute` containers are running on compute nodes.

### VERIFICATION

1. Run `openstack compute service list` and confirm all services are up
2. Run `openstack server list --all-projects` and confirm instances match the backup
3. Run `openstack hypervisor list` and confirm all hypervisors are present
4. Verify a running instance is still accessible: `openstack console url show <instance-id>`
5. Run OPS-NOVA-001 for a complete health check

### ROLLBACK

If restore fails:
1. Redeploy with `kolla-ansible -i inventory deploy --tags nova`
2. Reconcile hosts: `nova-manage cell_v2 discover_hosts`
3. Check instance consistency: compare `openstack server list` against hypervisor state
4. Verify with OPS-NOVA-001

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-KEYSTONE-001: Service Health Check (authentication dependency)
- https://docs.openstack.org/nova/latest/admin/manage-the-cloud.html
- https://docs.openstack.org/kolla-ansible/latest/reference/databases/mariadb-backup-and-restore.html
- SP-6105 SS 5.5 (Product Transition -- Backup and Recovery)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-004: Minor Upgrade

```
PROCEDURE ID: OPS-NOVA-004
TITLE: Nova Minor Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a minor version update to the Nova compute service. Execute when a new patch release is available within the same OpenStack major version. Minor upgrades apply bug fixes and security patches.

### PRECONDITIONS

1. SSH access to controller and compute nodes with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Kolla-Ansible updated to the target minor version
4. OPS-NOVA-003 backup completed
5. Maintenance window scheduled (Nova containers restart during upgrade)
6. OPS-NOVA-001 health check passing
7. No active instance migrations or resizes in progress

### SAFETY CONSIDERATIONS

- Nova API and scheduler will be briefly unavailable during container restarts (10-60 seconds)
- Running instances are not affected (they continue running on compute nodes)
- Instance management operations (create, delete, migrate) will fail during the upgrade window
- Compute service restart causes a brief period where the compute node shows as "down"
- Upgrade computes one at a time to maintain capacity

### PROCEDURE

Step 1: Record the current Nova version and instance status.

```bash
docker exec nova_api nova-manage --version 2>&1
openstack server list --all-projects --status ACTIVE -f value -c ID | wc -l
```

Expected result: Version captured and active instance count recorded.

If unexpected: Resolve failures using OPS-NOVA-001 before upgrading.

Step 2: Run pre-upgrade health checks.

```bash
openstack compute service list -f value -c State | sort | uniq -c
openstack hypervisor list -f value -c State | sort | uniq -c
```

Expected result: All services show `up` and all hypervisors show `up`.

If unexpected: Resolve any down services before proceeding.

Step 3: Execute the Nova upgrade.

```bash
kolla-ansible -i inventory upgrade --tags nova
```

Expected result: Ansible playbook completes with zero failed tasks. Controller and compute containers are upgraded sequentially.

If unexpected: Check Ansible output for the failed task. Proceed to ROLLBACK if the failure cannot be resolved.

Step 4: Verify the new Nova version.

```bash
docker exec nova_api nova-manage --version 2>&1
```

Expected result: Version number is higher than the value recorded in Step 1.

If unexpected: Verify container images with `docker images | grep nova`.

Step 5: Run post-upgrade verification.

```bash
openstack compute service list -f table
openstack hypervisor list -f table
openstack server list --all-projects --status ACTIVE -f value -c ID | wc -l
```

Expected result: All services up, all hypervisors present, and active instance count matches pre-upgrade.

If unexpected: If instance count differs, check for instances that changed status during upgrade.

Step 6: Verify instance reachability.

```bash
INSTANCE_ID=$(openstack server list --all-projects --status ACTIVE -f value -c ID | head -1)
openstack console url show "${INSTANCE_ID}" 2>/dev/null && echo "Console access: OK" || echo "No active instances to test"
```

Expected result: Console URL returned for a running instance.

If unexpected: If console access fails, check `nova_novncproxy` container: `docker logs nova_novncproxy 2>&1 | tail -20`.

### VERIFICATION

1. Confirm `nova-manage --version` shows the target version
2. Confirm all compute services are up and enabled
3. Confirm all hypervisors are present and reporting
4. Confirm active instance count matches pre-upgrade state
5. Confirm console access works for at least one instance
6. Run OPS-NOVA-001 for a complete health check

### ROLLBACK

1. Stop Nova containers on controller and compute nodes
2. Revert Kolla-Ansible to the previous version tag
3. Redeploy: `kolla-ansible -i inventory deploy --tags nova`
4. If database schema changed, restore from backup: OPS-NOVA-003 Part B
5. Verify with OPS-NOVA-001

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-NOVA-003: Backup and Restore
- OPS-KEYSTONE-001: Service Health Check (authentication dependency)
- https://docs.openstack.org/nova/latest/admin/upgrades.html
- https://docs.openstack.org/kolla-ansible/latest/user/operating-kolla.html#upgrading
- SP-6105 SS 5.4 (Operations -- System Updates)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-005: Major Upgrade

```
PROCEDURE ID: OPS-NOVA-005
TITLE: Nova Major Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a major version upgrade to the Nova compute service (e.g., 2024.1 Caracal to 2024.2 Dalmatian). Major upgrades may include database schema migrations, API changes, scheduler filter changes, and placement service updates. Execute during a planned maintenance window.

### PRECONDITIONS

1. SSH access to controller and compute nodes with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Kolla-Ansible upgraded to the target major release
4. Release notes reviewed for breaking changes and deprecations
5. OPS-NOVA-003 backup completed (all three databases)
6. OPS-NOVA-001 health check passing
7. Keystone already upgraded (OPS-KEYSTONE-005) if upgrading full stack
8. Maintenance window of at least 60 minutes scheduled
9. No active instance migrations, resizes, or builds in progress

### SAFETY CONSIDERATIONS

- Major upgrades include database migrations that may take 5-30 minutes depending on instance count
- All instance management operations are unavailable during the upgrade
- Running instances continue to run but are unmanageable during the upgrade
- Cell mapping changes may require manual reconciliation
- Placement service schema may be upgraded as part of this procedure
- If Keystone was not upgraded first, authentication may fail during the Nova upgrade

### PROCEDURE

Step 1: Record current state for comparison.

```bash
docker exec nova_api nova-manage --version 2>&1
openstack server list --all-projects -f json > /tmp/nova-instances-pre.json
openstack compute service list -f json > /tmp/nova-services-pre.json
openstack hypervisor list -f json > /tmp/nova-hypervisors-pre.json
```

Expected result: Version captured and three JSON files saved for post-upgrade comparison.

If unexpected: Resolve failures before proceeding.

Step 2: Verify cell mapping before upgrade.

```bash
docker exec nova_api nova-manage cell_v2 list_cells 2>&1
```

Expected result: `cell0` and `cell1` listed with valid transport URLs and database connections.

If unexpected: Fix cell mapping issues before upgrading. See OPS-NOVA-006.

Step 3: Verify the backup is complete.

```bash
ls -la /opt/backups/nova/$(ls /opt/backups/nova/ | sort | tail -1)/
```

Expected result: Backup directory contains `nova-db.sql`, `nova-api-db.sql`, `nova-cell0-db.sql`, and `instance-list.json`.

If unexpected: Run OPS-NOVA-003 Part A to create a fresh backup.

Step 4: Execute the major upgrade.

```bash
kolla-ansible -i inventory upgrade --tags nova
```

Expected result: Ansible playbook completes with zero failed tasks. Database migrations apply successfully.

If unexpected: If the playbook fails during database migration, do NOT retry. Proceed to ROLLBACK.

Step 5: Verify database migrations completed.

```bash
docker exec nova_api nova-manage db sync --check 2>&1
docker exec nova_api nova-manage api_db sync --check 2>&1
```

Expected result: Both commands indicate no pending migrations.

If unexpected: Run migrations manually: `docker exec nova_api nova-manage db sync` and `docker exec nova_api nova-manage api_db sync`.

Step 6: Discover and reconcile hosts.

```bash
docker exec nova_api nova-manage cell_v2 discover_hosts --verbose
```

Expected result: All compute hosts discovered and mapped to their cells.

If unexpected: If hosts are missing, check that compute containers are running on those nodes.

Step 7: Run extended post-upgrade verification.

```bash
openstack server list --all-projects -f json > /tmp/nova-instances-post.json
openstack compute service list -f json > /tmp/nova-services-post.json
openstack hypervisor list -f json > /tmp/nova-hypervisors-post.json
```

Expected result: JSON files saved for comparison.

Step 8: Compare pre-upgrade and post-upgrade state.

```bash
echo "=== Instance count ==="
echo "Before: $(python3 -c "import json; print(len(json.load(open('/tmp/nova-instances-pre.json'))))")"
echo "After:  $(python3 -c "import json; print(len(json.load(open('/tmp/nova-instances-post.json'))))")"
echo "=== Service count ==="
echo "Before: $(python3 -c "import json; print(len(json.load(open('/tmp/nova-services-pre.json'))))")"
echo "After:  $(python3 -c "import json; print(len(json.load(open('/tmp/nova-services-post.json'))))")"
echo "=== Hypervisor count ==="
echo "Before: $(python3 -c "import json; print(len(json.load(open('/tmp/nova-hypervisors-pre.json'))))")"
echo "After:  $(python3 -c "import json; print(len(json.load(open('/tmp/nova-hypervisors-post.json'))))")"
```

Expected result: All counts match between pre and post upgrade.

If unexpected: Investigate discrepancies. Missing instances may be in cell0 (scheduling failures).

Step 9: Verify the new version.

```bash
docker exec nova_api nova-manage --version 2>&1
```

Expected result: Version shows the target major release.

If unexpected: Check container images with `docker images | grep nova`.

### VERIFICATION

1. Confirm `nova-manage --version` shows the target major version
2. Confirm all compute services are up and enabled
3. Confirm all hypervisors are present and reporting resources
4. Confirm instance count matches pre-upgrade state
5. Confirm cell mapping is intact: `nova-manage cell_v2 list_cells`
6. Confirm no pending database migrations
7. Run OPS-NOVA-001 for a complete health check
8. Monitor logs for 30 minutes: `docker logs -f nova_api 2>&1 | grep -iE "ERROR|CRITICAL"`

### ROLLBACK

1. Stop Nova containers on all nodes
2. Restore all three databases from backup: OPS-NOVA-003 Part B
3. Revert Kolla-Ansible to the previous major version tag
4. Deploy previous version: `kolla-ansible -i inventory deploy --tags nova`
5. Reconcile hosts: `nova-manage cell_v2 discover_hosts`
6. Verify with OPS-NOVA-001
7. Check instance consistency against hypervisor state

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-NOVA-003: Backup and Restore
- OPS-NOVA-006: Troubleshooting Common Failures
- OPS-KEYSTONE-005: Major Upgrade (upgrade Keystone first)
- https://docs.openstack.org/nova/latest/admin/upgrades.html
- https://docs.openstack.org/releasenotes/nova/
- https://docs.openstack.org/kolla-ansible/latest/user/operating-kolla.html#upgrading
- SP-6105 SS 5.4-5.5 (Operations and Product Transition)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-006: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-NOVA-006
TITLE: Troubleshooting Common Nova Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Nova failure modes. Execute when instances fail to build, live migrations fail, the scheduler cannot place instances, console access breaks, or compute services go offline.

### PRECONDITIONS

1. SSH access to the controller and compute nodes with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Access to Docker for container log inspection
4. Understanding of the deployment topology (single-node or multi-node)

### SAFETY CONSIDERATIONS

- Some troubleshooting steps involve restarting containers, temporarily disrupting that service component
- Force-deleting instances permanently removes them and their data
- Modifying scheduler filters changes instance placement behavior for all new instances
- Document all changes made during troubleshooting

### PROCEDURE

**Failure Mode 1: Instances Stuck in BUILD or ERROR**

Step 1: Check the instance fault message.

```bash
openstack server show <instance-id> -c fault -f json
```

Expected result: The `fault` field contains an error message explaining the failure.

If unexpected: If no fault is recorded, check scheduler and compute logs (Steps 2-3).

Step 2: Check the scheduler logs for placement failures.

```bash
docker logs nova_scheduler 2>&1 | grep -iE "NoValidHost|filter" | tail -10
```

Expected result: Either no output (scheduler is not the issue) or "NoValidHost" entries indicating which filters eliminated all hosts.

If unexpected: If all hosts are filtered out, check placement resources:
```bash
openstack resource provider inventory list $(openstack resource provider list -f value -c uuid | head -1)
openstack resource provider usage show $(openstack resource provider list -f value -c uuid | head -1)
```

Step 3: Check the compute logs for build failures.

```bash
docker logs nova_compute 2>&1 | grep -iE "ERROR|exception|failed" | tail -10
```

Expected result: Specific error messages indicating the failure cause (libvirt, image download, network setup).

If unexpected: Enable debug logging temporarily:
```bash
docker exec nova_compute sed -i 's/^#debug = .*/debug = true/' /etc/nova/nova.conf
docker restart nova_compute
```
Reproduce the issue, then check logs again. Disable debug after troubleshooting.

Step 4: Clean up stuck instances.

```bash
openstack server set --state error <instance-id>
openstack server delete --force <instance-id>
```

Expected result: Instance moves to ERROR state and is then deleted.

If unexpected: If deletion fails, check for orphan ports and volumes:
```bash
openstack port list --device-id <instance-id>
openstack volume list --all-projects | grep <instance-id>
```

**Failure Mode 2: Live Migration Failures**

Step 5: Check migration status.

```bash
openstack server migration list --server <instance-id> -f table
```

Expected result: Migration entry showing the current state (queued, preparing, running, completed, or failed).

If unexpected: If no migration is listed, the migration may not have been accepted. Check API logs.

Step 6: Diagnose migration failure.

```bash
docker logs nova_compute 2>&1 | grep -i "migration\|migrate" | tail -20
```

Expected result: Log entries explaining the migration failure (CPU incompatibility, no shared storage, network mismatch).

Common fixes:
- No shared storage: use `--block-migration` flag
- CPU incompatibility: set `cpu_mode = host-model` in nova.conf on all compute nodes
- Libvirt version mismatch: upgrade libvirt to match across all compute nodes

**Failure Mode 3: Scheduler NoValidHost Errors**

Step 7: Check placement resource availability.

```bash
for rp in $(openstack resource provider list -f value -c uuid); do
  echo "=== Resource Provider: ${rp} ==="
  openstack resource provider inventory list ${rp} -f table
  openstack resource provider usage show ${rp} -f table
done
```

Expected result: Inventory shows total resources; usage shows current consumption. Free resources (inventory minus usage) must accommodate the requested flavor.

If unexpected: If resources are exhausted, either add compute capacity or delete unused instances.

Step 8: Check scheduler filter logs.

```bash
docker logs nova_scheduler 2>&1 | grep -i "filter" | tail -20
```

Expected result: Log entries showing which filters passed and which eliminated hosts.

Common filter failures:
- `AvailabilityZoneFilter`: requested AZ does not match any host's AZ
- `ComputeCapabilitiesFilter`: flavor extra specs do not match host aggregate properties
- `AggregateInstanceExtraSpecsFilter`: no aggregate has the required properties

**Failure Mode 4: Console Access Failures**

Step 9: Check VNC proxy status.

```bash
docker ps --filter "name=nova_novncproxy" --format "{{.Names}}: {{.Status}}"
docker logs nova_novncproxy 2>&1 | tail -10
```

Expected result: Container is "Up" with no error messages.

If unexpected: Restart with `docker restart nova_novncproxy`.

Step 10: Verify console URL generation.

```bash
openstack console url show <instance-id>
```

Expected result: A URL containing the controller hostname and port 6080.

If unexpected: Check firewall: `ss -tlnp | grep 6080`. Check `novncproxy_base_url` configuration.

**Failure Mode 5: Compute Service Down**

Step 11: Check the compute node containers.

```bash
docker ps --filter "name=nova_compute" --format "{{.Names}}: {{.Status}}"
docker ps --filter "name=nova_libvirt" --format "{{.Names}}: {{.Status}}"
```

Expected result: Both containers show "Up" status.

If unexpected: Restart containers:
```bash
docker restart nova_compute nova_libvirt
```

Step 12: Check for underlying host issues.

```bash
lsmod | grep kvm
df -h /var/lib/nova/instances
free -h
```

Expected result: KVM module loaded, sufficient disk space, and adequate free memory.

If unexpected:
- KVM not loaded: `modprobe kvm_intel` or `modprobe kvm_amd`
- Disk full: clean up old instances and images
- Memory exhausted: check for overcommit issues, adjust `ram_allocation_ratio`

### VERIFICATION

1. Confirm the specific failure is resolved
2. Confirm `openstack compute service list` shows all services as up
3. Confirm new instances can be created: `openstack server create --flavor m1.tiny --image cirros --network private test-instance`
4. Run OPS-NOVA-001 for a complete health check

### ROLLBACK

Troubleshooting procedures do not have a single rollback path. Each failure mode has recovery steps documented inline. If troubleshooting causes additional issues:
1. Restore from backup using OPS-NOVA-003 Part B
2. Redeploy with `kolla-ansible -i inventory deploy --tags nova`
3. Reconcile hosts: `nova-manage cell_v2 discover_hosts`

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-NOVA-003: Backup and Restore
- OPS-NOVA-008: Live Migration
- OPS-NOVA-010: Hypervisor Maintenance
- OPS-KEYSTONE-006: Troubleshooting Common Failures (authentication issues)
- https://docs.openstack.org/nova/latest/admin/troubleshooting.html
- https://docs.openstack.org/nova/latest/admin/troubleshooting/orphaned-resources.html
- https://docs.openstack.org/nova/latest/admin/live-migration-usage.html
- SP-6105 SS 5.4 (Operations -- Anomaly Resolution)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-007: Security Audit

```
PROCEDURE ID: OPS-NOVA-007
TITLE: Nova Security Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Perform a security audit of the Nova compute service. Execute monthly or after any security incident. Covers policy review, console proxy security, metadata service access controls, and compute node isolation verification.

### PRECONDITIONS

1. SSH access to controller and compute nodes with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Understanding of the organization's security requirements
4. Keystone authentication working (OPS-KEYSTONE-001)

### SAFETY CONSIDERATIONS

- This procedure is primarily read-only
- Policy changes require a Nova API restart to take effect
- Metadata service changes may affect instance cloud-init behavior
- Schedule any configuration changes during a maintenance window

### PROCEDURE

Step 1: Review Nova policy configuration.

```bash
docker exec nova_api cat /etc/nova/policy.yaml 2>/dev/null || echo "Using default policies (no custom overrides)"
```

Expected result: Either custom policy contents or confirmation that defaults are in use.

If unexpected: Review each custom rule against organizational security requirements. Default policies enforce project-level isolation.

Step 2: Verify console proxy security.

```bash
docker exec nova_novncproxy grep -E "^ssl_only|^cert|^key" /etc/nova/nova.conf 2>/dev/null
ss -tlnp | grep 6080
```

Expected result: VNC proxy is listening on port 6080. If TLS is enabled, SSL configuration is present.

If unexpected: If VNC is exposed without TLS on a production network, enable TLS in `globals.yml` and reconfigure.

Step 3: Verify metadata service access controls.

```bash
docker exec nova_api grep -E "^\[api\]|^metadata_listen|^metadata_workers" /etc/nova/nova.conf
```

Expected result: Metadata service listens on the internal network only (not on a public interface).

If unexpected: If metadata is exposed on a public interface, restrict the listen address in configuration.

Step 4: Verify compute node isolation.

```bash
docker exec nova_compute grep -E "^resume_guests_state_on_host_boot|^force_raw_images" /etc/nova/nova.conf
```

Expected result: `resume_guests_state_on_host_boot = false` (instances should not auto-start on host reboot without operator action). `force_raw_images = true` (prevents qcow2 backing file exploits).

If unexpected: Set `force_raw_images = true` for security. Set `resume_guests_state_on_host_boot` based on organizational policy.

Step 5: Audit instance security groups.

```bash
openstack security group list --all-projects -f table
openstack security group rule list default -f table
```

Expected result: Security groups follow organizational policy. The default security group should not allow unrestricted inbound access.

If unexpected: If the default security group allows all inbound traffic, tighten rules:
```bash
openstack security group rule delete <overly-permissive-rule-id>
```

Step 6: Verify service account credentials.

```bash
openstack user show nova --domain default -c password_expires_at -f value
```

Expected result: Password expiration is in the future or `None` (non-expiring service account).

If unexpected: Rotate the Nova service password via `passwords.yml` and reconfigure.

Step 7: Check for instances with direct host access.

```bash
openstack server list --all-projects -f json | python3 -c "
import json, sys
servers = json.load(sys.stdin)
for s in servers:
    if 'host' in str(s.get('Addresses', '')):
        print(f'WARNING: {s[\"ID\"]} may have host network access')
print('Audit complete')
"
```

Expected result: `Audit complete` with no warnings.

If unexpected: Investigate instances with host network access. Restrict unless explicitly required.

### VERIFICATION

1. Confirm policy files are reviewed and appropriate
2. Confirm console proxy has appropriate TLS configuration for the environment
3. Confirm metadata service is not exposed on public interfaces
4. Confirm `force_raw_images = true` is set on compute nodes
5. Confirm default security groups do not allow unrestricted inbound traffic
6. Confirm service account credentials are current

### ROLLBACK

Security audit findings should be addressed through their specific procedures:
- Policy changes: revert `policy.yaml` and restart Nova API
- Security group changes: re-add removed rules if business justification exists
- Configuration changes: revert via `kolla-ansible reconfigure --tags nova`

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-KEYSTONE-007: Security Audit (complementary identity audit)
- https://docs.openstack.org/nova/latest/admin/security.html
- https://docs.openstack.org/nova/latest/admin/secure-live-migration-with-qemu-native-tls.html
- https://docs.openstack.org/nova/latest/configuration/policy.html
- SP-6105 SS 5.4 (Operations -- Security Monitoring)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)
- NPR 7120.5 (NASA Information Security)

---

## OPS-NOVA-008: Live Migration

```
PROCEDURE ID: OPS-NOVA-008
TITLE: Live Instance Migration
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Migrate a running instance from one compute node to another with zero or minimal downtime. Execute before compute node maintenance, to rebalance workloads, or to evacuate a degraded host. Live migration transfers instance memory, CPU state, and optionally disk contents while the instance continues running.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. At least two compute nodes with available capacity
4. Shared storage (NFS, Ceph) configured between compute nodes, or willingness to use block migration
5. Compatible CPU models across source and destination hosts (or `cpu_mode = host-model`)
6. Matching libvirt versions on source and destination
7. Instance is in ACTIVE state and not currently performing another operation

### SAFETY CONSIDERATIONS

- Live migration causes a brief pause (milliseconds to seconds) at the final switchover
- Instances with high memory write rates may take longer to converge (dirty page tracking)
- Block migration (without shared storage) copies the entire disk, which can be slow for large instances
- Failed migration may leave the instance on the source host in a paused or error state
- Always verify instance health after migration completes
- Network connectivity interruption of 1-3 seconds is normal during switchover

### PROCEDURE

Step 1: Verify pre-migration state.

```bash
openstack server show <instance-id> -c status -c OS-EXT-SRV-ATTR:host -c OS-EXT-STS:vm_state -f table
```

Expected result: Instance shows `status=ACTIVE`, `vm_state=active`, and the current host name.

If unexpected: If the instance is not ACTIVE, start it first with `openstack server start <instance-id>`.

Step 2: Check available destination hosts.

```bash
openstack hypervisor list -f table
openstack compute service list --binary nova-compute -f table
```

Expected result: Multiple compute nodes with available resources and `State=up`, `Status=enabled`.

If unexpected: If only one compute node is available, migration is not possible. Add capacity or use cold migration with `openstack server migrate`.

Step 3: Verify shared storage (if not using block migration).

```bash
docker exec nova_compute df -h /var/lib/nova/instances
```

Expected result: Instance directory is on a shared filesystem (NFS, GlusterFS, or Ceph RBD mount).

If unexpected: Use `--block-migration` in Step 4 to copy the disk during migration.

Step 4: Execute live migration.

To a specific host:
```bash
openstack server migrate --live <destination-host> <instance-id>
```

With auto-selected destination:
```bash
openstack server migrate --live-migration <instance-id>
```

With block migration (no shared storage):
```bash
openstack server migrate --live <destination-host> --block-migration <instance-id>
```

Expected result: Command returns immediately. Migration begins in the background.

If unexpected: If the command returns an error, check for conflicting operations or insufficient resources on the destination.

Step 5: Monitor migration progress.

```bash
openstack server migration list --server <instance-id> -f table
openstack server show <instance-id> -c status -c OS-EXT-STS:task_state -f table
```

Expected result: Migration shows `Status=running` then transitions to `Status=completed`. Instance `task_state` shows `migrating` then clears.

If unexpected: If migration stalls, check compute logs:
```bash
docker logs nova_compute 2>&1 | grep -i "migration" | tail -20
```

Step 6: Verify post-migration state.

```bash
openstack server show <instance-id> -c status -c OS-EXT-SRV-ATTR:host -c OS-EXT-STS:vm_state -f table
```

Expected result: Instance shows `status=ACTIVE` on the destination host.

If unexpected: If the instance is in ERROR or PAUSED state on the source host, attempt recovery:
```bash
openstack server resume <instance-id>    # If paused
openstack server reboot --hard <instance-id>  # If error
```

Step 7: Verify instance network connectivity.

```bash
openstack server show <instance-id> -c addresses -f value
```

Expected result: Instance retains its IP addresses on the destination host.

If unexpected: If the instance lost network connectivity, check Neutron agent status on the destination host and verify OVS bridge configuration.

### VERIFICATION

1. Confirm instance is ACTIVE on the destination host
2. Confirm instance retains its original IP addresses
3. Confirm console access works: `openstack console url show <instance-id>`
4. Confirm source host no longer lists the instance
5. Confirm migration entry shows `Status=completed`

### ROLLBACK

If migration fails mid-way:
1. Check instance state on source host: `openstack server show <instance-id>`
2. If instance is PAUSED on source: `openstack server resume <instance-id>`
3. If instance is in ERROR: `openstack server reboot --hard <instance-id>`
4. If instance is lost from both hosts: check cell0 for scheduling failure records
5. As a last resort, evacuate from the source: `openstack server evacuate <instance-id> --host <available-host>`

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-NOVA-006: Troubleshooting Common Failures (migration failure diagnosis)
- OPS-NOVA-010: Hypervisor Maintenance (migration as maintenance prerequisite)
- OPS-KEYSTONE-001: Service Health Check (authentication dependency)
- https://docs.openstack.org/nova/latest/admin/live-migration-usage.html
- https://docs.openstack.org/nova/latest/admin/secure-live-migration-with-qemu-native-tls.html
- https://docs.openstack.org/nova/latest/admin/configuring-migrations.html
- SP-6105 SS 5.4 (Operations -- Workload Management)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-009: Flavor Management

```
PROCEDURE ID: OPS-NOVA-009
TITLE: Compute Flavor Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create, modify, delete, and manage access to compute flavors. Flavors define the resource profile (vCPUs, RAM, disk) for instances. Execute when adding new instance sizes, modifying resource allocations, setting access restrictions, or cleaning up unused flavors.

### PRECONDITIONS

1. SSH access to the controller node with sudo privileges
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. Keystone authentication working (OPS-KEYSTONE-001)
4. Understanding of the resource capacity available (check with `openstack hypervisor stats show`)

### SAFETY CONSIDERATIONS

- Deleting a flavor does not affect running instances that use it, but prevents creating new instances with that flavor
- Modifying flavor metadata (extra specs) affects scheduling for new instances only
- Private flavors restrict access to specific projects; misconfiguration can lock users out of needed sizes
- Flavor names must be unique; creating a flavor with a duplicate name fails

### PROCEDURE

**Part A: Create Flavors**

Step 1: Review current flavor list.

```bash
openstack flavor list -f table --long
```

Expected result: List of existing flavors with their IDs, names, RAM, disk, vCPUs, and properties.

If unexpected: If no flavors exist, this is a fresh deployment. Proceed to create the standard set.

Step 2: Create a public flavor (available to all projects).

```bash
openstack flavor create \
  --ram <ram-MB> \
  --disk <disk-GB> \
  --vcpus <vcpu-count> \
  --public \
  <flavor-name>
```

Example (standard set):
```bash
openstack flavor create --ram 512   --disk 1   --vcpus 1 m1.tiny
openstack flavor create --ram 2048  --disk 20  --vcpus 1 m1.small
openstack flavor create --ram 4096  --disk 40  --vcpus 2 m1.medium
openstack flavor create --ram 8192  --disk 80  --vcpus 4 m1.large
openstack flavor create --ram 16384 --disk 160 --vcpus 8 m1.xlarge
```

Expected result: Each command returns a table showing the created flavor with its properties.

If unexpected: If a flavor name already exists, choose a different name or delete the existing flavor first.

Step 3: Create a private flavor (restricted to specific projects).

```bash
openstack flavor create \
  --ram 32768 \
  --disk 320 \
  --vcpus 16 \
  --private \
  m1.xxlarge
```

Expected result: Flavor created with `Is Public = False`.

If unexpected: If the flavor is accidentally created as public, delete and recreate as private.

Step 4: Grant project access to a private flavor.

```bash
openstack flavor set --project <project-id-or-name> m1.xxlarge
```

Expected result: No output on success. The specified project can now use this flavor.

If unexpected: Verify the project exists: `openstack project show <project-name>`.

**Part B: Modify Flavor Metadata**

Step 5: Set extra specs for scheduling and hardware configuration.

```bash
openstack flavor set <flavor-name> \
  --property hw:cpu_policy=dedicated \
  --property hw:numa_nodes=1 \
  --property hw:mem_page_size=large
```

Expected result: No output on success. Properties are attached to the flavor.

If unexpected: Verify with `openstack flavor show <flavor-name> -c properties`.

Step 6: Set aggregate-targeting metadata.

```bash
openstack flavor set <flavor-name> \
  --property aggregate_instance_extra_specs:ssd=true
```

Expected result: Instances using this flavor will only be scheduled on hosts in aggregates with the `ssd=true` property.

If unexpected: Verify the target aggregate has the matching property:
```bash
openstack aggregate show <aggregate-name> -c properties
```

**Part C: Delete Flavors**

Step 7: Check if any instances use the flavor before deletion.

```bash
openstack server list --all-projects --flavor <flavor-name> -f table
```

Expected result: No instances or a list of instances using this flavor.

If unexpected: If instances exist, they will continue to run but cannot be resized or rebuilt with this flavor after deletion.

Step 8: Delete the flavor.

```bash
openstack flavor delete <flavor-name>
```

Expected result: No output on success. The flavor is removed from the list.

If unexpected: If deletion fails, check for flavor ID conflicts and use the ID instead of the name.

**Part D: Verify Flavor Configuration**

Step 9: Verify the complete flavor list.

```bash
openstack flavor list --long -f table
```

Expected result: All expected flavors are listed with correct RAM, disk, vCPU, and access settings.

If unexpected: Correct any discrepancies by modifying or recreating flavors.

### VERIFICATION

1. Confirm `openstack flavor list` shows all expected flavors
2. Confirm private flavors have correct project access: `openstack flavor show <name> -c access_project_ids`
3. Confirm extra specs are set correctly: `openstack flavor show <name> -c properties`
4. Test instance creation with a flavor: `openstack server create --flavor <name> --image cirros --network private test-flavor`
5. Delete the test instance after verification

### ROLLBACK

1. If a flavor was accidentally deleted: recreate with the same specifications
2. If extra specs were set incorrectly: remove with `openstack flavor unset --property <key> <flavor-name>`
3. If a private flavor has wrong access: remove access with `openstack flavor unset --project <project-id> <flavor-name>`
4. Deleted flavors cannot be recovered; recreate from known specifications

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-NOVA-002: Configuration Verification (scheduler filter settings)
- OPS-KEYSTONE-001: Service Health Check (authentication dependency)
- https://docs.openstack.org/nova/latest/admin/flavors.html
- https://docs.openstack.org/nova/latest/admin/aggregates.html
- https://docs.openstack.org/nova/latest/admin/cpu-topologies.html
- SP-6105 SS 5.4 (Operations -- Resource Management)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)

---

## OPS-NOVA-010: Hypervisor Maintenance

```
PROCEDURE ID: OPS-NOVA-010
TITLE: Hypervisor Maintenance Window
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Safely take a compute node out of service for maintenance (hardware repair, OS patching, firmware updates, disk replacement). This procedure disables scheduling, migrates all instances off the host, performs maintenance, and re-enables the host. Execute before any planned compute node downtime.

### PRECONDITIONS

1. SSH access to the controller node and the target compute node
2. Admin credentials sourced from `/etc/kolla/admin-openrc.sh`
3. At least one other compute node with sufficient capacity to receive migrated instances
4. Live migration prerequisites met (OPS-NOVA-008 preconditions) or willingness to cold-migrate
5. Maintenance window scheduled with user notification

### SAFETY CONSIDERATIONS

- All instances on the target host must be migrated before maintenance begins
- If destination hosts lack capacity, some instances may fail to migrate
- Live migration causes brief network interruption (1-3 seconds) for each instance
- Cold migration stops instances during the move (significant downtime per instance)
- Hardware maintenance that replaces disks will destroy any locally-stored instance data
- Back up instance data before hardware maintenance if local storage is used

### PROCEDURE

Step 1: Identify instances on the target compute node.

```bash
openstack server list --all-projects --host <compute-host> -f table
```

Expected result: List of all instances currently running on the target host.

If unexpected: If the command returns an error, verify authentication (OPS-KEYSTONE-001) and compute service status (OPS-NOVA-001).

Step 2: Disable scheduling on the target compute node.

```bash
openstack compute service set --disable --disable-reason "Scheduled maintenance $(date +%Y-%m-%d)" <compute-host> nova-compute
```

Expected result:
```
+----------+--------------+----------+-------------------------------------------+
| Host     | Binary       | Status   | Disabled Reason                           |
+----------+--------------+----------+-------------------------------------------+
| compute1 | nova-compute | disabled | Scheduled maintenance 2026-02-23          |
+----------+--------------+----------+-------------------------------------------+
```

If unexpected: If the command fails, check that the compute service is registered: `openstack compute service list`.

Step 3: Migrate all instances off the host.

For live migration (minimal downtime):
```bash
for instance_id in $(openstack server list --all-projects --host <compute-host> -f value -c ID); do
  echo "Migrating ${instance_id}..."
  openstack server migrate --live-migration ${instance_id}
  sleep 5
done
```

For cold migration (instances will be stopped):
```bash
for instance_id in $(openstack server list --all-projects --host <compute-host> -f value -c ID); do
  echo "Migrating ${instance_id}..."
  openstack server migrate ${instance_id}
  sleep 10
done
```

Expected result: Each migration command returns without error. Instances begin migrating to other hosts.

If unexpected: If a specific instance fails to migrate, check its status and try with `--block-migration` or migrate manually. See OPS-NOVA-008 for migration troubleshooting.

Step 4: Wait for all migrations to complete and verify the host is empty.

```bash
while true; do
  COUNT=$(openstack server list --all-projects --host <compute-host> -f value -c ID | wc -l)
  echo "Instances remaining: ${COUNT}"
  [ "${COUNT}" -eq 0 ] && break
  sleep 15
done
echo "Host evacuated successfully"
```

Expected result: Instance count reaches 0. Host is empty and ready for maintenance.

If unexpected: If instances refuse to migrate, stop them with `openstack server stop <id>`, then cold-migrate.

Step 5: Confirm cold-migrated instances (if applicable).

```bash
openstack server list --all-projects --status VERIFY_RESIZE -f table
```

Expected result: If cold migration was used, instances show `VERIFY_RESIZE` status.

If unexpected: Confirm each migration:
```bash
openstack server resize confirm <instance-id>
```

Step 6: Perform maintenance on the compute node.

```bash
echo "Maintenance tasks:"
echo "1. Apply OS patches"
echo "2. Update firmware"
echo "3. Replace hardware"
echo "4. Reboot if required"
```

Expected result: Maintenance completed. Compute node is ready to rejoin the cluster.

If unexpected: If the compute node cannot be returned to service, contact hardware support.

Step 7: Verify the compute node is back online.

```bash
docker ps --filter "name=nova_compute" --format "{{.Names}}: {{.Status}}"
docker ps --filter "name=nova_libvirt" --format "{{.Names}}: {{.Status}}"
```

Expected result: Both `nova_compute` and `nova_libvirt` containers are running.

If unexpected: Start containers: `docker start nova_compute nova_libvirt`. If containers were removed during maintenance, run `kolla-ansible -i inventory deploy --tags nova --limit <compute-host>`.

Step 8: Re-enable scheduling on the compute node.

```bash
openstack compute service set --enable <compute-host> nova-compute
```

Expected result: Compute service shows `Status=enabled`.

If unexpected: Verify the service is registered: `openstack compute service list`.

Step 9: Verify the compute node is accepting instances.

```bash
openstack compute service list --host <compute-host> -f table
openstack hypervisor show <compute-host> -c running_vms -c vcpus_used -f table
```

Expected result: Service shows `State=up, Status=enabled`. Hypervisor shows resource availability.

If unexpected: If the service stays `down`, check container logs and network connectivity.

### VERIFICATION

1. Confirm compute service is `up` and `enabled` on the maintained host
2. Confirm hypervisor shows available resources
3. Confirm previously migrated instances are running on their destination hosts
4. Test instance creation on the maintained host: `openstack server create --flavor m1.tiny --image cirros --network private --availability-zone nova:<compute-host> test-maintenance`
5. Delete the test instance after verification
6. Run OPS-NOVA-001 for a complete health check

### ROLLBACK

If maintenance fails and the compute node cannot be returned to service:
1. Keep scheduling disabled on the node
2. Ensure all instances were migrated off (Step 4)
3. If the node will be permanently decommissioned: `openstack compute service delete <service-id>`
4. Remove the host from any aggregates: `openstack aggregate remove host <aggregate> <host>`

### REFERENCES

- OPS-NOVA-001: Service Health Check
- OPS-NOVA-006: Troubleshooting Common Failures
- OPS-NOVA-008: Live Migration (pre-maintenance migration procedure)
- OPS-KEYSTONE-001: Service Health Check (authentication dependency)
- https://docs.openstack.org/nova/latest/admin/manage-the-cloud.html
- https://docs.openstack.org/nova/latest/admin/live-migration-usage.html
- https://docs.openstack.org/nova/latest/admin/evacuate.html
- SP-6105 SS 5.4 (Operations -- Scheduled Maintenance)
- NPR 7123.1 SS 3.2 Process 9 (Product Transition)
