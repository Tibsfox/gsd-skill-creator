RUNBOOK: RB-GENERAL-002 -- Full Cloud Backup and Restore
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Kolla-Ansible managed host
2. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
3. Kolla-Ansible installed in virtual environment (`/opt/kolla-venv/`)
4. Sufficient backup storage available (recommend 2x database size + configuration size)
5. Backup destination directory exists and has write permissions

## PROCEDURE

Step 1: Create backup directory with timestamp
```bash
BACKUP_DIR="/backup/openstack-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory: $BACKUP_DIR"
```
Expected: Directory created successfully
If not: Check disk space and permissions on the backup destination

Step 2: Back up all databases (MariaDB)
```bash
# Full database dump (all databases, consistent snapshot)
docker exec mariadb mysqldump \
  --all-databases \
  --single-transaction \
  --routines \
  --triggers \
  > "$BACKUP_DIR/all-databases.sql"

# Verify the dump file is not empty
ls -lh "$BACKUP_DIR/all-databases.sql"
```
Expected: SQL dump file created with reasonable size (typically 10-500 MB depending on usage)
If not: If dump is empty or fails, check MariaDB container health: `docker logs mariadb --tail 20`

Step 3: Back up Kolla-Ansible configuration
```bash
# Full configuration backup
cp -r /etc/kolla/ "$BACKUP_DIR/kolla-config/"

# Verify critical files are present
ls "$BACKUP_DIR/kolla-config/globals.yml"
ls "$BACKUP_DIR/kolla-config/passwords.yml"
```
Expected: Complete /etc/kolla/ directory copied including globals.yml, passwords.yml, and all service configs
If not: Verify source files exist; check disk space on backup target

Step 4: Back up Kolla-Ansible passwords (separate copy for safety)
```bash
cp /etc/kolla/passwords.yml "$BACKUP_DIR/passwords.yml.backup"
# Set restrictive permissions
chmod 600 "$BACKUP_DIR/passwords.yml.backup"
```
Expected: passwords.yml backed up with restricted permissions (owner-read-only)
If not: This is the most critical backup artifact -- verify it exists before proceeding

Step 5: Back up service-specific data
```bash
# Swift rings (critical -- ring loss can mean data loss)
mkdir -p "$BACKUP_DIR/swift-rings/"
docker cp swift_proxy_server:/etc/swift/account.ring.gz "$BACKUP_DIR/swift-rings/" 2>/dev/null
docker cp swift_proxy_server:/etc/swift/container.ring.gz "$BACKUP_DIR/swift-rings/" 2>/dev/null
docker cp swift_proxy_server:/etc/swift/object.ring.gz "$BACKUP_DIR/swift-rings/" 2>/dev/null

# Keystone Fernet keys (required for token validation)
mkdir -p "$BACKUP_DIR/fernet-keys/"
docker cp keystone_fernet:/etc/keystone/fernet-keys/ "$BACKUP_DIR/fernet-keys/" 2>/dev/null

# Glance images metadata (images themselves are stored in backend)
openstack image list --long -f json > "$BACKUP_DIR/glance-images.json" 2>/dev/null
```
Expected: Service-specific data files captured
If not: Some services may not be enabled; warnings for missing containers are acceptable

Step 6: Back up OpenStack resource state (for reference)
```bash
# Record current state for comparison during restore
openstack service list -f json > "$BACKUP_DIR/state-services.json"
openstack endpoint list -f json > "$BACKUP_DIR/state-endpoints.json"
openstack hypervisor list -f json > "$BACKUP_DIR/state-hypervisors.json"
openstack network list -f json > "$BACKUP_DIR/state-networks.json"
openstack server list --all-projects -f json > "$BACKUP_DIR/state-servers.json"
openstack volume list --all-projects -f json > "$BACKUP_DIR/state-volumes.json"
```
Expected: JSON state files captured for all major resource types
If not: Service may be unavailable -- capture what is possible

Step 7: Verify backup integrity
```bash
# Check database dump is valid SQL
head -5 "$BACKUP_DIR/all-databases.sql"
tail -5 "$BACKUP_DIR/all-databases.sql"

# Check backup size summary
du -sh "$BACKUP_DIR"/*
echo "Total backup size:"
du -sh "$BACKUP_DIR"
```
Expected: SQL dump starts with MySQL comment headers and ends with `-- Dump completed`; all backup components present
If not: Re-run the database dump; check MariaDB health

## RESTORE PROCEDURE

Step R1: Stop all OpenStack services (if restoring to same host)
```bash
docker stop $(docker ps -q --filter label=kolla_role)
```

Step R2: Restore database
```bash
# Start only MariaDB
docker start mariadb
sleep 10

# Restore from backup
docker exec -i mariadb mysql < "$BACKUP_DIR/all-databases.sql"
```
Expected: Database restore completes without errors
If not: Check MariaDB container logs: `docker logs mariadb --tail 30`

Step R3: Restore configuration
```bash
# Restore Kolla configuration
cp -r "$BACKUP_DIR/kolla-config/"* /etc/kolla/

# Restore passwords
cp "$BACKUP_DIR/passwords.yml.backup" /etc/kolla/passwords.yml
```

Step R4: Restore service-specific data
```bash
# Restore Swift rings (if applicable)
docker cp "$BACKUP_DIR/swift-rings/account.ring.gz" swift_proxy_server:/etc/swift/ 2>/dev/null
docker cp "$BACKUP_DIR/swift-rings/container.ring.gz" swift_proxy_server:/etc/swift/ 2>/dev/null
docker cp "$BACKUP_DIR/swift-rings/object.ring.gz" swift_proxy_server:/etc/swift/ 2>/dev/null

# Restore Fernet keys
docker cp "$BACKUP_DIR/fernet-keys/fernet-keys/" keystone_fernet:/etc/keystone/ 2>/dev/null
```

Step R5: Redeploy services
```bash
source /opt/kolla-venv/bin/activate
kolla-ansible -i /etc/kolla/all-in-one deploy
```

Step R6: Verify restore
```bash
source /etc/kolla/admin-openrc.sh
openstack service list
openstack token issue
openstack server list --all-projects
```
Expected: All services operational; data matches pre-backup state
If not: Check service logs for errors; compare with backup state files

## VERIFICATION

1. Backup directory contains all expected files:
   - `all-databases.sql` (non-empty)
   - `kolla-config/` (includes globals.yml and passwords.yml)
   - `passwords.yml.backup`
   - State JSON files
2. Database dump file begins with SQL headers and ends with completion marker
3. Total backup size is reasonable for the deployment
4. (If restored) All services operational and data matches pre-backup state

## ROLLBACK

For backup operations: N/A -- backup is a read-only operation that does not modify the running system.

For restore operations:
1. If restore fails, re-run `kolla-ansible deploy` to regenerate service state
2. If database restore corrupts data, re-dump from the running system
3. Maintain multiple backup generations (at least 3 daily backups)

## RELATED RUNBOOKS

- RB-KOLLA-003: OpenStack Upgrade Procedure -- backup should be performed before every upgrade
- RB-KOLLA-002: Service Reconfiguration Procedure -- backup before major reconfigurations
- RB-GENERAL-004: MariaDB/MySQL Database Maintenance -- for database-specific issues during backup/restore
- RB-GENERAL-001: Full Cloud Daily Health Check -- verify cloud health before and after backup/restore
