RUNBOOK: RB-SWIFT-002 -- Replication Status Verification
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Swift storage node(s)
2. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
3. Swift ring builder files accessible (typically in `/etc/kolla/swift/` or inside Swift containers)
4. All Swift containers are running (`docker ps --filter name=swift`)

## PROCEDURE

Step 1: Check replication status across all Swift services
```bash
docker exec swift_object_server swift-recon --replication
```
Expected: Replication stats showing `oldest_completion`, `most_recent`, and `object_replication_time`. All values should be recent (within last hour).
If not: If replication data is stale or missing, proceed to Step 2 to check replicator service

Step 2: Verify the replicator service is running
```bash
docker ps --filter name=swift_object_replicator
docker logs swift_object_replicator --tail 30
```
Expected: Container is running; logs show regular replication cycles completing without errors
If not: If container is not running, restart it: `docker restart swift_object_replicator`. If errors in logs, proceed to Step 3.

Step 3: Inspect ring file consistency
```bash
# Check account ring
docker exec swift_proxy_server swift-ring-builder /etc/swift/account.builder
# Check container ring
docker exec swift_proxy_server swift-ring-builder /etc/swift/container.builder
# Check object ring
docker exec swift_proxy_server swift-ring-builder /etc/swift/object.builder
```
Expected: All three rings show devices with appropriate weight, partition count, and replica count. Ring balance should be close to 0.00.
If not: If ring shows no devices or high imbalance, see Step 5 for ring rebuild

Step 4: Verify handoff partitions
```bash
docker exec swift_object_server swift-recon --unmounted
docker exec swift_object_server swift-recon --diskusage
```
Expected: No unmounted devices; disk usage shows all devices available with reasonable utilization (<90%)
If not: If devices are unmounted, check filesystem health: `xfs_repair -n /dev/<device>`. If a device is full (>90%), Swift stops accepting writes for that device.

Step 5: Rebuild ring from backup (if ring is corrupted or lost)
```bash
# Locate backup ring files
ls /etc/kolla/swift/*.ring.gz
ls /etc/kolla/swift/*.builder

# If backup ring.gz files exist, restore them
cp /etc/kolla/swift/account.ring.gz /etc/swift/account.ring.gz
cp /etc/kolla/swift/container.ring.gz /etc/swift/container.ring.gz
cp /etc/kolla/swift/object.ring.gz /etc/swift/object.ring.gz

# If no backups exist, rebuild rings from scratch
# (Requires knowledge of partition power, replica count, and device layout)
# See skills/openstack/swift/SKILL.md for ring building procedure
```
Expected: Restored ring files enable Swift to locate all partitions
If not: Escalate -- ring rebuild from scratch requires careful planning to avoid data loss

Step 6: Verify replication convergence after ring restore
```bash
# Wait for a replication cycle (typically 30 seconds to a few minutes)
sleep 60
docker exec swift_object_server swift-recon --replication
```
Expected: Replication timestamps update to current time; no error counts increasing
If not: Check replicator logs for persistent errors: `docker logs swift_object_replicator 2>&1 | grep -i error`

## VERIFICATION

1. All three ring builder commands show valid ring configuration with devices at appropriate weight
2. `swift-recon --replication` shows recent completion timestamps (within last replication cycle)
3. `swift-recon --diskusage` shows all devices mounted and below 90% utilization
4. Object upload and download succeed: `swift upload test-container /tmp/test-file && swift download test-container test-file -o /dev/null`

## ROLLBACK

1. If ring files were modified, restore from the most recent backup:
   ```bash
   cp /backup/swift/*.ring.gz /etc/swift/
   cp /backup/swift/*.builder /etc/swift/
   ```
2. Restart all Swift services:
   ```bash
   docker restart $(docker ps -q --filter name=swift)
   ```
3. Verify all Swift services come up healthy and data is accessible

## RELATED RUNBOOKS

- RB-SWIFT-001: Container Access Troubleshooting -- when access issues are caused by ring problems
- RB-SWIFT-004: Object Expiration and Lifecycle Troubleshooting -- when replication affects expiration processing
- RB-GENERAL-001: Full Cloud Daily Health Check -- includes Swift replication as part of daily verification
