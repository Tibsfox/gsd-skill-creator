RUNBOOK: RB-CINDER-003 -- LVM Backend Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. Root SSH access to the node hosting the cinder-volume service
3. The LVM volume group name is known (typically `cinder-volumes`)
4. No active I/O to volumes during recovery steps (volumes should be detached if possible)

## PROCEDURE

Step 1: Check LVM volume group status

```bash
vgs cinder-volumes
```

Expected: Volume group is listed with `VSize` and `VFree` showing reasonable values. No error indicators.
If not: VG not found -- proceed to Step 5 for VG recovery.

Step 2: Check logical volumes and their status

```bash
lvs cinder-volumes
lvs -a cinder-volumes
```

Expected: Logical volumes are listed with `LV Status: available` (shown as `a` attribute). `-a` flag also shows internal/snapshot LVs.
If not: LVs showing `NOT available` or missing -- check physical volume status in Step 3.

Step 3: Check physical volume status

```bash
pvs
pvdisplay /dev/<disk>
```

Expected: Physical volume is listed with the correct VG name, `PV Status: allocatable`, and no errors.
If not: PV missing or damaged -- the underlying disk may have failed. Check `dmesg | grep -i error` and `smartctl -a /dev/<disk>`.

Step 4: Check thin pool status (if using thin provisioning)

```bash
# List thin pool details
lvs -a cinder-volumes | grep "pool\|tmeta\|tdata"

# Check thin pool usage percentage
lvs -o lv_name,data_percent,metadata_percent cinder-volumes
```

Expected: Data usage below 90% and metadata usage below 90%.
If not: Thin pool nearly full -- extend it:

```bash
# Extend thin pool data space
lvextend -L +10G cinder-volumes/cinder-volumes-pool

# Extend thin pool metadata (if metadata is near full)
lvextend --poolmetadatasize +1G cinder-volumes/cinder-volumes-pool
```

Step 5: Recover a missing volume group

```bash
# Scan for existing PVs
pvscan

# If PV exists but VG is missing, try to restore
vgcfgrestore cinder-volumes

# If the disk is a loop device, check if it is still attached
losetup -l | grep cinder
```

Expected: VG is restored from backup metadata. If using a loop device, it is reattached.
If not: Loop device detached -- reattach: `losetup /dev/loop0 /var/lib/cinder/cinder-volumes.img` then `vgscan`.

Step 6: Verify Cinder volume to LV mapping

```bash
# List Cinder volumes
openstack volume list --all-projects

# Cross-reference with LVM
lvs cinder-volumes --noheadings -o lv_name

# Each Cinder volume UUID should have a corresponding LV named volume-<uuid>
```

Expected: Every `available` or `in-use` Cinder volume has a corresponding LV.
If not: Orphaned LVs (no matching Cinder volume) can be cleaned up. Missing LVs for active Cinder volumes indicate data loss -- set volume to error state: `openstack volume set --state error <volume-id>`.

Step 7: Restart Cinder volume service after recovery

```bash
docker restart cinder_volume

# Wait for service registration
sleep 10

# Verify service is up
openstack volume service list
```

Expected: `cinder-volume` service shows `State: up` and `Status: enabled`.
If not: Check container logs: `docker logs cinder_volume 2>&1 | tail -30`.

## VERIFICATION

1. Volume group is intact: `vgs cinder-volumes` shows correct size and free space.
2. All active LVs are accessible: `lvs cinder-volumes` shows all LVs as available.
3. Cinder volume service is up: `openstack volume service list` shows cinder-volume as up and enabled.
4. Volume creation works: `openstack volume create --size 1 recovery-test` succeeds.

## ROLLBACK

1. If VG metadata was restored from backup and is incorrect, restore from an older backup: `vgcfgrestore -l cinder-volumes` lists available backups, then `vgcfgrestore -f <backup-file> cinder-volumes`.
2. If a thin pool was extended but is still problematic, consider recreating the pool (WARNING: destroys all thin volumes).
3. If the underlying disk has failed, replace the disk, recreate the PV and VG, and restore volumes from Cinder backups.

## RELATED RUNBOOKS

- RB-CINDER-001: Volume Creation Failure Diagnosis -- when creation fails due to backend issues
- RB-CINDER-002: Volume Attachment Troubleshooting -- when attachment fails after LVM recovery
- RB-CINDER-004: Snapshot Management Troubleshooting -- when snapshots fail due to thin pool issues
