RUNBOOK: RB-NOVA-001 -- Instance Launch Failure Diagnosis
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source file /etc/kolla/admin-openrc.sh available
  3. Keystone API operational (verify with openstack token issue)
  4. Nova, Neutron, Glance, and Placement services deployed and running

PROCEDURE
  Step 1: Check instance fault message
    $ source /etc/kolla/admin-openrc.sh
    $ openstack server show <instance-id> -c status -c fault -f table
    Expected: Status shows ERROR or BUILD with a fault message explaining the failure
    If not: Instance may still be building. Wait 60 seconds and recheck.
            If stuck in BUILD for over 5 minutes, continue to Step 2

  Step 2: Check Nova scheduler for placement failures
    $ docker logs nova_scheduler 2>&1 | tail -100 | grep -i "no valid host\|filter\|placement"
    Expected: Logs show which filter eliminated all candidate hosts
    Common messages:
      - "NoValidHost" -> resource exhaustion or filter mismatch (go to Step 3)
      - "Failed to connect to placement" -> placement service down (go to Step 4)
    If not: Scheduler may not have received the request. Check nova-api:
            $ docker logs nova_api 2>&1 | tail -50

  Step 3: Verify placement service resource inventory
    $ openstack resource provider list -f table
    Expected: At least one resource provider (one per compute node)
    $ openstack resource provider inventory list <rp-uuid> -f table
    Expected: VCPU, MEMORY_MB, and DISK_GB with total, reserved, and allocation_ratio
    $ openstack resource provider usage show <rp-uuid> -f table
    Expected: Current usage values below (total - reserved) * allocation_ratio
    If not: Resources exhausted. See RB-NOVA-005 for resource exhaustion response

  Step 4: Verify placement service is running
    $ docker ps --filter "name=placement" --format "table {{.Names}}\t{{.Status}}"
    Expected: placement_api shows "Up"
    $ openstack resource provider list
    Expected: Returns provider list without errors
    If not: Restart placement: $ docker restart placement_api
            Retry instance launch after 15 seconds

  Step 5: Check Neutron port allocation
    $ openstack port list --device-owner compute:nova --status ERROR -f table
    Expected: No error-state ports
    $ openstack network agent list -f table
    Expected: All agents show Alive=True and State=UP
    If not: Neutron agent failure. Check:
            $ docker logs neutron_openvswitch_agent 2>&1 | tail -50
            See RB-NEUTRON-001 for network connectivity issues

  Step 6: Verify Glance image availability
    $ openstack image show <image-name-or-id> -c status -c size -c disk_format -f table
    Expected: Status=active, size > 0, disk_format matches expected (qcow2, raw)
    If not: Image may be deleted or corrupted. Re-upload:
            $ openstack image create --file <image-file> --disk-format qcow2 \
                --container-format bare --public <image-name>
            See RB-GLANCE-001 for image service issues

  Step 7: Check Keystone authentication for service users
    $ openstack token issue
    Expected: Valid token returned
    If not: See RB-KEYSTONE-001 for token issuance failure
    Verify service catalog has all required endpoints:
    $ openstack catalog list -f table
    Expected: compute, network, image, placement all present
    If not: See RB-KEYSTONE-002 for catalog repair

  Step 8: Check compute node logs
    $ docker logs nova_compute 2>&1 | tail -100 | grep -i "error\|exception\|fail"
    Expected: No recent errors
    Common messages:
      - "libvirtError" -> hypervisor issue (see RB-NOVA-003)
      - "ImageNotFound" -> Glance connectivity (repeat Step 6)
      - "VirtualInterfaceCreateException" -> Neutron issue (repeat Step 5)
      - "OverQuota" -> quota exceeded: $ openstack quota show <project>

  Step 9: Retry instance launch
    $ openstack server create --flavor m1.small --image cirros \
        --network private --security-group default test-instance
    $ openstack server show test-instance -c status -f value
    Expected: Status transitions from BUILD to ACTIVE within 60 seconds
    If not: Collect all logs and escalate:
            $ docker logs nova_scheduler 2>&1 > /tmp/nova-scheduler.log
            $ docker logs nova_compute 2>&1 > /tmp/nova-compute.log
            $ docker logs neutron_server 2>&1 > /tmp/neutron-server.log

VERIFICATION
  1. Instance reaches ACTIVE state:
     $ openstack server show <instance-id> -c status -f value
     Expected: ACTIVE
  2. Instance is reachable on network:
     $ openstack server show <instance-id> -c addresses -f value
     Expected: Shows assigned IP address
  3. Console access works:
     $ openstack console url show <instance-id>
     Expected: Returns a VNC console URL

ROLLBACK
  1. Clean up failed instance:
     $ openstack server delete --force <instance-id>
  2. Clean up orphan ports:
     $ openstack port list --device-id <instance-id> -f value -c id | \
         xargs -I {} openstack port delete {}
  3. Verify cleanup:
     $ openstack server show <instance-id>
     Expected: "No server with a name or ID of" (deleted)

RELATED RUNBOOKS
  - RB-KEYSTONE-001: Token Issuance Failure -- If auth failure blocks instance launch
  - RB-NOVA-002: Scheduler and Placement Troubleshooting -- For NoValidHost deep dive
  - RB-NOVA-003: Hypervisor Connectivity Recovery -- If libvirt errors cause launch failure
  - RB-NOVA-005: Compute Resource Exhaustion Response -- If resources are exhausted
