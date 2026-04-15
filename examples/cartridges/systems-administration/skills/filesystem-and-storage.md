---
name: filesystem-and-storage
description: Manage mounts, fstab, LVM, ZFS/btrfs snapshots, quotas, and disk health (smartctl).
---

# filesystem-and-storage

Own block, filesystem, and mount management. Grow volumes safely,
schedule snapshots, monitor disk health, and resolve "disk full"
pages without losing data.

## Core operations

- `df -h`, `du -sh /* | sort -h`, `lsblk`, `mount`, `findmnt`
- LVM: `pvs/vgs/lvs`, `lvextend -r`, `vgextend`
- ZFS: `zpool status`, `zfs snapshot`, `zfs send | zfs recv`
- btrfs: `btrfs subvolume snapshot`, `btrfs balance`, `btrfs scrub`
- Disk health: `smartctl -a`, `smartctl -t long`

## Safety rules

- Never edit `/etc/fstab` without first running `mount -a` in a second shell
- Never remove the last snapshot before the replacement has verified
- Always back up the partition table (`sfdisk -d > /root/ptable-$(date -I).sfd`) before repartitioning
