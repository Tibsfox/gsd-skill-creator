RUNBOOK: RB-NEUTRON-004 -- Security Group Rule Debugging
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the compute host running the affected instance
3. The affected instance UUID, port ID, and security group ID are known
4. The expected traffic pattern (protocol, port, direction) is known

## PROCEDURE

Step 1: List security group rules for the affected instance

```bash
# Get the port and its security groups
openstack port list --server <instance-id>
openstack port show <port-id> -c security_group_ids

# List all rules in the security group
openstack security group rule list <security-group-id> --long
```

Expected: Rules exist that allow the expected traffic (correct direction, protocol, port range, and remote IP prefix).
If not: Missing rule -- add it in Step 5.

Step 2: Check for default deny behavior

```bash
openstack security group rule list default --long
```

Expected: Default security group has egress rules allowing all outbound traffic. Ingress is denied by default (no ingress rules unless explicitly added).
If not: If default ingress rules are needed (SSH, ICMP), add them. Note that every project has its own `default` security group.

Step 3: Verify iptables/nftables rules on the compute host (OVS backend)

```bash
# Find the instance tap interface
docker exec openvswitch_vswitchd ovs-vsctl --columns=name find Interface | grep <port-id-prefix>

# Check iptables rules for the port chain
iptables -L neutron-openvswi-i<port-id-prefix> -n -v 2>/dev/null
iptables -L neutron-openvswi-o<port-id-prefix> -n -v 2>/dev/null
```

Expected: iptables chains exist for the port with rules matching the security group configuration.
If not: Rules not synchronized -- restart the OVS agent to force a resync: `docker restart neutron_openvswitch_agent`.

Step 4: Check conntrack table for stale connections

```bash
# List conntrack entries for the instance IP
conntrack -L -d <instance-ip> 2>/dev/null
conntrack -L -s <instance-ip> 2>/dev/null
```

Expected: Active connections appear in the conntrack table. After a security group rule change, existing connections maintain their previous state (stateful firewall behavior).
If not: If new rules should apply to existing connections, flush conntrack entries: `conntrack -D -d <instance-ip>`.

Step 5: Add or modify security group rules

```bash
# Allow SSH ingress
openstack security group rule create --protocol tcp --dst-port 22 \
  --ingress <security-group-id>

# Allow ICMP (ping)
openstack security group rule create --protocol icmp \
  --ingress <security-group-id>

# Allow from a specific CIDR
openstack security group rule create --protocol tcp --dst-port 80 \
  --remote-ip 10.0.0.0/24 --ingress <security-group-id>

# Allow from another security group
openstack security group rule create --protocol tcp --dst-port 3306 \
  --remote-group db-clients --ingress <security-group-id>
```

Expected: Rule created successfully. Traffic begins flowing within a few seconds as agents synchronize.
If not: Check for conflicting rules or quota exhaustion: `openstack quota show`.

Step 6: Verify OVN ACLs (OVN backend)

```bash
# List ACLs for the logical switch
docker exec ovn_northd ovn-nbctl acl-list <logical-switch-name>
```

Expected: ACL entries match the security group rules -- allow rules for permitted traffic, default drop for everything else.
If not: ACLs not synchronized -- check Neutron server logs for OVN driver errors: `docker logs neutron_server 2>&1 | grep "ovn\|acl"`.

Step 7: Test connectivity

```bash
# From another instance or namespace, test the expected traffic
# TCP test
ip netns exec qdhcp-<network-id> nc -zv <instance-ip> <port>

# ICMP test
ip netns exec qdhcp-<network-id> ping -c 3 <instance-ip>
```

Expected: Connection succeeds for allowed traffic and is rejected for denied traffic.
If not: If rules are correct but traffic still blocked, check OVS flows (RB-NEUTRON-001 Step 5) or OVN ACLs (Step 6 above).

## VERIFICATION

1. Expected traffic passes through: test with `nc`, `ping`, `curl`, or the application protocol.
2. Denied traffic is blocked: attempt traffic not in the security group rules and confirm it is dropped.
3. Security group rules match intent: `openstack security group rule list <group> --long` shows correct entries.

## ROLLBACK

1. Remove accidentally added rules: `openstack security group rule delete <rule-id>`.
2. If the security group was replaced, reassign the previous group to the port: `openstack port set --security-group <old-group> <port-id>`.
3. If conntrack was flushed, existing connections will be re-evaluated against current rules -- no manual rollback needed.
4. Restore previous rules from backup or documentation if bulk changes were made.

## RELATED RUNBOOKS

- RB-NEUTRON-001: Network Connectivity Loss Diagnosis -- when connectivity issues extend beyond security groups
- RB-NEUTRON-003: Floating IP Troubleshooting -- when external traffic is blocked
- RB-NEUTRON-006: Tenant Network Isolation Verification -- when checking cross-tenant isolation
