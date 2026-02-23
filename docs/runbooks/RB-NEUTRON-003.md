RUNBOOK: RB-NEUTRON-003 -- Floating IP Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the network node hosting the L3 agent or OVN gateway chassis
3. The affected floating IP address, instance, and router are known
4. The provider (external) network is operational

## PROCEDURE

Step 1: Check floating IP allocation and association state

```bash
openstack floating ip list
openstack floating ip show <floating-ip>
```

Expected: Floating IP shows `status: ACTIVE`, `floating_ip_address` is set, `fixed_ip_address` maps to the instance port, and `router_id` is populated.
If not: If `fixed_ip_address` is empty, the floating IP is not associated -- associate it: `openstack server add floating ip <instance> <floating-ip>`.

Step 2: Verify the external (provider) network

```bash
openstack network show <external-network-name>
```

Expected: Network shows `router:external: True`, `status: ACTIVE`, and has a subnet with the allocation pool containing the floating IP.
If not: External network misconfigured -- verify provider network settings match physical infrastructure.

Step 3: Check router gateway configuration

```bash
openstack router show <router-name>
```

Expected: `external_gateway_info` shows the external network ID, `enable_snat: True`, and the router has an external IP.
If not: Set the gateway: `openstack router set --external-gateway <external-network> <router>`.

Step 4: Verify NAT rules in the router namespace (OVS backend)

```bash
# Find the router namespace
ip netns list | grep qrouter-<router-id>

# Check DNAT rule for the floating IP
ip netns exec qrouter-<router-id> iptables -t nat -L -n -v | grep <floating-ip>
```

Expected: DNAT rule maps the floating IP to the instance fixed IP on the PREROUTING chain. SNAT rule exists on the POSTROUTING chain.
If not: Missing NAT rules -- restart the L3 agent: `docker restart neutron_l3_agent`.

Step 5: Verify NAT rules in OVN (OVN backend)

```bash
docker exec ovn_northd ovn-nbctl lr-nat-list <router-name>
```

Expected: Both `dnat_and_snat` entry for the floating IP and a `snat` entry for the router gateway exist.
If not: NAT rules missing from OVN -- check Neutron server logs for errors during floating IP association.

Step 6: Check external bridge and ARP response

```bash
# Verify br-ex has the external interface
docker exec openvswitch_vswitchd ovs-vsctl show | grep -A5 br-ex

# Test ARP from an external host (if accessible)
arping -c 3 <floating-ip>
```

Expected: `br-ex` shows the physical interface as a port. ARP response is received for the floating IP.
If not: Bridge misconfigured -- verify `neutron_external_interface` in `globals.yml`. If no ARP response, the L3 agent or OVN gateway is not responding for this IP.

Step 7: Verify security group allows traffic to the instance port

```bash
openstack port list --server <instance-id>
openstack port show <port-id> -c security_group_ids
openstack security group rule list <security-group-id>
```

Expected: Security group rules allow the expected ingress traffic (SSH/ICMP/HTTP).
If not: Add required rules -- see RB-NEUTRON-004 (Security Group Rule Debugging).

## VERIFICATION

1. Ping the floating IP from an external host or the provider network: `ping -c 5 <floating-ip>` -- all packets succeed.
2. SSH to the floating IP (if SSH is allowed in security groups): `ssh cirros@<floating-ip>`.
3. Verify the floating IP status: `openstack floating ip show <floating-ip>` -- status is `ACTIVE`.

## ROLLBACK

1. Disassociate and reassociate the floating IP: `openstack server remove floating ip <instance> <floating-ip>` then `openstack server add floating ip <instance> <floating-ip>`.
2. If the router gateway was modified, restore the original gateway: `openstack router set --external-gateway <original-network> <router>`.
3. If the L3 agent was restarted, verify all other floating IPs on the same router still work.

## RELATED RUNBOOKS

- RB-NEUTRON-001: Network Connectivity Loss Diagnosis -- when the instance has no internal connectivity either
- RB-NEUTRON-004: Security Group Rule Debugging -- when traffic is blocked at the security group level
- RB-NEUTRON-005: OVS/OVN Bridge Recovery -- when br-ex is missing or misconfigured
