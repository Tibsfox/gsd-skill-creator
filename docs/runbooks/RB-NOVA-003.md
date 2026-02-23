RUNBOOK: RB-NOVA-003 -- Hypervisor Connectivity Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the compute node (SSH or console)
  2. Source file /etc/kolla/admin-openrc.sh available on controller
  3. Nova compute service was previously operational
  4. Awareness of which compute node is experiencing the issue

PROCEDURE
  Step 1: Check hypervisor status from the controller
    $ source /etc/kolla/admin-openrc.sh
    $ openstack hypervisor list -f table
    Expected: All hypervisors show State=up and Status=enabled
    If not: Note which hypervisors show down or disabled. Continue to Step 2

  Step 2: Check compute service status
    $ openstack compute service list -f table
    Expected: All nova-compute entries show State=up, Status=enabled
    If not: Affected node shows State=down. SSH to the affected compute node

  Step 3: Check Nova compute container on the affected node
    $ docker ps --filter "name=nova_compute" --format "table {{.Names}}\t{{.Status}}"
    Expected: nova_compute container shows "Up"
    If not: Container crashed. Restart:
            $ docker restart nova_compute
            Wait 30 seconds, recheck Step 2

  Step 4: Check libvirt container and daemon
    $ docker ps --filter "name=nova_libvirt" --format "table {{.Names}}\t{{.Status}}"
    Expected: nova_libvirt container shows "Up"
    $ docker exec nova_libvirt virsh list --all
    Expected: Lists all instances on this hypervisor with their states
    If not: Libvirt socket or daemon issue:
            $ docker restart nova_libvirt
            Wait 15 seconds, then: $ docker restart nova_compute

  Step 5: Verify KVM modules are loaded
    $ lsmod | grep kvm
    Expected: kvm_intel (or kvm_amd) and kvm modules loaded
    If not: Load KVM module:
            $ modprobe kvm_intel (or modprobe kvm_amd)
            If module fails to load, check BIOS for VT-x/AMD-V setting
            Fallback: set nova_compute_virt_type: "qemu" in globals.yml

  Step 6: Verify virt_type configuration
    $ docker exec nova_compute grep virt_type /etc/nova/nova.conf
    Expected: virt_type = kvm (for hardware virt) or virt_type = qemu (for nested)
    If not: Configuration mismatch. Reconfigure:
            $ kolla-ansible -i inventory reconfigure --tags nova

  Step 7: Check resource reporting discrepancies
    $ openstack hypervisor show <hostname> -f table
    Expected: vcpus, memory_mb, and local_gb values match physical hardware
    $ openstack resource provider inventory list <rp-uuid> -f table
    Expected: Inventory matches hypervisor show output
    If not: Resource reporting stale. Restart compute to re-register:
            $ docker restart nova_compute

  Step 8: Check Nova compute logs for specific errors
    $ docker logs nova_compute 2>&1 | tail -100 | grep -i "error\|exception\|libvirt"
    Expected: No recent errors
    Common messages:
      - "libvirtError: Unable to connect" -> libvirt socket issue (repeat Step 4)
      - "Disk not found" -> instance disk corrupted, check /var/lib/nova/instances/
      - "OperationalError" -> database connectivity issue

  Step 9: Verify instances on recovered hypervisor
    $ openstack server list --all-projects --host <hostname> -f table
    Expected: All instances show correct status (ACTIVE, SHUTOFF, etc.)
    If not: Instances may need recovery. For ACTIVE instances showing ERROR:
            $ openstack server reboot --hard <instance-id>

VERIFICATION
  1. Hypervisor reports as up:
     $ openstack hypervisor show <hostname> -c state -c status -f table
     Expected: state=up, status=enabled
  2. New instances can be scheduled to this host:
     $ openstack server create --flavor m1.tiny --image cirros \
         --network private --availability-zone nova:<hostname> test-hypervisor
     Expected: Instance reaches ACTIVE state on the target host
  3. Existing instances are running:
     $ docker exec nova_libvirt virsh list
     Expected: All expected instances show "running"

ROLLBACK
  1. If hypervisor cannot be recovered, disable scheduling:
     $ openstack compute service set --disable \
         --disable-reason "Hypervisor failure" <hostname> nova-compute
  2. Failover instances to other hypervisors:
     $ nova host-evacuate-live <hostname>
     For instances that cannot live-migrate:
     $ openstack server evacuate <instance-id> --host <target-host>
  3. Verify failover:
     $ openstack server list --all-projects --host <hostname>
     Expected: No instances remain on the failed host

RELATED RUNBOOKS
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If hypervisor issue causes launch failure
  - RB-NOVA-004: Live Migration Procedure -- To move instances off a degraded hypervisor
  - RB-NOVA-006: Compute Service Recovery After Host Failure -- If host is completely down
  - RB-NOVA-005: Compute Resource Exhaustion Response -- If resource reporting shows exhaustion
