RUNBOOK: RB-CINDER-001 -- Volume Creation Failure Diagnosis
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the node hosting the cinder-volume service
3. The failed volume UUID or creation error message is available
4. Cinder containers are running (`docker ps | grep cinder`)

## PROCEDURE

Step 1: Check Cinder service status

```bash
openstack volume service list
```

Expected: All services (`cinder-scheduler`, `cinder-volume`, `cinder-backup`) show `Status: enabled` and `State: up`.
If not: Service is down -- check container status: `docker ps | grep cinder`. Restart failed containers: `docker restart cinder_volume`.

Step 2: Check cinder-volume container logs for errors

```bash
docker logs cinder_volume 2>&1 | tail -50
docker logs cinder_volume 2>&1 | grep -i "error\|fail" | tail -20
```

Expected: No recent errors. If a volume creation was attempted, logs show the creation workflow completing successfully.
If not: Note the specific error message -- common errors include LVM space exhaustion, iSCSI target failures, and driver errors.

Step 3: Check LVM volume group capacity

```bash
vgs cinder-volumes
```

Expected: `VFree` shows available space greater than the requested volume size.
If not: Volume group is full -- extend it by adding a new physical volume: `pvcreate /dev/<new-disk> && vgextend cinder-volumes /dev/<new-disk>`.

Step 4: Check Cinder scheduler logs for placement failures

```bash
docker logs cinder_scheduler 2>&1 | tail -30
docker logs cinder_scheduler 2>&1 | grep -i "no valid backend" | tail -10
```

Expected: No scheduling errors. Scheduler successfully selects a backend for volume creation.
If not: "No valid backend" errors indicate all backends are full, disabled, or do not match the requested volume type. Check volume type extra specs match backend capabilities.

Step 5: Check for stuck volumes and clean them up

```bash
# List volumes in error or creating state
openstack volume list --status creating
openstack volume list --status error

# Check if LVM logical volume exists for stuck volume
lvs cinder-volumes | grep <volume-uuid-prefix>
```

Expected: No volumes stuck in `creating` state. Error volumes have corresponding LVs that can be cleaned up.
If not: Reset stuck volumes: `openstack volume set --state error <volume-id>` then delete, or `openstack volume set --state available <volume-id>` if the LV exists and is valid.

Step 6: Verify iSCSI target service (if applicable)

```bash
# Check if target service is running
systemctl status iscsid 2>/dev/null || docker exec cinder_volume targetcli ls 2>/dev/null

# List active targets
targetcli ls /iscsi/ 2>/dev/null
```

Expected: iSCSI target service is running and targets are listed for active volumes.
If not: Target service down -- restart: `systemctl restart iscsid` or restart the cinder_volume container.

Step 7: Retry volume creation

```bash
openstack volume create --size <size-gb> test-volume
openstack volume show test-volume -c status
```

Expected: Volume transitions from `creating` to `available` within 30 seconds.
If not: Repeat diagnosis from Step 2 with fresh logs.

## VERIFICATION

1. Volume creation succeeds: `openstack volume create --size 1 verify-volume` completes with status `available`.
2. All Cinder services are up: `openstack volume service list` shows all services enabled and up.
3. LVM has capacity: `vgs cinder-volumes` shows VFree > 0.

## ROLLBACK

1. Clean up stuck volumes: `openstack volume set --state error <volume-id>` then `openstack volume delete <volume-id>`.
2. If an LV was manually created for debugging, remove it: `lvremove cinder-volumes/<lv-name>`.
3. If the volume group was extended, the extension is safe to leave in place -- additional capacity does not cause issues.

## RELATED RUNBOOKS

- RB-CINDER-002: Volume Attachment Troubleshooting -- when volumes create successfully but fail to attach
- RB-CINDER-003: LVM Backend Recovery -- when the LVM thin pool or VG is corrupted
- RB-NOVA-001: Instance Launch Failure Diagnosis -- when volume creation failure prevents instance boot
