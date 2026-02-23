RUNBOOK: RB-NOVA-002 -- Scheduler and Placement Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source file /etc/kolla/admin-openrc.sh available
  3. Nova scheduler and placement services are running
  4. Instance launch has failed with "No valid host" or scheduling-related errors

PROCEDURE
  Step 1: Identify which scheduler filter eliminated all hosts
    $ source /etc/kolla/admin-openrc.sh
    $ docker logs nova_scheduler 2>&1 | grep -i "filter" | tail -20
    Expected: Log entries show filter chain results, indicating which filter
              returned zero hosts
    Common filter failures:
      - AvailabilityZoneFilter: requested AZ has no hosts
      - ComputeFilter: all compute services disabled or down
      - RamFilter/DiskFilter: insufficient resources in placement
      - AggregateInstanceExtraSpecsFilter: flavor extra_specs mismatch

  Step 2: Check host aggregate configuration
    $ openstack aggregate list -f table
    Expected: Aggregates shown with availability zone assignments
    $ openstack aggregate show <aggregate-name> -f table
    Expected: Shows hosts assigned and metadata properties
    If not: Host may not be in the required aggregate:
            $ openstack aggregate add host <aggregate-name> <hostname>

  Step 3: Verify availability zone assignments
    $ openstack availability zone list --compute -f table
    Expected: AZs shown with host count and state (available)
    If not: AZ may be empty or all hosts disabled. Check:
            $ openstack compute service list -f table
            Look for State=up, Status=enabled in the target AZ

  Step 4: Check placement resource provider inventory
    $ openstack resource provider list -f table
    For each provider:
    $ openstack resource provider inventory list <rp-uuid> -f table
    Expected: VCPU, MEMORY_MB, DISK_GB inventories with adequate total and allocation_ratio
    $ openstack resource provider usage show <rp-uuid> -f table
    Expected: Usage values below available capacity

  Step 5: Resync placement inventory if stale
    $ docker restart nova_compute
    Wait 30 seconds for the compute service to re-register with placement
    $ openstack resource provider inventory list <rp-uuid> -f table
    Expected: Inventory values match actual hypervisor resources
    If not: Force resource provider update:
            $ docker exec nova_compute nova-manage placement sync_aggregates
            $ openstack resource provider set --name <hostname> <rp-uuid>

  Step 6: Verify scheduler configuration
    $ docker exec nova_scheduler grep -A 20 "\[filter_scheduler\]" \
        /etc/nova/nova.conf
    Expected: enabled_filters list includes required filters
              weight_classes configured appropriately
    If not: Check for misconfigured filters that eliminate valid hosts

  Step 7: Remove host from problematic aggregate (if misassigned)
    $ openstack aggregate remove host <aggregate-name> <hostname>
    Expected: Host removed from aggregate
    Retry instance launch to test
    If not: Re-add host and investigate further:
            $ openstack aggregate add host <aggregate-name> <hostname>

  Step 8: Test scheduling with explicit host hint (admin only)
    $ openstack server create --flavor m1.small --image cirros \
        --network private --availability-zone nova:<hostname> test-schedule
    Expected: Instance lands on the specified host
    If not: The specific host has a local issue. See RB-NOVA-003

VERIFICATION
  1. Scheduling succeeds for new instances:
     $ openstack server create --flavor m1.small --image cirros \
         --network private test-verify
     $ openstack server show test-verify -c status -c OS-EXT-SRV-ATTR:host -f table
     Expected: ACTIVE status with a host assignment
  2. Placement inventory is accurate:
     $ openstack resource provider usage show <rp-uuid> -f table
     Expected: Allocation incremented by the new instance resources
  3. No stale scheduler errors:
     $ docker logs nova_scheduler 2>&1 | tail -20
     Expected: No "NoValidHost" messages for recent requests

ROLLBACK
  1. Restore previous aggregate membership:
     $ openstack aggregate add host <aggregate-name> <hostname>
  2. Revert placement inventory changes:
     $ docker restart nova_compute
     (Compute re-registers with accurate inventory on startup)
  3. Verify rollback:
     $ openstack aggregate show <aggregate-name>
     $ openstack resource provider inventory list <rp-uuid>

RELATED RUNBOOKS
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- Full diagnostic chain for launch failures
  - RB-NOVA-005: Compute Resource Exhaustion Response -- If resources are the bottleneck
  - RB-NOVA-003: Hypervisor Connectivity Recovery -- If host-level issues cause scheduling failure
  - RB-KEYSTONE-002: Service Catalog Endpoint Repair -- If placement endpoint is misconfigured
