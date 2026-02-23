RUNBOOK: RB-NOVA-005 -- Compute Resource Exhaustion Response
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source file /etc/kolla/admin-openrc.sh available
  3. Instance launches failing with "No valid host" due to resource constraints
  4. Nova scheduler, placement, and compute services operational

PROCEDURE
  Step 1: Assess overall compute resource utilization
    $ source /etc/kolla/admin-openrc.sh
    $ openstack hypervisor stats show -f table
    Expected: Summary of total vCPUs, memory, disk across all hypervisors
              with current usage counts
    Note: Compare used vs total for each resource type

  Step 2: Identify per-hypervisor resource usage
    $ openstack hypervisor list --long -f table
    Expected: Per-host breakdown of vCPUs used/total, memory used/total, disk used/total
    Note: Identify which hosts are most utilized

  Step 3: Check allocation ratios and effective capacity
    $ docker exec nova_scheduler grep -E "cpu_allocation_ratio|ram_allocation_ratio|disk_allocation_ratio" \
        /etc/nova/nova.conf
    Expected: Shows current overcommit ratios (default: CPU 4.0, RAM 1.5, disk 1.0)
    Effective capacity = physical * allocation_ratio
    If effective capacity is nearly exhausted, continue to Step 4

  Step 4: Identify resource reservation settings
    $ docker exec nova_compute grep -E "reserved_host_memory|reserved_host_disk" \
        /etc/nova/nova.conf
    Expected: reserved_host_memory_mb (default 512) and reserved_host_disk_mb (default 0)
    These are subtracted from available capacity before scheduling

  Step 5: Identify resource-heavy instances for potential consolidation
    $ openstack server list --all-projects --long -f table
    Expected: All instances with flavor, status, and host
    $ openstack server list --all-projects --status SHUTOFF -f table
    Expected: Instances that are stopped but still holding resource allocations
    If found: Consider deleting or archiving SHUTOFF instances to free resources

  Step 6: Check for orphan resource allocations in placement
    $ openstack resource provider usage show <rp-uuid> -f table
    Compare placement allocation count with actual running instances:
    $ openstack server list --all-projects --host <hostname> --status ACTIVE -f value -c ID | wc -l
    Expected: Counts match
    If not: Orphan allocations exist. Heal them:
            $ nova-manage placement heal_allocations --verbose

  Step 7: Evaluate temporary allocation ratio adjustment
    For immediate relief (increases effective capacity but overcommits more):
    vCPU ratio (current -> temporary):
    $ docker exec nova_compute crudini --set /etc/nova/nova.conf DEFAULT cpu_allocation_ratio 8.0
    $ docker restart nova_compute
    Expected: Effective vCPU capacity doubles (from 4:1 to 8:1)
    WARNING: Higher ratios mean more contention. Only use temporarily

  Step 8: Review project quotas for over-allocation
    $ openstack quota list --compute --all-projects -f table
    Expected: Per-project quotas shown with usage
    If any project uses excessive resources:
    $ openstack quota set --instances 10 --cores 20 --ram 40960 <project-id>

VERIFICATION
  1. New instances can launch after resource recovery:
     $ openstack server create --flavor m1.tiny --image cirros \
         --network private test-resource
     Expected: Instance reaches ACTIVE state
  2. Resource utilization is within acceptable bounds:
     $ openstack hypervisor stats show -c vcpus_used -c memory_mb_used -f table
     Expected: Utilization below 80% of effective capacity
  3. Placement inventory matches reality:
     $ openstack resource provider usage show <rp-uuid>
     Expected: Values align with actual instance allocations

ROLLBACK
  1. Revert allocation ratio changes:
     $ docker exec nova_compute crudini --set /etc/nova/nova.conf DEFAULT cpu_allocation_ratio 4.0
     $ docker restart nova_compute
  2. Revert quota changes:
     $ openstack quota set --instances <original> --cores <original> --ram <original> <project-id>
  3. Verify rollback:
     $ docker exec nova_compute grep allocation_ratio /etc/nova/nova.conf
     $ openstack quota show <project-id>

RELATED RUNBOOKS
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- Full launch failure diagnostic chain
  - RB-NOVA-002: Scheduler and Placement Troubleshooting -- If issue is filter-based not resource-based
  - RB-NOVA-004: Live Migration Procedure -- To rebalance instances across hosts
  - RB-NOVA-006: Compute Service Recovery After Host Failure -- If host loss caused resource pressure
