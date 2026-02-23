RUNBOOK: RB-NOVA-006 -- Compute Service Recovery After Host Failure
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source file /etc/kolla/admin-openrc.sh available
  3. A compute node is confirmed down (hardware failure, OS crash, network isolation)
  4. Shared storage (NFS/Ceph) is required for evacuation to preserve instance data
     (without shared storage, only instance metadata is preserved; data is lost)

PROCEDURE
  Step 1: Confirm the compute host is down
    $ source /etc/kolla/admin-openrc.sh
    $ openstack compute service list -f table
    Expected: The failed host shows State=down
    $ ping -c 3 <failed-host>
    Expected: No response (host unreachable)
    If host responds: It may be recovering. Wait 2 minutes and recheck
                      before proceeding with evacuation

  Step 2: Identify instances on the failed host
    $ openstack server list --all-projects --host <failed-host> -f table
    Expected: List of instances that were running on the failed host
    Note: Record instance IDs, names, and projects for notification

  Step 3: Fence the failed host (prevent split-brain)
    $ openstack compute service set --disable \
        --disable-reason "Host failure - evacuation in progress" \
        <failed-host> nova-compute
    Expected: Service Status changes to "disabled"
    If not: Host may already be disabled. Verify:
            $ openstack compute service show <service-id>

  Step 4: Force the compute service down (if not already)
    $ openstack compute service set --down <failed-host> nova-compute
    Expected: Service State forced to "down"
    This allows Nova to release resources and permit evacuation

  Step 5: Evacuate instances to available hosts
    For all instances at once:
    $ nova host-evacuate <failed-host>
    Expected: Evacuation requests submitted for each instance
    For individual instances (more control):
    $ openstack server evacuate <instance-id>
    To a specific target host:
    $ openstack server evacuate <instance-id> --host <target-host>
    Expected: Each instance rebuild starts on a new host

  Step 6: Monitor evacuation progress
    $ for id in $(openstack server list --all-projects --host <failed-host> \
        -f value -c ID); do
        echo -n "Instance $id: "
        openstack server show $id -c status -c OS-EXT-SRV-ATTR:host -f value
      done
    Expected: Instances transition from ERROR/ACTIVE to REBUILD to ACTIVE
              host field changes to new compute node
    If not: Check individual instance status:
            $ openstack server show <instance-id> -c fault -f table

  Step 7: Verify evacuated instances are functional
    $ openstack server list --all-projects --status ACTIVE -f table | grep -v <failed-host>
    Expected: All evacuated instances show ACTIVE on their new hosts
    For each critical instance:
    $ openstack console url show <instance-id>
    Expected: Console URL accessible

  Step 8: Clean up orphaned resources from the failed host
    Check for orphan ports:
    $ openstack port list --device-owner compute:nova -f table | grep <failed-host>
    If orphan ports found:
    $ openstack port delete <port-id>
    Check for orphan volume attachments:
    $ openstack volume list --all-projects -f table | grep "in-use"
    Verify each in-use volume is still attached to a valid instance

  Step 9: Handle the failed host recovery (when hardware returns)
    When the host comes back online:
    $ openstack compute service set --enable <failed-host> nova-compute
    $ openstack compute service set --up <failed-host> nova-compute
    Clean up stale instance data on recovered host:
    $ ssh <failed-host> "docker exec nova_compute nova-manage db purge_instance_data"
    Verify resource reporting:
    $ openstack hypervisor show <failed-host> -f table

VERIFICATION
  1. No instances remain assigned to the failed host:
     $ openstack server list --all-projects --host <failed-host>
     Expected: Empty list (all instances evacuated)
  2. All evacuated instances are running:
     $ openstack server list --all-projects --status ERROR
     Expected: No instances in ERROR state from the evacuation
  3. Resource allocations are clean:
     $ openstack resource provider usage show <failed-host-rp-uuid>
     Expected: Zero usage (all allocations moved to new hosts)

ROLLBACK
  1. If the original host recovers and evacuation should be reversed:
     $ openstack compute service set --enable <failed-host> nova-compute
     For each instance, migrate back:
     $ openstack server migrate --live <failed-host> <instance-id>
  2. If evacuated instances have issues, rebuild from image:
     $ openstack server rebuild <instance-id> --image <original-image>
  3. Verify rollback:
     $ openstack server list --all-projects --host <failed-host>
     Expected: Instances back on original host and ACTIVE

RELATED RUNBOOKS
  - RB-NOVA-003: Hypervisor Connectivity Recovery -- If host is degraded but not fully down
  - RB-NOVA-004: Live Migration Procedure -- For planned migrations when host is still up
  - RB-NOVA-005: Compute Resource Exhaustion Response -- If evacuation targets are resource-constrained
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If evacuated instances fail to launch on new hosts
  - RB-KEYSTONE-001: Token Issuance Failure -- If auth failure complicates recovery
