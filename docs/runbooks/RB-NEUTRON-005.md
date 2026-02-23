RUNBOOK: RB-NEUTRON-005 -- OVS/OVN Bridge Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. SSH root access to the affected node
3. OVS containers are running (`docker ps | grep openvswitch`)
4. Understanding of the expected bridge topology (br-int for integration, br-ex for external)

## PROCEDURE

Step 1: Check OVS bridge status and configuration

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected: `br-int` (integration bridge) and `br-ex` (external bridge) are listed. `br-ex` has the physical interface (`neutron_external_interface`) as a port. No error states reported.
If not: Missing bridges or error states -- proceed to Step 3 for recovery.

Step 2: Dump OVS flow tables to check for corruption

```bash
# Check br-int flows
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | wc -l

# Check br-ex flows
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-ex
```

Expected: Flow tables contain entries. `br-int` typically has many flows (50+). Flows have non-zero packet counters for active rules.
If not: Zero flows or very few flows indicate the agent has not programmed flows. Zero packet counters on all flows indicate the bridge is not processing traffic.

Step 3: Check OVN controller connectivity (OVN backend)

```bash
# Check controller connection status
docker exec ovn_controller ovn-appctl connection-status

# Check southbound database contents
docker exec ovn_controller ovn-sbctl show
```

Expected: Connection status is `connected`. Southbound database shows chassis entries for all hosts with correct encapsulation IPs.
If not: `not connected` -- check OVN database containers: `docker logs ovn_northd 2>&1 | tail -20` and `docker ps | grep ovsdb`.

Step 4: Restart OVS service to recover bridges

```bash
# Restart the openvswitch containers
docker restart openvswitch_vswitchd openvswitch_db

# Wait for recovery (15-30 seconds)
sleep 15

# Verify bridges are back
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected: Bridges are recreated from the OVS database. Flow tables are repopulated by the Neutron agent or OVN controller.
If not: If bridges are still missing, the OVSDB may be corrupted -- proceed to Step 5.

Step 5: Rebuild OVS bridges from Neutron state (last resort)

```bash
# Delete and recreate bridges
docker exec openvswitch_vswitchd ovs-vsctl --if-exists del-br br-int
docker exec openvswitch_vswitchd ovs-vsctl --if-exists del-br br-ex

docker exec openvswitch_vswitchd ovs-vsctl add-br br-int
docker exec openvswitch_vswitchd ovs-vsctl add-br br-ex
docker exec openvswitch_vswitchd ovs-vsctl add-port br-ex <neutron_external_interface>

# Restart Neutron agents to reprogram flows
docker restart neutron_openvswitch_agent 2>/dev/null
docker restart ovn_controller 2>/dev/null

# Wait for flow programming
sleep 30
```

Expected: Bridges are recreated. Agents reprogram all flows from Neutron state. Connectivity is restored.
If not: Check Neutron agent logs: `docker logs neutron_openvswitch_agent 2>&1 | tail -50` or `docker logs ovn_controller 2>&1 | tail -50`.

Step 6: Verify flow table integrity after recovery

```bash
# Check flow count is reasonable
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | wc -l

# Check for specific expected flows (ARP, DHCP, tunnel)
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep arp
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep "dl_type=0x0800"
```

Expected: Flow count matches the number of active ports and networks. ARP and IP flows exist.
If not: Flows still missing -- check if the agent is in a crash loop: `docker logs neutron_openvswitch_agent 2>&1 | grep -i error`.

Step 7: Compact OVN databases if performance is degraded

```bash
# Check database sizes
docker exec ovn_northd ls -la /var/lib/openvswitch/ovnnb_db.db
docker exec ovn_northd ls -la /var/lib/openvswitch/ovnsb_db.db

# Compact if databases are large (>10MB for small deployments)
docker exec ovn_northd ovsdb-tool compact /var/lib/openvswitch/ovnnb_db.db
docker exec ovn_northd ovsdb-tool compact /var/lib/openvswitch/ovnsb_db.db
```

Expected: Database files are reduced in size. Query performance improves.
If not: Compaction fails -- backup and recreate databases from Neutron state (requires Kolla-Ansible reconfigure).

## VERIFICATION

1. OVS bridges are intact: `docker exec openvswitch_vswitchd ovs-vsctl show` shows `br-int` and `br-ex` with correct ports.
2. Flow tables are populated: `docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | wc -l` returns a non-trivial count.
3. Instance connectivity is restored: test ping from DHCP namespace to instances.
4. Neutron agents are alive: `openstack network agent list` shows all agents alive.

## ROLLBACK

1. If bridge rebuild caused connectivity loss on the host, run `kolla-ansible -i inventory reconfigure --tags neutron` to restore the expected configuration.
2. If OVN databases were compacted and are now corrupt, restore from backup: `docker cp /backup/ovnnb_db.db ovn_northd:/var/lib/openvswitch/ovnnb_db.db`.
3. As a last resort, rerun Kolla-Ansible deploy for Neutron: `kolla-ansible -i inventory deploy --tags neutron,openvswitch`.

## RELATED RUNBOOKS

- RB-NEUTRON-001: Network Connectivity Loss Diagnosis -- start here for general connectivity issues
- RB-NEUTRON-006: Tenant Network Isolation Verification -- verify isolation after bridge recovery
- RB-KOLLA-001: Kolla-Ansible Service Recovery -- for full service redeployment when OVS recovery fails
