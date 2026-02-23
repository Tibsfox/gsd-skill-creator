RUNBOOK: RB-NEUTRON-006 -- Tenant Network Isolation Verification
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to compute and network nodes
3. At least two tenant networks exist with instances on each
4. Understanding of the expected segmentation type (VXLAN, VLAN, or flat)

## PROCEDURE

Step 1: Verify segmentation IDs for each tenant network

```bash
# List networks with provider attributes
openstack network list --long

# Show segmentation details per network
openstack network show <network-1> -c provider:network_type -c provider:segmentation_id
openstack network show <network-2> -c provider:network_type -c provider:segmentation_id
```

Expected: Each tenant network has a unique `segmentation_id`. VXLAN networks have VNI values, VLAN networks have VLAN IDs. No two tenant networks share the same segmentation ID.
If not: Duplicate segmentation IDs indicate a serious configuration error. Check ML2 config for VNI/VLAN range allocation.

Step 2: Verify VXLAN tunnel endpoints

```bash
# Check local tunnel endpoint
docker exec openvswitch_vswitchd ovs-vsctl get Open_vSwitch . other_config:local_ip

# List tunnel ports on br-int
docker exec openvswitch_vswitchd ovs-vsctl list-ports br-int | grep vxlan
```

Expected: Local tunnel IP is set and matches the host's tunnel interface IP. VXLAN tunnel ports exist for each remote compute host.
If not: Missing tunnel endpoints -- check `neutron_tunnel_interface` configuration in `globals.yml` and verify the tunnel network is reachable between hosts.

Step 3: Verify OVS flow-based isolation

```bash
# Check that flows use tunnel IDs for isolation
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep "tun_id="

# Verify each tunnel ID maps to a unique local VLAN tag
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep "mod_vlan_vid"
```

Expected: Flows translate between tunnel IDs (VNI) and local VLAN tags. Each tenant network has a unique mapping.
If not: Missing translation flows -- restart OVS agent to resync: `docker restart neutron_openvswitch_agent`.

Step 4: Test isolation between tenant networks

```bash
# From tenant network 1 DHCP namespace, try to reach tenant network 2
ip netns exec qdhcp-<network-1-id> ping -c 3 <network-2-instance-ip>
```

Expected: Ping fails (no route or timeout). Tenant networks are isolated by default.
If not: Traffic leaking between networks -- check for shared routers, incorrect subnet routes, or misconfigured port security.

Step 5: Verify router-based inter-network routing (if configured)

```bash
# If networks are intentionally connected via a router
openstack router show <router-name> -c interfaces_info

# Verify only expected networks are attached
openstack port list --router <router-id> -c "Fixed IP Addresses" -c "Network ID"
```

Expected: Only intentionally connected networks appear as router interfaces.
If not: Remove unexpected interfaces: `openstack router remove subnet <router> <subnet>`.

Step 6: Verify OVN logical switch isolation (OVN backend)

```bash
# List logical switches (one per Neutron network)
docker exec ovn_northd ovn-nbctl ls-list

# Verify each switch has only its own ports
docker exec ovn_northd ovn-nbctl lsp-list <logical-switch-name>
```

Expected: Each logical switch contains only ports belonging to that network. No cross-switch port leakage.
If not: Unexpected ports on a switch -- investigate Neutron port creation for errors.

Step 7: Validate VLAN-based isolation (if using VLAN networks)

```bash
# Check VLAN tag assignment
docker exec openvswitch_vswitchd ovs-vsctl list Port | grep -A2 "tag\|name"

# Verify bridge mappings
docker exec openvswitch_vswitchd ovs-vsctl get Open_vSwitch . other_config:bridge_mappings
```

Expected: Each port has the correct VLAN tag matching its network's segmentation ID. Bridge mappings connect logical networks to physical interfaces.
If not: Incorrect VLAN tags -- check ML2 config for `network_vlan_ranges` and bridge mapping configuration.

## VERIFICATION

1. Each tenant network has a unique segmentation ID: `openstack network list --long` shows no duplicates.
2. Cross-network traffic is blocked: ping between instances on different isolated networks fails.
3. Same-network traffic works: ping between instances on the same network succeeds.
4. Router-connected networks can communicate: if networks share a router, inter-network traffic works.

## ROLLBACK

N/A -- This is a read-only verification procedure. No changes are made to the system.

If isolation violations are found:
1. Document the violation (source network, destination network, traffic type).
2. Check for misconfigured routers or shared subnets.
3. Escalate to network administrator for remediation.
4. See RB-NEUTRON-005 for OVS bridge recovery if flow-level isolation is broken.

## RELATED RUNBOOKS

- RB-NEUTRON-001: Network Connectivity Loss Diagnosis -- when isolation verification reveals connectivity issues
- RB-NEUTRON-004: Security Group Rule Debugging -- for verifying security group enforcement alongside network isolation
- RB-NEUTRON-005: OVS/OVN Bridge Recovery -- when flow table issues break isolation
