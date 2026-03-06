> **Context:** These documents are domain-specific educational content from the [OpenStack Cloud Platform pack (v1.33)](../release-notes/v1.33/README.md), built using NASA Systems Engineering standards.

# Cinder Operations Manual -- Block Storage Service Procedures

**Service:** OpenStack Cinder (Block Storage)
**SE Phase:** Phase E (Operations & Sustainment)
**NPR Reference:** NPR 7123.1 SS 3.2 Process 9 (Product Transition)
**Document Standard:** NASA-STD-3001 (adapted for cloud operations)

This document contains all operational procedures for the OpenStack Cinder block storage service. Cinder provides persistent block storage volumes that attach to Nova compute instances, with an LVM/iSCSI backend for single-node deployments. Each procedure follows NASA procedure format with verification commands that can be validated against the running system.

---

## Table of Contents

- [OPS-CINDER-001: Service Health Check (Daily)](#ops-cinder-001-service-health-check-daily)
- [OPS-CINDER-002: Configuration Verification](#ops-cinder-002-configuration-verification)
- [OPS-CINDER-003: Backup and Restore](#ops-cinder-003-backup-and-restore)
- [OPS-CINDER-004: Minor Upgrade](#ops-cinder-004-minor-upgrade)
- [OPS-CINDER-005: Major Upgrade](#ops-cinder-005-major-upgrade)
- [OPS-CINDER-006: Troubleshooting Common Failures](#ops-cinder-006-troubleshooting-common-failures)
- [OPS-CINDER-007: Security Audit](#ops-cinder-007-security-audit)
- [OPS-CINDER-008: Volume Migration](#ops-cinder-008-volume-migration)
- [OPS-CINDER-009: Backend Failover](#ops-cinder-009-backend-failover)
- [OPS-CINDER-010: Snapshot Management](#ops-cinder-010-snapshot-management)

---

## OPS-CINDER-001: Service Health Check (Daily)

```
PROCEDURE ID: OPS-CINDER-001
TITLE: Cinder Service Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Verify that all Cinder block storage services are running, volume backends are accessible, iSCSI targets are functional, and logs contain no critical errors. Execute daily as part of the operations health monitoring cycle.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Keystone authentication is configured and working (see OPS-KEYSTONE-001)
3. Operator has admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
4. Docker daemon is running on the host

### SAFETY CONSIDERATIONS

- This is a read-only procedure with no risk of data loss or service disruption
- LVM commands (`lvs`, `vgs`) are read-only when used without modification flags
- Do not restart Cinder services if volumes are actively being attached or detached -- check for in-progress operations first

### PROCEDURE

Step 1: Verify Cinder containers are running.

```bash
docker ps --format '{{.Names}}' | grep cinder
```

Expected result:
```
cinder_api
cinder_scheduler
cinder_volume
cinder_backup
```

If unexpected: If any container is missing, check its status with `docker ps -a --filter name=cinder`. If the container exited, inspect logs with `docker logs <container_name> 2>&1 | tail -50`. Restart with `docker restart <container_name>`.

Step 2: Check volume service list.

```bash
openstack volume service list
```

Expected result: All services show status "up" and state "enabled":
```
+------------------+----------+------+---------+-------+
| Binary           | Host     | Zone | Status  | State |
+------------------+----------+------+---------+-------+
| cinder-scheduler | node-1   | nova | enabled | up    |
| cinder-volume    | node-1@lvm-1 | nova | enabled | up |
| cinder-backup    | node-1   | nova | enabled | up    |
+------------------+----------+------+---------+-------+
```

If unexpected: If any service shows "down" or "disabled", restart the corresponding container. If `cinder-volume` is down, check the LVM backend (Step 3).

Step 3: Verify LVM backend connectivity.

```bash
vgs cinder-volumes
```

Expected result:
```
  VG             #PV #LV #SN Attr   VSize   VFree
  cinder-volumes   1   2   0 wz--n- 50.00g  30.00g
```
(Values will vary based on your deployment.)

If unexpected: If the volume group is not found, check with `pvs` to verify the physical volume is still present. If the disk failed, refer to OPS-CINDER-006.

Step 4: Verify LVM logical volumes correspond to Cinder volumes.

```bash
lvs cinder-volumes
```

Expected result: Logical volumes listed match active Cinder volumes. LV names follow the pattern `volume-<uuid>`.

If unexpected: If LVs exist that do not correspond to any Cinder volume, they may be orphaned. Document and schedule cleanup.

Step 5: Check iSCSI target service.

```bash
docker exec cinder_volume targetcli ls / 2>/dev/null || docker exec cinder_volume tgtadm --lld iscsi --op show --mode target 2>/dev/null
```

Expected result: iSCSI targets listed for attached volumes.

If unexpected: If no targets are listed but volumes are attached, the iSCSI target service may need restart. Check `docker logs cinder_volume 2>&1 | grep -i iscsi`.

Step 6: Check Cinder logs for errors.

```bash
docker logs cinder_volume 2>&1 | grep -i error | tail -20
docker logs cinder_api 2>&1 | grep -i error | tail -20
```

Expected result: No recent ERROR-level messages. Occasional deprecation warnings are acceptable.

If unexpected: Record the error messages and correlate with timestamps. Recurring errors indicate a persistent issue -- refer to OPS-CINDER-006.

### VERIFICATION

1. Confirm all Cinder containers running: `docker ps --filter name=cinder --format '{{.Names}}: {{.Status}}'`
2. Confirm all services up: `openstack volume service list -f value -c State | sort -u` returns only `up`
3. Confirm VG exists: `vgs cinder-volumes` returns without error
4. Confirm API responds: `openstack volume list` returns without error

### ROLLBACK

This is a read-only health check procedure. No rollback is required.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (authentication prerequisite)
- OPS-NOVA-001: Nova Service Health Check (compute-volume integration)
- OpenStack Cinder Administration Guide: https://docs.openstack.org/cinder/2024.2/admin/
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-002: Configuration Verification

```
PROCEDURE ID: OPS-CINDER-002
TITLE: Cinder Configuration Verification
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm that Cinder configuration matches the expected state after any deployment, reconfiguration, or upgrade. Verify backend settings, LVM volume group configuration, iSCSI target service, volume type definitions, and backend capacity. Execute after every configuration change.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Access to the deployment host with `globals.yml` available
4. Cinder containers are running (confirm with OPS-CINDER-001)

### SAFETY CONSIDERATIONS

- This is a read-only procedure with no risk of data loss
- Do not modify configuration files during verification -- changes require a reconfigure cycle
- Volume type changes affect new volumes only, not existing ones

### PROCEDURE

Step 1: Verify Cinder settings in globals.yml.

```bash
grep -E 'enable_cinder|cinder_volume_group|cinder_backup|enable_cinder_backup' /etc/kolla/globals.yml
```

Expected result:
```
enable_cinder: "yes"
cinder_volume_group: "cinder-volumes"
enable_cinder_backup: "yes"
```

If unexpected: If settings are missing or incorrect, do not modify globals.yml during verification. Record the discrepancy and schedule reconfiguration.

Step 2: Verify LVM backend configuration in Cinder.

```bash
docker exec cinder_volume grep -A10 '\[lvm' /etc/cinder/cinder.conf
```

Expected result:
```
[lvm-1]
volume_driver = cinder.volume.drivers.lvm.LVMVolumeDriver
volume_group = cinder-volumes
volume_backend_name = lvm-1
target_protocol = iscsi
target_helper = lioadm
```

If unexpected: If the volume_group does not match the actual VG name, reconfigure with `kolla-ansible reconfigure --tags cinder`.

Step 3: Verify iSCSI target service configuration.

```bash
docker exec cinder_volume grep -E 'target_protocol|target_helper|target_ip_address' /etc/cinder/cinder.conf
```

Expected result: `target_protocol = iscsi` and `target_helper` is set to `lioadm` or `tgtadm`.

If unexpected: Incorrect iSCSI settings prevent volume attachment. Reconfigure with `kolla-ansible reconfigure --tags cinder`.

Step 4: Check volume type definitions.

```bash
openstack volume type list
openstack volume type show lvm-standard 2>/dev/null || echo "No volume types defined"
```

Expected result: At least one volume type is defined with `volume_backend_name` matching the backend.

If unexpected: Create a default volume type: `openstack volume type create lvm-standard && openstack volume type set lvm-standard --property volume_backend_name=lvm-1`.

Step 5: Validate backend capacity.

```bash
vgs cinder-volumes -o vg_name,vg_size,vg_free --noheadings
```

Expected result: Volume group has sufficient free space for new volume creation.

If unexpected: If VFree is less than 10% of VSize, capacity planning is needed. Alert the operations team.

Step 6: Verify oversubscription ratio.

```bash
docker exec cinder_volume grep max_over_subscription_ratio /etc/cinder/cinder.conf
```

Expected result: `max_over_subscription_ratio = 1.0` (no oversubscription for LVM backend).

If unexpected: Values greater than 1.0 with LVM thick provisioning can lead to volume creation failures when actual space is exhausted.

### VERIFICATION

1. Confirm backend name matches: `docker exec cinder_volume grep volume_backend_name /etc/cinder/cinder.conf` matches volume type extra specs
2. Confirm VG name matches: `docker exec cinder_volume grep volume_group /etc/cinder/cinder.conf` matches `vgs` output
3. Confirm volume type exists: `openstack volume type list` returns at least one entry
4. Confirm capacity available: `vgs cinder-volumes --noheadings -o vg_free` shows free space

### ROLLBACK

This is a read-only verification procedure. No rollback is required. If misconfigurations are found, address them through `kolla-ansible reconfigure --tags cinder`.

### REFERENCES

- OPS-CINDER-001: Service Health Check (prerequisite)
- OPS-KEYSTONE-002: Keystone Configuration Verification
- OpenStack Cinder Configuration: https://docs.openstack.org/cinder/2024.2/configuration/
- OpenStack Cinder LVM Backend: https://docs.openstack.org/cinder/2024.2/admin/blockstorage-lio-iscsi-support.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-003: Backup and Restore

```
PROCEDURE ID: OPS-CINDER-003
TITLE: Cinder Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Cinder database, volume metadata, and LVM configuration for disaster recovery. Includes restore procedure with volume attachment verification. Execute before any upgrade, migration, or destructive maintenance.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced and database access
3. Sufficient storage space for backup files
4. All Cinder services are up (confirm with OPS-CINDER-001)
5. No active volume operations in progress (check with `openstack volume list --status creating`)

### SAFETY CONSIDERATIONS

- Database backup is read-only and does not affect running services
- LVM metadata export is read-only
- Restore is destructive -- it replaces the current Cinder database
- Restore requires stopping Cinder services, causing a storage control plane outage
- Attached volumes remain accessible during control plane downtime (data plane unaffected)
- LVM snapshot backups consume space from the volume group

### PROCEDURE

**Backup:**

Step 1: Create a timestamped backup directory.

```bash
BACKUP_DIR="/backup/cinder/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
```

Expected result: Directory created successfully.

If unexpected: If the filesystem is full, free space or use a different backup location.

Step 2: Back up the Cinder database.

```bash
docker exec mariadb mysqldump -u root -p"$(grep database_password /etc/kolla/passwords.yml | awk '{print $2}')" cinder > "$BACKUP_DIR/cinder_db.sql"
```

Expected result: File `cinder_db.sql` is created with non-zero size.

If unexpected: If the dump fails, check MariaDB connectivity: `docker exec mariadb mysql -u root -p"<password>" -e "SHOW DATABASES;"`.

Step 3: Back up volume metadata.

```bash
openstack volume list --all-projects -f json > "$BACKUP_DIR/volumes.json"
openstack volume type list -f json > "$BACKUP_DIR/volume_types.json"
openstack volume snapshot list --all-projects -f json > "$BACKUP_DIR/snapshots.json"
openstack volume backup list --all-projects -f json > "$BACKUP_DIR/backups.json"
```

Expected result: JSON files capture all volume, type, snapshot, and backup metadata.

If unexpected: API errors indicate Cinder service issues. Resolve with OPS-CINDER-001.

Step 4: Back up LVM configuration.

```bash
vgs cinder-volumes > "$BACKUP_DIR/vgs_output.txt"
lvs cinder-volumes > "$BACKUP_DIR/lvs_output.txt"
pvs > "$BACKUP_DIR/pvs_output.txt"
vgcfgbackup -f "$BACKUP_DIR/cinder-volumes.vgcfg" cinder-volumes
```

Expected result: LVM configuration files created, including VG metadata backup.

If unexpected: If `vgcfgbackup` fails, the volume group may be corrupt. Check `vgs` and `pvs` for error states.

Step 5: Verify backup integrity.

```bash
ls -lh "$BACKUP_DIR/"
head -5 "$BACKUP_DIR/cinder_db.sql"
cat "$BACKUP_DIR/vgs_output.txt"
```

Expected result: All files have non-zero size. SQL file starts with dump headers. VG output matches expected configuration.

If unexpected: Re-run failed backup steps. Do not proceed with maintenance until backup is verified.

**Restore:**

Step 6: Stop Cinder services.

```bash
docker stop cinder_api cinder_scheduler cinder_volume cinder_backup 2>/dev/null
```

Expected result: All Cinder containers stopped. Existing volume attachments remain functional (data plane unaffected).

If unexpected: If containers cannot be stopped, use `docker kill <container_name>`.

Step 7: Restore the Cinder database.

```bash
docker exec -i mariadb mysql -u root -p"$(grep database_password /etc/kolla/passwords.yml | awk '{print $2}')" cinder < "$BACKUP_DIR/cinder_db.sql"
```

Expected result: Database restored without errors.

If unexpected: If restore fails with schema errors, the backup may be from a different OpenStack version. Verify version compatibility.

Step 8: Restore LVM configuration if needed.

```bash
vgcfgrestore -f "$BACKUP_DIR/cinder-volumes.vgcfg" cinder-volumes
```

Expected result: VG metadata restored.

If unexpected: If restore fails, the physical volume may have changed. Check `pvs` and verify disk integrity.

Step 9: Restart Cinder services.

```bash
docker start cinder_api cinder_scheduler cinder_volume cinder_backup
sleep 15
```

Expected result: All containers start successfully.

If unexpected: Check logs: `docker logs cinder_volume 2>&1 | tail -20`. Database migration issues require manual intervention.

Step 10: Verify volume attachment after restore.

```bash
openstack volume list --all-projects
openstack volume list --all-projects --status in-use
```

Expected result: All volumes restored with correct status. In-use volumes still attached to instances.

If unexpected: If volumes show incorrect status, reset with `openstack volume set --state <correct-state> <volume>`.

### VERIFICATION

1. Confirm backup files exist: `ls -la "$BACKUP_DIR/"` shows all expected files
2. Confirm database restored: `docker exec mariadb mysql -u root -p"<password>" -e "SELECT COUNT(*) FROM cinder.volumes;"`
3. Confirm services up: `openstack volume service list` shows all up
4. Confirm volumes accessible: `openstack volume list --all-projects` returns expected volumes
5. Confirm attachments intact: `openstack volume list --status in-use` matches pre-restore state

### ROLLBACK

If the restore causes issues, restore from a different (earlier) backup by repeating Steps 6-9 with the earlier backup directory. If no earlier backup exists, redeploy Cinder with `kolla-ansible deploy --tags cinder`.

### REFERENCES

- OPS-CINDER-001: Service Health Check (pre/post verification)
- OPS-KEYSTONE-003: Keystone Backup and Restore (auth prerequisite)
- OpenStack Cinder Database: https://docs.openstack.org/cinder/2024.2/admin/
- SP-6105 SS 5.5: Product Transition -- Backup and Recovery
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-004: Minor Upgrade

```
PROCEDURE ID: OPS-CINDER-004
TITLE: Cinder Minor Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a minor version update to the Cinder service using Kolla-Ansible. Minor upgrades apply patch-level updates within the same OpenStack release. Execute when container images are updated with security patches or bug fixes.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Backup completed (OPS-CINDER-003)
4. New container images pulled and available locally
5. All Cinder services are up (confirm with OPS-CINDER-001)
6. No volumes in "creating," "deleting," or "attaching" state

### SAFETY CONSIDERATIONS

- Minor upgrades briefly restart Cinder containers, causing a short control plane outage
- Existing volume attachments are not affected (data plane continues)
- New volume operations (create, delete, attach, detach) will fail during the upgrade window
- iSCSI sessions are not disrupted during a control plane restart

### PROCEDURE

Step 1: Capture pre-upgrade volume state.

```bash
openstack volume service list -f json > /tmp/cinder_pre_upgrade_services.json
openstack volume list --all-projects -f json > /tmp/cinder_pre_upgrade_volumes.json
openstack volume list --all-projects --status in-use -f json > /tmp/cinder_pre_upgrade_attached.json
```

Expected result: JSON files capture current service status and volume state.

If unexpected: Resolve API issues before proceeding.

Step 2: Verify no volumes are in transitional states.

```bash
openstack volume list --all-projects --status creating
openstack volume list --all-projects --status deleting
openstack volume list --all-projects --status attaching
openstack volume list --all-projects --status detaching
```

Expected result: No volumes in transitional states.

If unexpected: Wait for operations to complete or resolve stuck volumes (OPS-CINDER-006) before upgrading.

Step 3: Execute the Cinder upgrade.

```bash
kolla-ansible upgrade -i /etc/kolla/inventory --tags cinder
```

Expected result: Upgrade completes without errors.

If unexpected: Check Ansible output for failing tasks. Common issues: database migration errors, container startup failures. Check `docker logs cinder_volume 2>&1 | tail -50`.

Step 4: Verify all services are up after upgrade.

```bash
openstack volume service list
```

Expected result: All services show "up" and "enabled."

If unexpected: Wait up to 120 seconds for services to reconnect. If services remain down, restart individually.

Step 5: Verify volume attachments after upgrade.

```bash
openstack volume list --all-projects --status in-use
```

Expected result: Same in-use volumes as pre-upgrade.

If unexpected: Compare with pre-upgrade state. If attachments differ, check iSCSI sessions: `iscsiadm -m session`.

Step 6: Verify LVM backend integrity.

```bash
vgs cinder-volumes
lvs cinder-volumes
```

Expected result: Volume group and logical volumes intact with expected sizes.

If unexpected: If the VG is not found, check disk health and PV status with `pvs`.

### VERIFICATION

1. Confirm services up: `openstack volume service list -f value -c State | sort -u` returns only `up`
2. Confirm volume count matches: `openstack volume list --all-projects | wc -l` matches pre-upgrade
3. Confirm attachments intact: `openstack volume list --status in-use | wc -l` matches pre-upgrade
4. Confirm VG intact: `vgs cinder-volumes` returns without error

### ROLLBACK

1. Stop upgraded containers: `docker stop cinder_api cinder_scheduler cinder_volume cinder_backup`
2. Restore previous container images by re-running deployment with the previous tag
3. If database migration occurred, restore from backup (OPS-CINDER-003)
4. Verify rollback: `openstack volume service list`

### REFERENCES

- OPS-CINDER-001: Service Health Check (pre/post verification)
- OPS-CINDER-003: Backup and Restore (pre-upgrade backup)
- OPS-KEYSTONE-004: Keystone Minor Upgrade (upgrade prerequisite)
- OpenStack Cinder Upgrades: https://docs.openstack.org/cinder/2024.2/admin/blockstorage-manage-volumes.html
- SP-6105 SS 5.4: System Maintenance and Upgrades
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-005: Major Upgrade

```
PROCEDURE ID: OPS-CINDER-005
TITLE: Cinder Major Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a major version upgrade to the Cinder service (e.g., from 2024.1 to 2024.2). Major upgrades include database schema migrations and potential API changes. Execute during a planned maintenance window.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Full backup completed (OPS-CINDER-003)
4. Keystone has been upgraded first (OPS-KEYSTONE-005)
5. All Cinder services are up (confirm with OPS-CINDER-001)
6. No volumes in transitional states
7. Maintenance window communicated to all users

### SAFETY CONSIDERATIONS

- Major upgrades involve database schema migrations that are NOT reversible without a full database restore
- The control plane will be unavailable during the upgrade (typically 5-15 minutes)
- Existing volume attachments continue functioning (data plane unaffected)
- New volume operations will fail during the upgrade window
- Test the upgrade in a staging environment first if possible

### PROCEDURE

Step 1: Capture comprehensive pre-upgrade state.

```bash
UPGRADE_DIR="/backup/cinder/major_upgrade_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$UPGRADE_DIR"
openstack volume service list -f json > "$UPGRADE_DIR/services.json"
openstack volume list --all-projects -f json > "$UPGRADE_DIR/volumes.json"
openstack volume type list -f json > "$UPGRADE_DIR/volume_types.json"
openstack volume snapshot list --all-projects -f json > "$UPGRADE_DIR/snapshots.json"
vgs cinder-volumes > "$UPGRADE_DIR/vgs.txt"
lvs cinder-volumes > "$UPGRADE_DIR/lvs.txt"
```

Expected result: All state files created.

If unexpected: Resolve API issues before proceeding.

Step 2: Run full backup (OPS-CINDER-003).

```bash
# Execute OPS-CINDER-003 backup procedure
```

Expected result: Complete backup including database and LVM configuration.

If unexpected: Do not proceed until backup is verified.

Step 3: Execute the major upgrade.

```bash
kolla-ansible upgrade -i /etc/kolla/inventory --tags cinder
```

Expected result: Upgrade completes with database migrations applied.

If unexpected: If the upgrade fails during database migration, do NOT retry. Check the error and restore from backup if unrecoverable.

Step 4: Verify database migration completed.

```bash
docker exec cinder_volume cinder-manage db version
```

Expected result: Database version matches the target release.

If unexpected: If the version is incorrect, the migration may have partially failed. Check `docker logs cinder_volume 2>&1 | grep -i migration`.

Step 5: Verify all services are up.

```bash
openstack volume service list
```

Expected result: All services up with updated binary version.

If unexpected: Wait up to 180 seconds. Restart services individually if needed.

Step 6: Verify volume accessibility.

```bash
openstack volume list --all-projects
openstack volume list --all-projects --status in-use
```

Expected result: All volumes present with correct status.

If unexpected: Compare with pre-upgrade state. Restore from backup if volumes are missing.

Step 7: Verify LVM backend integrity.

```bash
vgs cinder-volumes
lvs cinder-volumes
```

Expected result: Volume group and logical volumes intact.

If unexpected: Check `pvs` for physical volume issues.

Step 8: Test volume operations.

```bash
openstack volume create --size 1 upgrade-test-volume
openstack volume show upgrade-test-volume -c status
openstack volume delete upgrade-test-volume
```

Expected result: Volume created, shows "available," and deleted successfully.

If unexpected: If volume creation fails, check `docker logs cinder_volume 2>&1 | tail -20`. LVM errors indicate backend issues.

### VERIFICATION

1. Confirm database at target version: `docker exec cinder_volume cinder-manage db version`
2. Confirm all services up: `openstack volume service list` all show up/enabled
3. Confirm volume count matches: `openstack volume list --all-projects | wc -l` matches pre-upgrade
4. Confirm VG intact: `vgs cinder-volumes` shows expected size and free space
5. Confirm test volume lifecycle works: create, show, delete succeed

### ROLLBACK

Major upgrade rollback requires a full database restore:

1. Stop all Cinder containers: `docker stop $(docker ps --filter name=cinder -q)`
2. Restore the Cinder database from backup (OPS-CINDER-003 Step 7)
3. Restore LVM configuration if needed (OPS-CINDER-003 Step 8)
4. Redeploy with previous version: set the previous tag in globals.yml and run `kolla-ansible deploy --tags cinder`
5. Verify all services and volumes: run OPS-CINDER-001

### REFERENCES

- OPS-CINDER-001: Service Health Check (pre/post verification)
- OPS-CINDER-003: Backup and Restore (mandatory pre-upgrade)
- OPS-KEYSTONE-005: Keystone Major Upgrade (must be completed first)
- OPS-NOVA-005: Nova Major Upgrade (upgrade after or concurrent with Cinder)
- OpenStack Cinder Release Notes: https://docs.openstack.org/releasenotes/cinder/
- SP-6105 SS 5.4: System Maintenance and Upgrades
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-006: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-CINDER-006
TITLE: Troubleshooting Common Cinder Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Cinder failure modes: volume create fails (no valid backend), volume attach fails (iSCSI target issues), volume stuck in creating/deleting/error state, backend capacity exhausted, and snapshot failures. Execute when operators report storage issues.

### PRECONDITIONS

1. OpenStack cloud is deployed
2. Operator has admin credentials sourced
3. Access to the host for container log inspection and LVM commands
4. Basic health check completed (OPS-CINDER-001)

### SAFETY CONSIDERATIONS

- Troubleshooting commands are read-only unless explicitly noted
- Resetting volume state can lead to data inconsistency if the underlying LV does not match
- Force-deleting volumes removes the Cinder record but may leave orphaned LVs
- Always verify LVM state before and after any state reset

### PROCEDURE

**Failure Mode A: Volume Create Fails (No Valid Backend)**

Step 1: Check the error message.

```bash
openstack volume show <volume-id> -c status -c os-vol-host-attr:host
```

Expected result: Volume shows status "error" and host may be empty (no backend selected).

If unexpected: If the volume shows a different status, this failure mode does not apply.

Step 2: Verify the scheduler can find a backend.

```bash
openstack volume service list | grep volume
```

Expected result: At least one `cinder-volume` service is up.

If unexpected: If no volume service is up, start `cinder_volume` container: `docker restart cinder_volume`.

Step 3: Check backend capacity.

```bash
vgs cinder-volumes -o vg_name,vg_size,vg_free --noheadings
```

Expected result: VFree is greater than the requested volume size.

If unexpected: If no free space, either extend the volume group or delete unused volumes.

Step 4: Verify volume type backend mapping.

```bash
openstack volume type show <volume-type> -c properties
```

Expected result: `volume_backend_name` matches the backend name in cinder.conf.

If unexpected: If the mapping is incorrect, update: `openstack volume type set <type> --property volume_backend_name=lvm-1`.

**Failure Mode B: Volume Attach Fails (iSCSI Target Issues)**

Step 5: Check iSCSI session on the compute host.

```bash
iscsiadm -m session
```

Expected result: Active sessions listed for attached volumes.

If unexpected: If no sessions exist for a volume that should be attached, the initiator may not be able to reach the target.

Step 6: Verify iSCSI target on the volume host.

```bash
docker exec cinder_volume targetcli ls / 2>/dev/null || docker exec cinder_volume tgtadm --lld iscsi --op show --mode target 2>/dev/null
```

Expected result: Target exists for the volume being attached.

If unexpected: If the target does not exist, the volume export failed. Check `docker logs cinder_volume 2>&1 | grep <volume-id>`.

Step 7: Check Nova compute logs for attachment errors.

```bash
docker logs nova_compute 2>&1 | grep <volume-id> | tail -10
```

Expected result: Logs show the attachment flow.

If unexpected: Look for os-brick errors, multipath issues, or device busy errors.

**Failure Mode C: Volume Stuck in Creating/Deleting/Error State**

Step 8: Check if the underlying LV exists.

```bash
lvs cinder-volumes | grep <volume-uuid>
```

Expected result: For "stuck creating" -- LV may or may not exist. For "stuck deleting" -- LV should not exist.

If unexpected: Based on LV state:
- LV exists + stuck creating: reset to available: `openstack volume set --state available <volume>`
- LV missing + stuck creating: reset to error then delete: `openstack volume set --state error <volume> && openstack volume delete <volume>`
- LV exists + stuck deleting: manually remove LV then reset: `lvremove -f cinder-volumes/volume-<uuid> && openstack volume set --state error <volume> && openstack volume delete <volume>`
- LV missing + stuck deleting: reset and delete: `openstack volume set --state error <volume> && openstack volume delete <volume>`

Step 9: Reset volume state.

```bash
openstack volume set --state available <volume-id>
# Or for error cleanup:
openstack volume set --state error <volume-id>
openstack volume delete <volume-id>
```

Expected result: Volume state updated successfully.

If unexpected: If the reset fails, check Cinder API logs: `docker logs cinder_api 2>&1 | tail -20`.

**Failure Mode D: Backend Capacity Exhausted**

Step 10: Check volume group capacity.

```bash
vgs cinder-volumes -o vg_name,vg_size,vg_free,snap_count --noheadings
```

Expected result: Shows current VG size, free space, and snapshot count.

If unexpected: If VFree is 0 or nearly 0, the backend is full.

Step 11: Identify large or unused volumes.

```bash
openstack volume list --all-projects --long -f value -c Name -c Size -c Status | sort -t' ' -k2 -rn | head -10
```

Expected result: Lists the largest volumes.

If unexpected: If all volumes are needed, extend the volume group:
```bash
# Add a new disk
pvcreate /dev/sdd
vgextend cinder-volumes /dev/sdd
```

**Failure Mode E: Snapshot Failures**

Step 12: Check VG space for snapshots.

```bash
vgs cinder-volumes -o vg_name,vg_free,snap_count --noheadings
```

Expected result: Sufficient free space for snapshot COW allocation.

If unexpected: LVM snapshots require free space in the VG for copy-on-write. Free space or delete old snapshots.

Step 13: Check snapshot status.

```bash
lvs cinder-volumes -o lv_name,lv_attr,snap_percent 2>/dev/null
```

Expected result: Snapshot LVs show valid attributes and snap_percent below 100%.

If unexpected: If snap_percent is 100%, the snapshot overflowed and is invalid. Delete the snapshot and recreate.

Step 14: Check for volume lock issues.

```bash
openstack volume show <volume-id> -c status -c migration_status
```

Expected result: Volume is not in a locked or migration state.

If unexpected: If the volume is locked, wait for the operation to complete or reset state.

### VERIFICATION

1. For each failure mode resolved, verify the corrective action succeeded
2. Run OPS-CINDER-001 to confirm overall service health
3. Test a volume lifecycle: `openstack volume create --size 1 test && openstack volume delete test`

### ROLLBACK

For state resets that cause issues:

1. If a volume was incorrectly set to "available" but the LV does not exist, set to "error": `openstack volume set --state error <volume>`
2. If LVs were manually removed, verify no data loss and clean up Cinder records
3. Document all manual interventions in the operations log

### REFERENCES

- OPS-CINDER-001: Service Health Check (initial diagnostics)
- OPS-CINDER-010: Snapshot Management (snapshot issues)
- OPS-NOVA-006: Nova Troubleshooting (compute-volume attachment issues)
- OpenStack Cinder Troubleshooting: https://docs.openstack.org/cinder/2024.2/admin/blockstorage-manage-volumes.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-007: Security Audit

```
PROCEDURE ID: OPS-CINDER-007
TITLE: Cinder Security Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Perform a monthly security audit of the Cinder block storage configuration. Review volume encryption settings, backup encryption verification, volume type access restrictions, and API policy settings. Execute monthly or after any security incident.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Security policy document specifying encryption and access requirements
4. Previous audit report available for comparison (if not the first audit)

### SAFETY CONSIDERATIONS

- This is a read-only audit procedure with no risk of data loss
- Do not modify encryption settings or volume types during the audit
- Volume encryption changes affect new volumes only, not existing ones

### PROCEDURE

Step 1: Review volume encryption settings.

```bash
openstack volume type list
for vt in $(openstack volume type list -f value -c Name); do
  echo "=== Volume Type: $vt ==="
  openstack volume type show "$vt" -c encryption
done
```

Expected result: Volume types intended for sensitive data have encryption enabled (LUKS provider).

If unexpected: If encryption is required but not configured, schedule creation of an encrypted volume type.

Step 2: Verify backup encryption.

```bash
docker exec cinder_backup grep -E 'backup_ceph_conf|backup_driver|backup_swift' /etc/cinder/cinder.conf
```

Expected result: Backup driver is configured. If backing up sensitive volumes, transport should use TLS.

If unexpected: If backup storage does not use encryption, document the finding for remediation.

Step 3: Check volume type access restrictions.

```bash
for vt in $(openstack volume type list -f value -c Name); do
  echo "=== Volume Type: $vt ==="
  openstack volume type show "$vt" -c is_public
  openstack volume type show "$vt" -c access_project_ids 2>/dev/null
done
```

Expected result: Sensitive volume types are private (not public) with access restricted to authorized projects.

If unexpected: If a sensitive volume type is public, restrict access:
```bash
openstack volume type set --private <volume-type>
openstack volume type set --project <project-id> <volume-type>
```

Step 4: Review API policy settings.

```bash
docker exec cinder_api cat /etc/cinder/policy.json 2>/dev/null || docker exec cinder_api cat /etc/cinder/policy.yaml 2>/dev/null || echo "Using default policies"
```

Expected result: Custom policies are documented and match organizational security requirements.

If unexpected: Default policies are acceptable for most deployments. Custom policies should be reviewed for overly permissive rules.

Step 5: Verify volume transfer security.

```bash
openstack volume transfer request list --all-projects
```

Expected result: No pending transfer requests. Transfers should be completed promptly.

If unexpected: Stale transfer requests should be deleted: `openstack volume transfer request delete <transfer-id>`.

Step 6: Check for volumes with sensitive metadata.

```bash
for vol in $(openstack volume list --all-projects -f value -c ID); do
  meta=$(openstack volume show "$vol" -c metadata -f value)
  if [ "$meta" != "{}" ] && [ -n "$meta" ]; then
    echo "Volume $vol has metadata: $meta"
  fi
done
```

Expected result: No volumes store sensitive information (passwords, keys) in metadata.

If unexpected: Sensitive metadata should be removed and stored in a secrets manager instead.

### VERIFICATION

1. Audit report generated with all findings documented
2. Encrypted volume types exist for sensitive workloads
3. Private volume types properly restricted to authorized projects
4. No pending volume transfers exist
5. No sensitive data stored in volume metadata

### ROLLBACK

This is a read-only audit procedure. No rollback is required. Remediation of findings should follow a separate change control process.

### REFERENCES

- OPS-KEYSTONE-007: Keystone Security Audit (identity and access review)
- OpenStack Cinder Encryption: https://docs.openstack.org/cinder/2024.2/configuration/block-storage/volume-encryption.html
- OpenStack Security Guide -- Block Storage: https://docs.openstack.org/security-guide/block-storage.html
- SP-6105 SS 5.5: Product Transition -- Security Compliance
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-008: Volume Migration

```
PROCEDURE ID: OPS-CINDER-008
TITLE: Volume Migration
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Migrate volumes between backends or hosts. Includes offline migration for detached volumes, online migration for attached volumes (where supported), and data integrity verification after migration. Execute when rebalancing storage capacity, decommissioning backends, or upgrading storage infrastructure.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Destination backend has sufficient capacity for the volume
4. Both source and destination Cinder volume services are up
5. For offline migration: volume must be detached

### SAFETY CONSIDERATIONS

- Offline migration requires detaching the volume from any instance, causing storage downtime for the workload
- Online migration (attached volumes) is backend-dependent and may not be supported on LVM
- Migration copies data block-by-block -- large volumes take significant time
- If migration fails mid-way, the volume remains on the source (no data loss)
- Verify data integrity after migration before deleting the source

### PROCEDURE

**Offline Migration (Detached Volume):**

Step 1: Verify the volume is detached.

```bash
openstack volume show <volume-id> -c status -c attachments
```

Expected result: Status is "available" and attachments is empty.

If unexpected: Detach the volume first: `openstack server remove volume <instance> <volume>`. Wait for status to change to "available."

Step 2: Identify the destination host.

```bash
openstack volume service list | grep volume
```

Expected result: List of available volume backends.

If unexpected: If no destination backend is available, the migration cannot proceed.

Step 3: Initiate the migration.

```bash
cinder migrate <volume-id> <destination-host>
# Example: cinder migrate abc-123 node-1@lvm-2#lvm-2
```

Expected result: Migration initiated. Volume status changes to "migrating."

If unexpected: If the migration fails immediately, check Cinder scheduler logs: `docker logs cinder_scheduler 2>&1 | tail -20`.

Step 4: Monitor migration progress.

```bash
openstack volume show <volume-id> -c migration_status -c status
```

Expected result: `migration_status` shows "migrating" during the copy, then "success" when complete.

If unexpected: If migration_status shows "error," check `docker logs cinder_volume 2>&1 | grep <volume-id>`.

Step 5: Verify data integrity after migration.

```bash
openstack volume show <volume-id> -c size -c os-vol-host-attr:host
lvs cinder-volumes | grep <volume-uuid>
```

Expected result: Volume is on the destination host with the correct size. LV exists on the destination backend.

If unexpected: If the volume is not on the destination, the migration may have failed silently. Check migration_status.

**Online Migration (Attached Volume):**

Step 6: Check if online migration is supported.

```bash
# Online migration with LVM requires the volume to be re-typed
# or the backend to support live migration natively
openstack volume show <volume-id> -c status
```

Expected result: Volume status is "in-use" (attached).

If unexpected: If the backend does not support online migration, detach the volume first and use offline migration.

Step 7: Initiate online migration (if supported).

```bash
cinder migrate --force-host-copy <volume-id> <destination-host>
```

Expected result: Migration begins with the volume remaining attached.

If unexpected: If online migration is not supported, the command will fail. Use offline migration instead.

### VERIFICATION

1. Confirm migration complete: `openstack volume show <volume-id> -c migration_status` returns "success" or empty
2. Confirm volume on destination: `openstack volume show <volume-id> -c os-vol-host-attr:host` shows destination host
3. Confirm data accessible: attach the volume and verify data integrity from the instance
4. Confirm source cleaned up: `lvs cinder-volumes` on the source does not list the old LV

### ROLLBACK

1. If migration fails: the volume remains on the source backend, no action needed
2. If migration partially completed: `cinder reset-state --migration-status none <volume-id>` to clear the migration state
3. If data integrity is questionable after migration: restore from backup (OPS-CINDER-003)

### REFERENCES

- OPS-CINDER-001: Service Health Check (pre/post verification)
- OPS-CINDER-003: Backup and Restore (pre-migration backup recommended)
- OPS-NOVA-008: Nova Live Migration (related compute migration)
- OpenStack Cinder Volume Migration: https://docs.openstack.org/cinder/2024.2/admin/blockstorage-volume-migration.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-009: Backend Failover

```
PROCEDURE ID: OPS-CINDER-009
TITLE: Backend Failover
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Detect a backend failure, initiate failover to a secondary backend, verify volume accessibility, and perform failback when the primary backend recovers. Execute when a storage backend becomes unavailable or shows degraded performance. Note: Full failover requires a replicated backend configuration (not available in single-backend LVM deployments).

### PRECONDITIONS

1. OpenStack cloud is deployed with Cinder replication configured (multi-backend)
2. Operator has admin credentials sourced
3. Secondary backend is available and healthy
4. Replication status is "enabled" for volumes that support failover

### SAFETY CONSIDERATIONS

- Failover redirects all volume I/O to the secondary backend -- ensure the secondary has current replicas
- Failover is a disruptive operation: instances may experience brief I/O interruptions
- Failback (returning to primary) requires the primary to be fully recovered and resynced
- Single-backend LVM deployments cannot fail over -- recovery requires restoring from backup

### PROCEDURE

**Detect Backend Failure:**

Step 1: Identify the failed backend.

```bash
openstack volume service list
```

Expected result: One or more `cinder-volume` services show "down."

If unexpected: If all services are up, this procedure does not apply. Check instance-level I/O errors instead.

Step 2: Check the backend host status.

```bash
docker logs cinder_volume 2>&1 | grep -i -E 'error|fail|timeout' | tail -20
```

Expected result: Logs show backend communication errors, disk failures, or connection timeouts.

If unexpected: If logs show no errors, the issue may be transient. Wait 5 minutes and recheck.

Step 3: Verify LVM/disk health for LVM backend.

```bash
vgs cinder-volumes
pvs
dmesg | grep -i -E 'error|fail|i/o' | tail -10
```

Expected result: VG and PV status indicators. Kernel messages may reveal disk hardware errors.

If unexpected: If the VG is missing or PV shows errors, the disk has failed.

**Initiate Failover (Replicated Backend Only):**

Step 4: Initiate failover to the secondary backend.

```bash
cinder failover-host <host>@<backend>
```

Expected result: Failover initiated. Volumes are redirected to the secondary backend.

If unexpected: If failover fails, check that replication is configured and the secondary backend is accessible.

Step 5: Verify volumes are accessible on the secondary.

```bash
openstack volume list --all-projects --status in-use
openstack volume service list
```

Expected result: In-use volumes remain accessible. Volume service shows the failover backend as active.

If unexpected: If volumes are not accessible, check iSCSI sessions and replication state.

**Failback (When Primary Recovers):**

Step 6: Verify primary backend is recovered.

```bash
vgs cinder-volumes
openstack volume service list
```

Expected result: Primary backend VG is accessible and service is up.

If unexpected: If the primary is not fully recovered, do not attempt failback.

Step 7: Initiate failback.

```bash
cinder failover-host --backend-id default <host>@<backend>
```

Expected result: Volumes redirected back to the primary backend.

If unexpected: If failback fails, volumes remain on the secondary (safe). Investigate primary backend issues.

**Single-Backend Recovery (No Failover Available):**

Step 8: For single-backend LVM (no replication), recover from backup.

```bash
# If the disk failed:
# 1. Replace the disk
# 2. Recreate the VG: pvcreate /dev/<new-disk> && vgcreate cinder-volumes /dev/<new-disk>
# 3. Redeploy Cinder: kolla-ansible deploy --tags cinder
# 4. Restore from backup: OPS-CINDER-003 restore procedure
```

Expected result: Cinder operational on the new disk with volumes restored from backup.

If unexpected: If backup is not available, data is lost. This underscores the importance of regular backups (OPS-CINDER-003).

### VERIFICATION

1. Confirm failover/failback complete: `openstack volume service list` shows expected backend active
2. Confirm volumes accessible: `openstack volume list --status in-use` matches pre-failure state
3. Confirm I/O functional: attach a volume to an instance and verify read/write
4. Confirm replication resynced (if applicable): check replication status in Cinder logs

### ROLLBACK

1. If failover causes issues: attempt failback with `cinder failover-host --backend-id default <host>@<backend>`
2. If failback fails: volumes remain on whichever backend is accessible -- manual intervention required
3. For single-backend: restore from backup is the only recovery path

### REFERENCES

- OPS-CINDER-001: Service Health Check (detection and post-recovery verification)
- OPS-CINDER-003: Backup and Restore (recovery for single-backend)
- OPS-CINDER-008: Volume Migration (alternative to failover)
- OpenStack Cinder Replication: https://docs.openstack.org/cinder/2024.2/admin/blockstorage-volume-backups.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment -- Fault Recovery
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-CINDER-010: Snapshot Management

```
PROCEDURE ID: OPS-CINDER-010
TITLE: Snapshot Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create, list, and delete volume snapshots. Create volumes from snapshots for data recovery. Manage snapshot chains and purge orphaned snapshots. Execute for point-in-time data protection, testing from production data, and storage housekeeping.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Volume group has sufficient free space for snapshot COW allocation
4. Cinder services are up (confirm with OPS-CINDER-001)

### SAFETY CONSIDERATIONS

- LVM snapshots consume space from the volume group for copy-on-write tracking
- If a snapshot fills its COW allocation (heavy writes to the source volume), the snapshot becomes invalid
- Deleting a snapshot is irreversible -- verify before deleting
- Creating a snapshot of an in-use (attached) volume may produce inconsistent data unless the application supports it (use `--force` flag)

### PROCEDURE

**Create Snapshots:**

Step 1: Verify volume group has free space for snapshots.

```bash
vgs cinder-volumes -o vg_name,vg_free --noheadings
```

Expected result: Sufficient free space (at least 10% of VG size recommended for snapshot COW).

If unexpected: Free space before creating snapshots. Delete unused volumes or extend the VG.

Step 2: Create a snapshot of a detached volume.

```bash
openstack volume snapshot create --volume <volume-name> <snapshot-name>
```

Expected result: Snapshot created with status "available."

If unexpected: If creation fails, check VG free space and Cinder volume logs: `docker logs cinder_volume 2>&1 | tail -20`.

Step 3: Create a snapshot of an in-use (attached) volume.

```bash
openstack volume snapshot create --volume <volume-name> --force <snapshot-name>
```

Expected result: Snapshot created with status "available." Data consistency depends on the application (database-level quiesce recommended).

If unexpected: If the `--force` flag is rejected, the policy may prohibit in-use snapshots. Check with the admin.

**List and Inspect Snapshots:**

Step 4: List all snapshots.

```bash
openstack volume snapshot list --all-projects
```

Expected result: All snapshots listed with status, size, and parent volume.

If unexpected: If the list is empty but snapshots should exist, check the project context.

Step 5: Inspect snapshot details.

```bash
openstack volume snapshot show <snapshot-name>
```

Expected result: Shows snapshot metadata including status, size, and creation time.

If unexpected: If the snapshot shows "error" status, the COW allocation may have overflowed. Check with `lvs`.

Step 6: Verify LVM snapshot health.

```bash
lvs cinder-volumes -o lv_name,lv_attr,snap_percent
```

Expected result: Snapshot LVs show `snap_percent` below 80%. Values approaching 100% indicate the snapshot is at risk of overflow.

If unexpected: If snap_percent is above 80%, consider deleting the snapshot and recreating it (the COW is filling up from source volume writes).

**Create Volume from Snapshot:**

Step 7: Create a new volume from a snapshot.

```bash
openstack volume create --snapshot <snapshot-name> --size <size> <new-volume-name>
```

Expected result: New volume created from the snapshot data with status "available."

If unexpected: If creation fails, check that the snapshot status is "available" and that there is enough VG space.

**Delete Snapshots:**

Step 8: Delete a snapshot.

```bash
openstack volume snapshot delete <snapshot-name>
```

Expected result: Snapshot deleted. LVM COW space freed.

If unexpected: If deletion fails with "in use," the snapshot may be the source of a volume being created. Wait for the operation to complete.

**Manage Snapshot Chains:**

Step 9: Identify snapshot chains (snapshots of snapshots).

```bash
for snap in $(openstack volume snapshot list --all-projects -f value -c ID); do
  vol_id=$(openstack volume snapshot show "$snap" -f value -c volume_id)
  echo "Snapshot: $snap -> Volume: $vol_id"
done
```

Expected result: Mapping of snapshots to their source volumes, showing chain relationships.

If unexpected: Orphaned snapshots (pointing to deleted volumes) should be cleaned up.

**Purge Orphaned Snapshots:**

Step 10: Identify orphaned snapshots.

```bash
for snap in $(openstack volume snapshot list --all-projects -f value -c ID); do
  vol_id=$(openstack volume snapshot show "$snap" -f value -c volume_id)
  openstack volume show "$vol_id" > /dev/null 2>&1 || echo "ORPHANED: Snapshot $snap (volume $vol_id deleted)"
done
```

Expected result: Any snapshots whose source volume no longer exists are flagged.

If unexpected: Orphaned snapshots consume VG space. Delete after confirming they are no longer needed.

Step 11: Delete orphaned snapshots.

```bash
openstack volume snapshot delete <orphaned-snapshot-id>
```

Expected result: Orphaned snapshot deleted, VG space reclaimed.

If unexpected: If deletion fails, reset state first: `openstack volume snapshot set --state error <snapshot-id>` then retry deletion.

### VERIFICATION

1. Confirm snapshot created: `openstack volume snapshot show <name> -c status` returns "available"
2. Confirm LVM snapshot healthy: `lvs cinder-volumes -o lv_name,snap_percent` shows snap_percent below 80%
3. Confirm volume from snapshot: `openstack volume show <new-volume> -c status` returns "available"
4. Confirm deletion: `openstack volume snapshot show <name>` returns "No Volume Snapshot found"
5. Confirm VG space reclaimed: `vgs cinder-volumes -o vg_free` shows increased free space after deletion

### ROLLBACK

1. If a snapshot was accidentally deleted: it cannot be recovered -- restore the volume from backup (OPS-CINDER-003) if the data is needed
2. If a volume created from snapshot has issues: delete the volume and recreate from a different snapshot or backup
3. If orphaned snapshot cleanup was premature: the data is in the snapshot, not recoverable after deletion

### REFERENCES

- OPS-CINDER-001: Service Health Check (prerequisite)
- OPS-CINDER-003: Backup and Restore (alternative data protection)
- OPS-CINDER-006: Troubleshooting Common Failures (snapshot failure diagnostics)
- OpenStack Cinder Snapshots: https://docs.openstack.org/cinder/2024.2/admin/blockstorage-manage-volumes.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition
