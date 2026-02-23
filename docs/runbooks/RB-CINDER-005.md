RUNBOOK: RB-CINDER-005 -- Volume Migration Between Backends
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to both source and destination volume hosts
3. The volume to migrate is in `available` state (not attached to any instance)
4. The volume has no snapshots (snapshots prevent migration on most backends)
5. The destination backend is configured and operational

## PROCEDURE

Step 1: Pre-migration checks

```bash
# Verify volume is available and detached
openstack volume show <volume-id> -c status -c attachments -c migration_status

# Check for snapshots that would block migration
openstack volume snapshot list --volume <volume-id>

# Verify source backend
openstack volume show <volume-id> -c os-vol-host-attr:host
```

Expected: Volume `status` is `available`, `attachments` is empty, `migration_status` is `None`, and no snapshots exist.
If not: Detach the volume first: `openstack server remove volume <instance> <volume>`. Delete snapshots if migration is more important than snapshot retention.

Step 2: Verify destination backend availability

```bash
# List available volume services
openstack volume service list

# Check destination backend capacity
openstack volume backend pool list
```

Expected: Destination backend service is `up` and `enabled` with sufficient free capacity for the volume.
If not: Enable the service: `openstack volume service set --enable <host> cinder-volume`. Check capacity with `vgs` on the destination host.

Step 3: Initiate the volume migration

```bash
# Migrate to a specific backend host
cinder migrate <volume-id> <destination-host>@<backend-name>#<pool>

# Example for LVM backend:
# cinder migrate <volume-id> controller@lvm-1#cinder-volumes
```

Expected: Migration starts. Volume `migration_status` changes to `migrating`.
If not: Check cinder-scheduler logs: `docker logs cinder_scheduler 2>&1 | tail -20`. Common failures: destination backend not found, insufficient capacity, or volume type mismatch.

Step 4: Monitor migration progress

```bash
# Poll migration status
openstack volume show <volume-id> -c migration_status -c status

# Check cinder-volume logs for progress
docker logs cinder_volume 2>&1 | grep <volume-id> | tail -10
```

Expected: `migration_status` progresses through `migrating` then `success`. `status` returns to `available`.
If not: `migration_status: error` -- check logs for the failure reason. Common causes: network timeout between hosts, LVM creation failure on destination, or data copy interrupted.

Step 5: Verify data integrity after migration

```bash
# Check volume is on the new backend
openstack volume show <volume-id> -c os-vol-host-attr:host

# Verify volume size matches
openstack volume show <volume-id> -c size

# Attach and verify data (if possible)
openstack server add volume <test-instance> <volume-id>
# From inside the instance: mount and check filesystem integrity
# fsck /dev/vdb (for ext4)
# xfs_repair -n /dev/vdb (for XFS, read-only check)
```

Expected: Volume host attribute shows the destination backend. Size matches. Data is intact.
If not: If data integrity fails, the migration may have been incomplete. Restore from the original location (see Rollback).

Step 6: Clean up source volume remnants

```bash
# After successful migration, the source LV should be removed automatically
# Verify no orphaned LVs remain on the source
lvs cinder-volumes | grep <volume-uuid-prefix>
```

Expected: No orphaned LVs on the source backend for this volume.
If not: Manually clean up: `lvremove cinder-volumes/volume-<uuid>` on the source host.

## VERIFICATION

1. Volume is on the destination backend: `openstack volume show <volume-id> -c os-vol-host-attr:host` shows the destination host.
2. Volume is usable: attach to an instance and verify data accessibility.
3. Migration status is clean: `openstack volume show <volume-id> -c migration_status` shows `None` or `success`.
4. No orphaned resources on source backend.

## ROLLBACK

1. If migration fails mid-transfer, the volume remains on the source backend. Reset migration status: `cinder reset-state --reset-migration-status <volume-id>`.
2. If migration completed but data is corrupt on the destination, restore from backup: `openstack volume backup restore <backup-id> <new-volume-id>`.
3. If both source and destination volumes exist (migration created a copy), delete the destination copy and reset the original volume state.

## RELATED RUNBOOKS

- RB-CINDER-001: Volume Creation Failure Diagnosis -- when volume creation on the destination backend fails
- RB-CINDER-003: LVM Backend Recovery -- when migration fails due to LVM issues on source or destination
- RB-CINDER-004: Snapshot Management Troubleshooting -- when snapshots must be handled before migration
