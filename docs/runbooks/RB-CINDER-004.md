RUNBOOK: RB-CINDER-004 -- Snapshot Management Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the node hosting the cinder-volume service
3. The affected volume and/or snapshot UUID is known
4. The volume backend type is known (LVM, Ceph, NFS)

## PROCEDURE

Step 1: Check snapshot status

```bash
openstack volume snapshot list --all-projects
openstack volume snapshot show <snapshot-id>
```

Expected: Snapshot shows `status: available` or `status: creating` (if in progress).
If not: `status: error` -- check cinder-volume logs for the creation error. `status: deleting` stuck -- proceed to Step 5.

Step 2: Check volume group free space for snapshot allocation

```bash
vgs cinder-volumes
lvs -a cinder-volumes | grep -i snap
```

Expected: `VFree` has space available for the snapshot COW (copy-on-write) data. LVM snapshots consume space proportional to the rate of change on the source volume.
If not: Insufficient space -- extend the volume group or delete unused snapshots/volumes to free space.

Step 3: Check LVM snapshot health

```bash
# List all LVs including snapshots
lvs -a cinder-volumes -o lv_name,lv_attr,lv_size,snap_percent

# Check for invalid snapshots
lvs cinder-volumes -o lv_name,lv_attr | grep -i "I"
```

Expected: Snapshots show valid attributes (lowercase `s` for snapshot, `a` for active). `snap_percent` is below 100%.
If not: Snapshot shows `I` (invalid) -- the COW space overflowed. The snapshot is no longer consistent and must be deleted: `lvremove cinder-volumes/<snapshot-lv>`.

Step 4: Check volume in-use state for snapshot compatibility

```bash
openstack volume show <volume-id> -c status
```

Expected: Volume is `available` (detached) for the most consistent snapshots.
If not: Volume is `in-use` (attached) -- snapshots of in-use volumes may be inconsistent unless the guest filesystem is quiesced. Use `--force` flag: `openstack volume snapshot create --volume <volume-id> --force my-snapshot`.

Step 5: Clean up orphaned or stuck snapshots

```bash
# List snapshots in error or deleting state
openstack volume snapshot list --status error --all-projects
openstack volume snapshot list --status deleting --all-projects

# Reset snapshot state
openstack volume snapshot set --state error <snapshot-id>

# Delete the snapshot
openstack volume snapshot delete <snapshot-id>

# If delete fails, check for orphaned LVs
lvs -a cinder-volumes | grep _snap
```

Expected: Orphaned snapshots are cleaned up. No stale snapshot LVs remain.
If not: Manually remove orphaned LVs: `lvremove cinder-volumes/<orphaned-snapshot-lv>`. Then reset Cinder database state.

Step 6: Verify Cinder snapshot backend capabilities

```bash
# Check volume type capabilities
openstack volume type show <volume-type> -c properties

# Check cinder-volume log for snapshot support
docker logs cinder_volume 2>&1 | grep -i "snapshot\|capabilities"
```

Expected: Backend supports snapshot operations. LVM backend supports COW snapshots natively.
If not: Backend may not support snapshots or may have limitations (e.g., maximum number of snapshots per volume).

Step 7: Retry snapshot creation

```bash
openstack volume snapshot create --volume <volume-id> retry-snapshot
openstack volume snapshot show retry-snapshot -c status
```

Expected: Snapshot transitions to `available` within 60 seconds.
If not: Check cinder-volume logs for the latest error and address the underlying issue.

## VERIFICATION

1. Snapshot creation succeeds: `openstack volume snapshot create --volume <volume-id> verify-snap` returns `available`.
2. Snapshot can be used to create a volume: `openstack volume create --snapshot <snap-id> --size <size> from-snap` succeeds.
3. No orphaned snapshot LVs: `lvs -a cinder-volumes | grep snap` shows only LVs matching active Cinder snapshots.

## ROLLBACK

1. Delete failed snapshots: `openstack volume snapshot set --state error <snap-id>` then `openstack volume snapshot delete <snap-id>`.
2. If LVs were manually removed, restart cinder-volume to resync state: `docker restart cinder_volume`.
3. If a volume was force-snapshotted while in-use and data is inconsistent, delete the inconsistent snapshot and retry with the volume detached.

## RELATED RUNBOOKS

- RB-CINDER-001: Volume Creation Failure Diagnosis -- when volume creation from snapshot fails
- RB-CINDER-003: LVM Backend Recovery -- when snapshot failures are caused by LVM issues
- RB-CINDER-005: Volume Migration Between Backends -- when migrating volumes with snapshots
