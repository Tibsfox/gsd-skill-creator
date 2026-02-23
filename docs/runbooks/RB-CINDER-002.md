RUNBOOK: RB-CINDER-002 -- Volume Attachment Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to both the compute host (Nova) and the volume host (Cinder)
3. The volume UUID and instance UUID are known
4. The volume status is `available` or `in-use` (not `error`)

## PROCEDURE

Step 1: Check volume attachment state

```bash
openstack volume show <volume-id> -c status -c attachments
openstack server show <instance-id> -c volumes_attached
```

Expected: If attached, volume `status` is `in-use` and `attachments` shows the instance. If not attached, `status` is `available`.
If not: Volume stuck in `attaching` or `detaching` -- proceed to Step 5 for force-detach.

Step 2: Verify iSCSI session on the compute host

```bash
# Check active iSCSI sessions
iscsiadm -m session

# Check for the specific target
iscsiadm -m session | grep <volume-id-prefix>
```

Expected: An iSCSI session exists to the cinder-volume host target for this volume.
If not: No session -- check iSCSI initiator service: `systemctl status iscsid`. Verify the iSCSI target exists on the volume host: `targetcli ls /iscsi/`.

Step 3: Check Nova compute logs for os-brick connector errors

```bash
docker logs nova_compute 2>&1 | grep <volume-id> | tail -20
docker logs nova_compute 2>&1 | grep -i "os-brick\|connect_volume\|attach" | tail -20
```

Expected: Logs show successful volume connection via os-brick.
If not: Connector errors indicate iSCSI path issues, multipath misconfiguration, or device busy conditions.

Step 4: Check multipath configuration (if configured)

```bash
# Check multipath status
multipath -ll

# Look for the volume device
multipath -ll | grep <volume-id-prefix>
```

Expected: If multipath is configured, the volume appears as a multipath device with active paths.
If not: Multipath misconfigured -- check `/etc/multipath.conf`. For single-node deployments, multipath is typically not needed.

Step 5: Force-detach a stuck volume

```bash
# Reset volume state to available
openstack volume set --state available <volume-id>

# Force reset attachment status
cinder reset-state --state available --attach-status detached <volume-id>

# Clean up Nova side
openstack server remove volume <instance-id> <volume-id> 2>/dev/null
```

Expected: Volume transitions to `available` state and can be reattached.
If not: Check for stale device mappings: `lsblk` and `dmsetup ls` on the compute host. Remove stale mappings with `dmsetup remove <device>`.

Step 6: Check for stale device busy conditions

```bash
# On the compute host, check for stale block devices
lsblk | grep <volume-id-prefix>
dmsetup ls | grep <volume-id-prefix>

# If stale devices found, remove them
dmsetup remove <stale-device-name> 2>/dev/null
```

Expected: No stale device mappings for the volume.
If not: Remove stale mappings, then retry the detach and reattach.

Step 7: Reattach the volume

```bash
openstack server add volume <instance-id> <volume-id>

# Verify attachment
openstack volume show <volume-id> -c status -c attachments
```

Expected: Volume transitions to `in-use` and appears in instance attachments.
If not: Check Nova compute and Cinder volume logs for the latest error. Ensure the iSCSI network is reachable between compute and volume hosts.

## VERIFICATION

1. Volume shows `in-use` status: `openstack volume show <volume-id> -c status` returns `in-use`.
2. Instance sees the block device: from instance console, `lsblk` shows the attached volume (typically `/dev/vdb` or `/dev/sdb`).
3. iSCSI session is active: `iscsiadm -m session` lists the connection.

## ROLLBACK

1. Force-detach if the attachment made things worse: `openstack volume set --state available <volume-id>` followed by `cinder reset-state --state available --attach-status detached <volume-id>`.
2. If the instance was rebooted during troubleshooting, verify all other volume attachments are intact.
3. If iSCSI sessions were manually cleaned up, restart the nova_compute container to re-establish any needed sessions.

## RELATED RUNBOOKS

- RB-CINDER-001: Volume Creation Failure Diagnosis -- when the volume cannot be created in the first place
- RB-CINDER-003: LVM Backend Recovery -- when attachment fails due to LVM issues
- RB-NOVA-001: Instance Launch Failure Diagnosis -- when boot-from-volume fails
