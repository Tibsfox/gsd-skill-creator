RUNBOOK: RB-NEUTRON-001 -- Network Connectivity Loss Diagnosis
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the affected compute and network nodes
3. Neutron service and OVS/OVN containers are running (`docker ps | grep neutron`)
4. The affected instance UUID and network UUID are known

## PROCEDURE

Step 1: Check OVS bridge status on the affected host

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected: `br-int` and `br-ex` bridges listed with ports attached and no error states.
If not: Bridges missing or in error state -- go to RB-NEUTRON-005 (OVS/OVN Bridge Recovery).

Step 2: Verify Neutron agent status

```bash
openstack network agent list
```

Expected: All agents show `alive: True` and `admin_state_up: True`. The agent on the affected host should be listed.
If not: Agent down -- restart the agent container (`docker restart neutron_openvswitch_agent` or `docker restart ovn_controller`) and re-check.

Step 3: Check the instance port binding status

```bash
openstack port list --server <instance-uuid>
openstack port show <port-id> -c binding_vif_type -c binding_host_id -c status
```

Expected: `binding_vif_type` is `ovs` or `ovn`, `status` is `ACTIVE`, `binding_host_id` matches the compute host.
If not: `binding_vif_type` is `binding_failed` -- check Neutron server logs (`docker logs neutron_server 2>&1 | grep <port-id>`). Recreate the port if binding cannot recover.

Step 4: Check network namespace connectivity (OVS backend)

```bash
# Identify the DHCP namespace for the instance network
ip netns list | grep qdhcp-<network-id>

# Ping the instance fixed IP from the DHCP namespace
ip netns exec qdhcp-<network-id> ping -c 3 <instance-fixed-ip>
```

Expected: Ping succeeds, confirming L2 connectivity between the DHCP namespace and the instance.
If not: Packet loss or no reply -- the issue is in OVS flow programming. Proceed to Step 5.

Step 5: Trace the packet path through OVS flows

```bash
# Get the instance port's OVS tag
docker exec openvswitch_vswitchd ovs-vsctl --columns=tag find Interface name=<tap-port-id-prefix>

# Dump flows and filter by port tag
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep <port-tag>
```

Expected: Flow rules exist for the instance port tag with correct actions (NORMAL, output to tunnel port, etc.).
If not: Missing or stale flows -- restart the OVS agent to force a flow resync: `docker restart neutron_openvswitch_agent`.

Step 6: Check OVN logical topology (OVN backend)

```bash
# Verify logical switch port exists
docker exec ovn_northd ovn-nbctl show | grep <port-id-prefix>

# Verify southbound binding
docker exec ovn_controller ovn-sbctl show | grep <port-id-prefix>
```

Expected: Port appears in both northbound and southbound databases with correct chassis binding.
If not: Port missing from southbound -- check `ovn-controller` connectivity: `docker exec ovn_controller ovn-appctl connection-status`.

Step 7: Check security group rules are not blocking traffic

```bash
openstack port show <port-id> -c security_group_ids
openstack security group rule list <security-group-id>
```

Expected: Security group rules allow the expected traffic (at minimum, egress is allowed by default).
If not: Missing ingress rules -- see RB-NEUTRON-004 (Security Group Rule Debugging).

## VERIFICATION

1. From the DHCP namespace or another instance on the same network, ping the affected instance: `ip netns exec qdhcp-<network-id> ping -c 5 <instance-ip>` -- all 5 packets should succeed.
2. From the instance console (via `openstack console log show <instance>`), verify the instance has its assigned IP address on the correct interface.
3. Check Neutron agent status: `openstack network agent list` -- all agents alive and up.

## ROLLBACK

1. If OVS agent was restarted, verify that all other instances on the same host still have connectivity.
2. If flows were manually modified, restore default flow behavior by restarting the OVS agent: `docker restart neutron_openvswitch_agent`.
3. If a port was recreated, update the instance to use the new port or reboot the instance to trigger re-binding.

## RELATED RUNBOOKS

- RB-NEUTRON-002: DHCP Agent Failure Recovery -- when instance has no IP address assigned
- RB-NEUTRON-004: Security Group Rule Debugging -- when traffic is blocked by security group rules
- RB-NEUTRON-005: OVS/OVN Bridge Recovery -- when bridges are missing or corrupted
- RB-NOVA-001: Instance Launch Failure Diagnosis -- when connectivity loss is tied to a failed instance boot
