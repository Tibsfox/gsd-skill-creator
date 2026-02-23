RUNBOOK: RB-NOVA-004 -- Live Migration Procedure
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source and target compute nodes operational with nova-compute running
  3. Shared storage (NFS/Ceph) configured, OR block migration will be used
  4. Matching libvirt versions and CPU models across source and target hosts
  5. Network connectivity between source and target on migration network

PROCEDURE -- PRE-MIGRATION CHECKS
  Step 1: Verify source and target compute nodes are operational
    $ source /etc/kolla/admin-openrc.sh
    $ openstack compute service list -f table
    Expected: Both source and target nodes show State=up, Status=enabled
    If not: Recover the affected node (see RB-NOVA-003) before migration

  Step 2: Check shared storage availability
    $ ssh <source-host> "df -h /var/lib/nova/instances"
    $ ssh <target-host> "df -h /var/lib/nova/instances"
    Expected: Both mount the same shared filesystem (NFS/Ceph)
    If not: Shared storage not configured. Use block migration (--block-migration)

  Step 3: Verify CPU compatibility between hosts
    $ ssh <source-host> "cat /proc/cpuinfo | grep 'model name' | head -1"
    $ ssh <target-host> "cat /proc/cpuinfo | grep 'model name' | head -1"
    Expected: Same CPU vendor (Intel/AMD). Ideally same generation
    $ docker exec nova_compute grep cpu_mode /etc/nova/nova.conf
    Expected: cpu_mode = host-model (normalizes CPU features across hosts)
    If not: Set cpu_mode = host-model and reconfigure to prevent feature mismatch

  Step 4: Verify libvirt TCP/TLS connectivity
    $ docker exec nova_libvirt virsh -c qemu+tcp://<target-host>/system list
    Expected: Returns instance list from target (may be empty)
    If not: Libvirt connectivity failure. Check:
            - Port 16509 (TCP) or 16514 (TLS) is open between hosts
            - libvirt listen_tls or listen_tcp is enabled
            - Firewall rules allow migration traffic

  Step 5: Check target host has sufficient resources
    $ openstack resource provider usage show <target-rp-uuid> -f table
    $ openstack resource provider inventory list <target-rp-uuid> -f table
    Expected: Free capacity (total * ratio - used) >= instance requirements
    If not: Target cannot accommodate the instance. Choose a different target
            or see RB-NOVA-005 for resource management

PROCEDURE -- EXECUTE MIGRATION
  Step 6: Initiate live migration
    To a specific host:
    $ openstack server migrate --live <target-host> <instance-id>
    To auto-select target:
    $ openstack server migrate --live-migration <instance-id>
    For block migration (no shared storage):
    $ openstack server migrate --live <target-host> --block-migration <instance-id>
    Expected: Command returns immediately. Migration runs asynchronously

  Step 7: Monitor migration progress
    $ openstack server migration list --server <instance-id> -f table
    Expected: Migration entry shows status "running" with progress percentage
    $ watch -n 5 "openstack server show <instance-id> -c status \
        -c OS-EXT-STS:task_state -c OS-EXT-SRV-ATTR:host -f table"
    Expected: task_state shows "migrating", then clears when complete
              host changes from source to target
    If not: Migration may be stuck. Check Step 8

  Step 8: Troubleshoot stalled migration
    $ docker logs nova_compute 2>&1 | grep -i "migration\|migrate" | tail -30
    Expected: Progress messages or completion
    If stalled for over 10 minutes:
    Common causes:
      - High memory dirty rate: instance writing too fast for migration to converge
      - Network bandwidth: migration network saturated
      - Disk I/O: block migration copying large disk
    Options:
      - Wait (migration may still converge)
      - Abort: $ nova live-migration-abort <instance-id> <migration-id>

PROCEDURE -- POST-MIGRATION
  Step 9: Verify migration completed
    $ openstack server show <instance-id> -c status -c OS-EXT-SRV-ATTR:host -f table
    Expected: status=ACTIVE, host=<target-host>
    If not: Instance may have reverted to source host. Check logs:
            $ docker logs nova_compute 2>&1 | grep -i "migration" | tail -20

  Step 10: Verify instance connectivity
    $ openstack server show <instance-id> -c addresses -f value
    Ping the instance IP or verify via console:
    $ openstack console url show <instance-id>
    Expected: Instance is reachable and functional on the target host
    If not: Network configuration may not have migrated. Check:
            $ docker exec nova_libvirt virsh domiflist <instance-name>

VERIFICATION
  1. Instance is on target host:
     $ openstack server show <instance-id> -c OS-EXT-SRV-ATTR:host -f value
     Expected: <target-host>
  2. Instance is running:
     $ openstack server show <instance-id> -c status -f value
     Expected: ACTIVE
  3. No migration remnants on source:
     $ ssh <source-host> "docker exec nova_libvirt virsh list --all" | grep <instance-name>
     Expected: Instance not listed on source host

ROLLBACK
  1. Abort in-progress migration:
     $ openstack server migration list --server <instance-id> -f table
     $ nova live-migration-abort <instance-id> <migration-id>
     Expected: Instance remains on source host in ACTIVE state
  2. If migration completed but instance is broken on target:
     $ openstack server migrate --live <source-host> <instance-id>
     (Migrate back to the original host)
  3. If instance is in ERROR after failed migration:
     $ openstack server reboot --hard <instance-id>
     If still ERROR: $ openstack server rebuild <instance-id> --image <original-image>

RELATED RUNBOOKS
  - RB-NOVA-003: Hypervisor Connectivity Recovery -- If target hypervisor has issues
  - RB-NOVA-006: Compute Service Recovery After Host Failure -- For evacuating instances when live migration is not possible
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If migration fails due to scheduling
  - RB-NOVA-005: Compute Resource Exhaustion Response -- If target has insufficient resources
