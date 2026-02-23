RUNBOOK: RB-NEUTRON-002 -- DHCP Agent Failure Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH access to the network node hosting the DHCP agent
3. The affected network UUID is known
4. Instances on the network are reporting DHCP failures (no IP assigned or wrong IP)

## PROCEDURE

Step 1: Check DHCP agent status

```bash
openstack network agent list --agent-type dhcp
```

Expected: DHCP agent shows `alive: True` and `admin_state_up: True`.
If not: Agent is down -- proceed to Step 3 to restart.

Step 2: Check which networks are hosted on the DHCP agent

```bash
openstack network agent list --agent-type dhcp -c ID -c Host -c Alive
neutron dhcp-agent-list-hosting-net <network-id> 2>/dev/null || \
  openstack network agent list --network <network-id>
```

Expected: At least one DHCP agent hosts the affected network and is alive.
If not: No DHCP agent hosts the network -- reassign in Step 6.

Step 3: Check the DHCP namespace and dnsmasq process

```bash
# Verify namespace exists
ip netns list | grep qdhcp-<network-id>

# Check dnsmasq is running in the namespace
ip netns exec qdhcp-<network-id> ps aux | grep dnsmasq
```

Expected: Namespace `qdhcp-<network-id>` exists and dnsmasq process is running inside it.
If not: Namespace missing or dnsmasq not running -- restart the DHCP agent in Step 4.

Step 4: Restart the Neutron DHCP agent

```bash
docker restart neutron_dhcp_agent
```

Expected: Container restarts successfully. After 10-15 seconds, namespaces and dnsmasq processes are recreated.
If not: Check container logs for errors: `docker logs neutron_dhcp_agent 2>&1 | tail -30`.

Step 5: Verify DHCP lease file and port allocation

```bash
# Check lease file
ip netns exec qdhcp-<network-id> cat /var/lib/neutron/dhcp/<network-id>/leases

# Check Neutron port for the instance
openstack port list --network <network-id> --device-owner compute:nova
openstack port show <port-id> -c fixed_ips -c mac_address
```

Expected: Lease file contains entries for active instances. Port shows correct `fixed_ips` with an IP from the subnet range.
If not: Port has no IP assigned -- check subnet DHCP is enabled: `openstack subnet show <subnet-id> -c enable_dhcp`.

Step 6: Reassign DHCP agent to network (if agent was replaced or network unhosted)

```bash
# Get available DHCP agent ID
DHCP_AGENT_ID=$(openstack network agent list --agent-type dhcp -c ID -f value | head -1)

# Add network to DHCP agent
neutron dhcp-agent-network-add $DHCP_AGENT_ID <network-id> 2>/dev/null || \
  openstack network agent add network --dhcp $DHCP_AGENT_ID <network-id>
```

Expected: Network is now hosted on the DHCP agent. Namespace and dnsmasq are created automatically.
If not: Check Neutron server logs: `docker logs neutron_server 2>&1 | grep dhcp`.

Step 7: Force DHCP renewal on the affected instance

```bash
# From inside the instance (via console)
sudo dhclient -r eth0 && sudo dhclient eth0

# Or reboot the instance
openstack server reboot <instance-id>
```

Expected: Instance obtains an IP address from the DHCP server.
If not: Check security groups allow DHCP traffic (UDP 67/68) and check OVS flows for the DHCP port.

## VERIFICATION

1. New instances on the network receive IP addresses: launch a test instance and verify via `openstack console log show`.
2. DHCP agent is alive: `openstack network agent list --agent-type dhcp` shows alive and up.
3. Dnsmasq process is running in the namespace: `ip netns exec qdhcp-<network-id> ps aux | grep dnsmasq`.

## ROLLBACK

1. If the DHCP agent restart caused issues on other networks, check all DHCP namespaces: `ip netns list | grep qdhcp`.
2. If a network was reassigned to a different agent, remove it and reassign to the original: `neutron dhcp-agent-network-remove <agent-id> <network-id>`.
3. If dnsmasq is running but serving incorrect leases, delete the lease file and restart the agent: `docker restart neutron_dhcp_agent`.

## RELATED RUNBOOKS

- RB-NEUTRON-001: Network Connectivity Loss Diagnosis -- when the issue extends beyond DHCP
- RB-NEUTRON-003: Floating IP Troubleshooting -- when external access fails after DHCP recovery
- RB-NEUTRON-006: Tenant Network Isolation Verification -- when DHCP leaks between tenant networks
