# Neutron Operations Manual -- Networking Service Procedures

**Service:** OpenStack Neutron (Software-Defined Networking)
**SE Phase:** Phase E (Operations & Sustainment)
**NPR Reference:** NPR 7123.1 SS 3.2 Process 9 (Product Transition)
**Document Standard:** NASA-STD-3001 (adapted for cloud operations)

This document contains all operational procedures for the OpenStack Neutron networking service. Neutron is the most operationally complex service in the stack, providing software-defined networking including security groups, floating IPs, DHCP, L3 routing, and ML2 plugin architecture with OVN/OVS backends. Each procedure follows NASA procedure format with verification commands that can be validated against the running system.

---

## Table of Contents

- [OPS-NEUTRON-001: Service Health Check (Daily)](#ops-neutron-001-service-health-check-daily)
- [OPS-NEUTRON-002: Configuration Verification](#ops-neutron-002-configuration-verification)
- [OPS-NEUTRON-003: Backup and Restore](#ops-neutron-003-backup-and-restore)
- [OPS-NEUTRON-004: Minor Upgrade](#ops-neutron-004-minor-upgrade)
- [OPS-NEUTRON-005: Major Upgrade](#ops-neutron-005-major-upgrade)
- [OPS-NEUTRON-006: Troubleshooting Common Failures](#ops-neutron-006-troubleshooting-common-failures)
- [OPS-NEUTRON-007: Security Audit](#ops-neutron-007-security-audit)
- [OPS-NEUTRON-008: Network Topology Changes](#ops-neutron-008-network-topology-changes)
- [OPS-NEUTRON-009: Floating IP Management](#ops-neutron-009-floating-ip-management)
- [OPS-NEUTRON-010: Security Group Audit](#ops-neutron-010-security-group-audit)

---

## OPS-NEUTRON-001: Service Health Check (Daily)

```
PROCEDURE ID: OPS-NEUTRON-001
TITLE: Neutron Service Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Verify that all Neutron networking services are running, agents are alive, network connectivity is functional, and logs contain no critical errors. Execute daily as part of the operations health monitoring cycle.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Keystone authentication is configured and working (see OPS-KEYSTONE-001)
3. Operator has admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
4. Docker daemon is running on the host

### SAFETY CONSIDERATIONS

- This is a read-only procedure with no risk of data loss or service disruption
- If agent status shows "DOWN" or "XXX", do not restart agents without first checking logs -- an agent restart during a network operation can cause packet loss
- Network namespace commands run inside the namespace context and cannot affect other namespaces

### PROCEDURE

Step 1: Verify Neutron containers are running.

```bash
docker ps --format '{{.Names}}' | grep neutron
```

Expected result: The following containers are listed (OVN backend):
```
neutron_server
neutron_ovn_metadata_agent
```
Or (OVS backend):
```
neutron_server
neutron_openvswitch_agent
neutron_l3_agent
neutron_dhcp_agent
neutron_metadata_agent
```

If unexpected: If any container is missing, check its status with `docker ps -a --filter name=neutron`. If the container exited, inspect logs with `docker logs <container_name> 2>&1 | tail -50`. Restart the container with `docker restart <container_name>`.

Step 2: Verify OVS/OVN infrastructure containers are running.

```bash
docker ps --format '{{.Names}}' | grep -E 'openvswitch|ovn'
```

Expected result (OVN backend):
```
ovn_controller
ovn_northd
ovsdb-nb
ovsdb-sb
openvswitch_vswitchd
openvswitch_db
```
Expected result (OVS backend):
```
openvswitch_vswitchd
openvswitch_db
```

If unexpected: If OVS containers are missing, Neutron cannot function. Check `docker logs openvswitch_vswitchd 2>&1 | tail -20` for hardware or driver errors. Restart with `docker restart openvswitch_vswitchd openvswitch_db`.

Step 3: Check Neutron agent status.

```bash
openstack network agent list
```

Expected result: All agents show `alive` = True and `admin_state_up` = True. Example output:
```
+------+--------------------+----------+---+-------+-------+
| ID   | Agent Type         | Host     |...|Alive  |State  |
+------+--------------------+----------+---+-------+-------+
| ...  | Open vSwitch agent | node-1   |...| :-)   | UP    |
| ...  | DHCP agent         | node-1   |...| :-)   | UP    |
| ...  | L3 agent           | node-1   |...| :-)   | UP    |
| ...  | Metadata agent     | node-1   |...| :-)   | UP    |
+------+--------------------+----------+---+-------+-------+
```

If unexpected: If any agent shows `XXX` (not alive), check the agent container logs. If the agent shows `DOWN` (admin disabled), re-enable with `openstack network agent set --enable <agent-id>`.

Step 4: Verify OVS bridge configuration.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected result: Output shows `br-int` (integration bridge) and `br-ex` (external bridge) with the `neutron_external_interface` attached as a port on `br-ex`.

If unexpected: If `br-ex` is missing or the external interface is not attached, network external connectivity is broken. Refer to OPS-NEUTRON-006 for troubleshooting.

Step 5: Verify network connectivity by listing existing networks.

```bash
openstack network list
```

Expected result: At least the provider network is listed with status ACTIVE.

If unexpected: If no networks are listed or API returns an error, verify Neutron server is running and check `docker logs neutron_server 2>&1 | tail -20`.

Step 6: Check Neutron server logs for errors.

```bash
docker logs neutron_server 2>&1 | grep -i error | tail -20
```

Expected result: No recent ERROR-level messages. Occasional deprecation warnings are acceptable.

If unexpected: Record the error messages and correlate with timestamps. Recurring errors indicate a persistent issue -- refer to OPS-NEUTRON-006 for troubleshooting guidance.

### VERIFICATION

1. Confirm all Neutron containers are in "Up" state: `docker ps --filter name=neutron --format '{{.Names}}: {{.Status}}'`
2. Confirm all agents alive: `openstack network agent list -f value -c Alive | sort -u` should return only `True` (or `:-)`)
3. Confirm OVS bridges exist: `docker exec openvswitch_vswitchd ovs-vsctl list-br` should include `br-int` and `br-ex`
4. Confirm API responds: `openstack network list` returns without error

### ROLLBACK

This is a read-only health check procedure. No rollback is required.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (authentication prerequisite)
- OPS-NOVA-001: Nova Service Health Check (compute-network integration)
- OpenStack Neutron Administration Guide: https://docs.openstack.org/neutron/2024.2/admin/
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-002: Configuration Verification

```
PROCEDURE ID: OPS-NEUTRON-002
TITLE: Neutron Configuration Verification
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm that Neutron configuration matches the expected state after any deployment, reconfiguration, or upgrade. Verify ML2 plugin settings, OVS/OVN bridge configuration, DHCP agent settings, and globals.yml network parameters. Execute after every configuration change.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Access to the deployment host with `globals.yml` available
4. Neutron containers are running (confirm with OPS-NEUTRON-001)

### SAFETY CONSIDERATIONS

- This is a read-only procedure with no risk of data loss
- Do not modify configuration files during verification -- changes require a reconfigure cycle (`kolla-ansible reconfigure`)
- Bridge configuration changes can cause network outages if applied incorrectly

### PROCEDURE

Step 1: Verify Neutron network interface settings in globals.yml.

```bash
grep -E 'network_interface|neutron_external_interface|neutron_plugin_agent' /etc/kolla/globals.yml
```

Expected result:
```
network_interface: "eth0"
neutron_external_interface: "eth1"
neutron_plugin_agent: "ovn"
```
(Values will match your deployment configuration.)

If unexpected: If settings are missing or incorrect, do not modify globals.yml directly during verification. Record the discrepancy and schedule a reconfiguration with `kolla-ansible reconfigure --tags neutron`.

Step 2: Verify ML2 plugin configuration.

```bash
docker exec neutron_server grep -A5 '\[ml2\]' /etc/neutron/plugins/ml2/ml2_conf.ini
```

Expected result:
```
[ml2]
type_drivers = flat,vlan,vxlan
tenant_network_types = vxlan
mechanism_drivers = ovn
```
(Or `openvswitch` for OVS backend.)

If unexpected: If mechanism driver does not match `neutron_plugin_agent` in globals.yml, the configuration is out of sync. Run `kolla-ansible reconfigure --tags neutron` to resynchronize.

Step 3: Verify OVS bridge mappings.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected result: `br-ex` bridge exists with the external interface (e.g., `eth1`) as a port. `br-int` bridge exists for internal traffic.

If unexpected: If bridges are missing, check `docker logs openvswitch_vswitchd 2>&1 | tail -20`. Missing bridges indicate a failed deployment or reconfigure operation.

Step 4: Verify bridge mappings in Neutron configuration.

```bash
docker exec neutron_server grep bridge_mappings /etc/neutron/plugins/ml2/ml2_conf.ini
```

Expected result:
```
bridge_mappings = physnet1:br-ex
```

If unexpected: If `physnet1` is not mapped to `br-ex`, provider networks cannot function. This requires a reconfigure to fix.

Step 5: Verify DHCP agent settings (OVS backend only).

```bash
docker exec neutron_dhcp_agent cat /etc/neutron/dhcp_agent.ini | grep -E 'interface_driver|dhcp_driver'
```

Expected result:
```
interface_driver = openvswitch
dhcp_driver = neutron.agent.linux.dhcp.Dnsmasq
```

If unexpected: Incorrect interface driver prevents DHCP from functioning. Reconfigure with `kolla-ansible reconfigure --tags neutron`.

Step 6: Verify tenant network type configuration.

```bash
docker exec neutron_server grep -E 'vni_ranges|network_vlan_ranges|flat_networks' /etc/neutron/plugins/ml2/ml2_conf.ini
```

Expected result: VXLAN VNI ranges or VLAN ranges are configured. `flat_networks` includes `physnet1` for provider network support.

If unexpected: Missing network type configuration prevents tenant or provider network creation. Verify globals.yml settings and reconfigure.

### VERIFICATION

1. Confirm plugin agent matches: `grep neutron_plugin_agent /etc/kolla/globals.yml` matches mechanism driver in ML2 config
2. Confirm bridge exists: `docker exec openvswitch_vswitchd ovs-vsctl br-exists br-ex && echo "EXISTS" || echo "MISSING"`
3. Confirm external interface attached: `docker exec openvswitch_vswitchd ovs-vsctl list-ports br-ex` includes the expected physical interface
4. Confirm ML2 config valid: `docker exec neutron_server neutron-sanity-check --config-file /etc/neutron/neutron.conf` (if available)

### ROLLBACK

This is a read-only verification procedure. No rollback is required. If misconfigurations are found, address them through `kolla-ansible reconfigure --tags neutron`.

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (prerequisite)
- OPS-KEYSTONE-002: Keystone Configuration Verification
- OpenStack Neutron ML2 Plugin: https://docs.openstack.org/neutron/2024.2/admin/config-ml2.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-003: Backup and Restore

```
PROCEDURE ID: OPS-NEUTRON-003
TITLE: Neutron Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Neutron database, OVS/OVN configuration, and network definitions for disaster recovery. Includes restore procedure with full connectivity verification. Execute before any upgrade, migration, or destructive maintenance.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced and database access
3. Sufficient storage space for backup files (check with `df -h /backup`)
4. All Neutron agents are alive (confirm with OPS-NEUTRON-001)
5. No active network operations in progress (verify with `openstack network list --long`)

### SAFETY CONSIDERATIONS

- Database backup is read-only and does not affect running services
- OVS configuration export is read-only
- Restore is destructive -- it replaces the current Neutron database and OVS configuration
- Restore requires stopping Neutron services, causing a network control plane outage (data plane traffic on existing flows continues)
- Ensure the backup file is verified before attempting a restore

### PROCEDURE

**Backup:**

Step 1: Create a timestamped backup directory.

```bash
BACKUP_DIR="/backup/neutron/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
```

Expected result: Directory created successfully.

If unexpected: If the filesystem is full, free space or use a different backup location.

Step 2: Back up the Neutron database.

```bash
docker exec mariadb mysqldump -u root -p"$(grep database_password /etc/kolla/passwords.yml | awk '{print $2}')" neutron > "$BACKUP_DIR/neutron_db.sql"
```

Expected result: File `neutron_db.sql` is created with non-zero size. Verify with `ls -lh "$BACKUP_DIR/neutron_db.sql"`.

If unexpected: If the dump fails, check MariaDB connectivity with `docker exec mariadb mysql -u root -p"<password>" -e "SHOW DATABASES;"`. Refer to database troubleshooting.

Step 3: Back up OVS configuration.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show > "$BACKUP_DIR/ovs_config.txt"
docker exec openvswitch_vswitchd ovsdb-client dump > "$BACKUP_DIR/ovsdb_dump.json"
```

Expected result: Both files created with non-zero size.

If unexpected: If OVS commands fail, check that `openvswitch_vswitchd` and `openvswitch_db` containers are running.

Step 4: Back up OVN databases (OVN backend only).

```bash
docker exec ovn_northd ovsdb-client backup unix:/run/ovn/ovnnb_db.sock > "$BACKUP_DIR/ovnnb_backup.db"
docker exec ovn_northd ovsdb-client backup unix:/run/ovn/ovnsb_db.sock > "$BACKUP_DIR/ovnsb_backup.db"
```

Expected result: OVN northbound and southbound database backups created.

If unexpected: If OVN containers are not present, skip this step (OVS backend does not use OVN databases).

Step 5: Export network definitions.

```bash
openstack network list -f json > "$BACKUP_DIR/networks.json"
openstack subnet list -f json > "$BACKUP_DIR/subnets.json"
openstack router list -f json > "$BACKUP_DIR/routers.json"
openstack floating ip list -f json > "$BACKUP_DIR/floating_ips.json"
openstack security group list -f json > "$BACKUP_DIR/security_groups.json"
```

Expected result: JSON files created for all network resources.

If unexpected: API errors indicate Neutron service issues. Resolve with OPS-NEUTRON-001 before continuing.

Step 6: Verify backup integrity.

```bash
ls -lh "$BACKUP_DIR/"
head -5 "$BACKUP_DIR/neutron_db.sql"
```

Expected result: All files have non-zero size. The SQL file starts with MySQL dump headers.

If unexpected: Re-run the failed backup steps. Do not proceed with maintenance until backup is verified.

**Restore:**

Step 7: Stop Neutron services.

```bash
docker stop neutron_server neutron_openvswitch_agent neutron_l3_agent neutron_dhcp_agent neutron_metadata_agent 2>/dev/null
docker stop neutron_ovn_metadata_agent 2>/dev/null
```

Expected result: All Neutron containers stopped. Network data plane traffic continues on existing flows.

If unexpected: If containers cannot be stopped, use `docker kill <container_name>`.

Step 8: Restore the Neutron database.

```bash
docker exec -i mariadb mysql -u root -p"$(grep database_password /etc/kolla/passwords.yml | awk '{print $2}')" neutron < "$BACKUP_DIR/neutron_db.sql"
```

Expected result: Database restored without errors.

If unexpected: If restore fails with schema errors, the backup may be from a different OpenStack version. Verify version compatibility before retrying.

Step 9: Restart Neutron services.

```bash
docker start neutron_server
sleep 10
docker start neutron_openvswitch_agent neutron_l3_agent neutron_dhcp_agent neutron_metadata_agent 2>/dev/null
docker start neutron_ovn_metadata_agent 2>/dev/null
```

Expected result: All containers start successfully.

If unexpected: Check logs with `docker logs neutron_server 2>&1 | tail -20`. Database migration issues after restore require manual intervention.

Step 10: Verify connectivity after restore.

```bash
openstack network list
openstack network agent list
```

Expected result: All networks restored and all agents alive.

If unexpected: If agents are not alive after 60 seconds, restart them individually and check logs.

### VERIFICATION

1. Confirm backup files exist: `ls -la "$BACKUP_DIR/"` shows all expected files with non-zero size
2. Confirm database restored: `docker exec mariadb mysql -u root -p"<password>" -e "SELECT COUNT(*) FROM neutron.networks;"`
3. Confirm agents alive: `openstack network agent list` shows all agents as alive
4. Confirm networks accessible: `openstack network list` returns expected networks

### ROLLBACK

If the restore causes issues, restore from a different (earlier) backup by repeating Steps 7-10 with the earlier backup directory. If no earlier backup exists, redeploy Neutron with `kolla-ansible deploy --tags neutron`.

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (pre/post verification)
- OPS-KEYSTONE-003: Keystone Backup and Restore (auth prerequisite)
- OpenStack Neutron Database: https://docs.openstack.org/neutron/2024.2/admin/config-db.html
- SP-6105 SS 5.5: Product Transition -- Backup and Recovery
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-004: Minor Upgrade

```
PROCEDURE ID: OPS-NEUTRON-004
TITLE: Neutron Minor Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a minor version update to the Neutron service using Kolla-Ansible. Minor upgrades apply patch-level updates within the same OpenStack release. Execute when Kolla-Ansible container images are updated with security patches or bug fixes.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Backup completed (OPS-NEUTRON-003)
4. New container images pulled and available locally
5. All Neutron agents are alive (confirm with OPS-NEUTRON-001)
6. No active instance migrations or network operations in progress

### SAFETY CONSIDERATIONS

- Minor upgrades briefly restart Neutron containers, causing a short control plane outage (typically under 60 seconds)
- Data plane traffic on existing flows is not affected during the upgrade
- New network operations (create, delete, modify) will fail during the upgrade window
- If the upgrade fails, rollback to the previous container images is possible

### PROCEDURE

Step 1: Capture pre-upgrade network state.

```bash
openstack network agent list -f json > /tmp/neutron_pre_upgrade_agents.json
openstack network list -f json > /tmp/neutron_pre_upgrade_networks.json
openstack router list -f json > /tmp/neutron_pre_upgrade_routers.json
```

Expected result: JSON files capture current agent status and network topology.

If unexpected: If the API is not responding, resolve with OPS-NEUTRON-001 before proceeding.

Step 2: Verify new container images are available.

```bash
docker images | grep neutron
```

Expected result: Updated Neutron images are listed with the target version tag.

If unexpected: Pull the images first with `kolla-ansible pull --tags neutron`.

Step 3: Execute the Neutron upgrade.

```bash
kolla-ansible upgrade -i /etc/kolla/inventory --tags neutron
```

Expected result: Upgrade completes without errors. Each container is replaced sequentially.

If unexpected: If the upgrade fails mid-way, check the Ansible output for the failing task. Common issues include database migration errors or container startup failures. Check `docker logs neutron_server 2>&1 | tail -50`.

Step 4: Verify all agents are alive after upgrade.

```bash
openstack network agent list
```

Expected result: All agents show alive status. Agent versions may reflect the new release.

If unexpected: Wait up to 120 seconds for agents to reconnect. If agents remain down, check individual container logs.

Step 5: Verify network connectivity after upgrade.

```bash
openstack network list
openstack router list
openstack floating ip list
```

Expected result: All pre-upgrade networks, routers, and floating IPs are present and active.

If unexpected: Compare with pre-upgrade state captured in Step 1. Missing resources indicate a database migration issue. Restore from backup (OPS-NEUTRON-003).

Step 6: Verify OVS bridge integrity.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected result: `br-int` and `br-ex` bridges intact with correct port mappings.

If unexpected: If bridges are missing or misconfigured, run `kolla-ansible reconfigure --tags neutron` to restore bridge configuration.

### VERIFICATION

1. Confirm agents alive: `openstack network agent list` shows all agents with `alive` = True
2. Confirm networks intact: `openstack network list | wc -l` matches pre-upgrade count
3. Confirm bridges intact: `docker exec openvswitch_vswitchd ovs-vsctl list-br` includes `br-int` and `br-ex`
4. Confirm no errors in logs: `docker logs neutron_server 2>&1 | grep -c ERROR` returns 0 or known pre-existing count

### ROLLBACK

1. Stop upgraded containers: `docker stop neutron_server neutron_openvswitch_agent neutron_l3_agent neutron_dhcp_agent neutron_metadata_agent`
2. Restore previous container images by re-running deployment with the previous tag: `kolla-ansible deploy --tags neutron` (with the previous image tag in globals.yml)
3. If database migration occurred, restore from backup (OPS-NEUTRON-003)
4. Verify rollback: `openstack network agent list`

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (pre/post verification)
- OPS-NEUTRON-003: Backup and Restore (pre-upgrade backup)
- OPS-KEYSTONE-004: Keystone Minor Upgrade (upgrade prerequisite -- Keystone first)
- OpenStack Neutron Upgrades: https://docs.openstack.org/neutron/2024.2/admin/upgrade.html
- SP-6105 SS 5.4: System Maintenance and Upgrades
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-005: Major Upgrade

```
PROCEDURE ID: OPS-NEUTRON-005
TITLE: Neutron Major Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a major version upgrade to the Neutron service (e.g., from 2024.1 to 2024.2). Major upgrades include database schema migrations, API changes, and potential backend compatibility changes. Execute during a planned maintenance window with full connectivity verification.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Full backup completed (OPS-NEUTRON-003) including database and OVN databases
4. Keystone has been upgraded first (OPS-KEYSTONE-005)
5. OVS/OVN version compatibility verified against the target OpenStack release
6. All Neutron agents are alive (confirm with OPS-NEUTRON-001)
7. No active instance migrations or network operations in progress
8. Maintenance window communicated to all users

### SAFETY CONSIDERATIONS

- Major upgrades involve database schema migrations that are NOT reversible without a full database restore
- The control plane will be unavailable during the upgrade (typically 5-15 minutes)
- Data plane traffic on existing flows continues, but new operations will fail during the upgrade
- OVN database schema may change between major versions -- ensure OVN version compatibility
- If the upgrade fails, restoring from backup is the only recovery path
- Test the upgrade in a staging environment first if possible

### PROCEDURE

Step 1: Capture comprehensive pre-upgrade state.

```bash
UPGRADE_DIR="/backup/neutron/major_upgrade_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$UPGRADE_DIR"
openstack network agent list -f json > "$UPGRADE_DIR/agents.json"
openstack network list -f json > "$UPGRADE_DIR/networks.json"
openstack subnet list -f json > "$UPGRADE_DIR/subnets.json"
openstack router list -f json > "$UPGRADE_DIR/routers.json"
openstack floating ip list -f json > "$UPGRADE_DIR/floating_ips.json"
openstack security group list -f json > "$UPGRADE_DIR/security_groups.json"
openstack port list -f json > "$UPGRADE_DIR/ports.json"
```

Expected result: All JSON state files created.

If unexpected: Resolve API issues before proceeding with the upgrade.

Step 2: Verify OVS/OVN version compatibility.

```bash
docker exec openvswitch_vswitchd ovs-vsctl --version
docker exec ovn_northd ovn-nbctl --version 2>/dev/null
```

Expected result: Current OVS/OVN versions are listed. Check the target OpenStack release notes for minimum required versions.

If unexpected: If OVS/OVN versions are below the minimum required, upgrade OVS/OVN first using `kolla-ansible upgrade --tags openvswitch` before upgrading Neutron.

Step 3: Run full backup (OPS-NEUTRON-003).

```bash
# Execute OPS-NEUTRON-003 backup procedure
```

Expected result: Complete backup including database, OVS config, and OVN databases (if applicable).

If unexpected: Do not proceed with the upgrade until backup is verified.

Step 4: Execute the major upgrade.

```bash
kolla-ansible upgrade -i /etc/kolla/inventory --tags neutron
```

Expected result: Upgrade completes with database migrations applied. Output shows migration steps completing successfully.

If unexpected: If the upgrade fails during database migration, do NOT retry. Check the error, and if unrecoverable, restore from backup (OPS-NEUTRON-003 restore procedure).

Step 5: Verify database migration completed.

```bash
docker exec neutron_server neutron-db-manage --config-file /etc/neutron/neutron.conf current
```

Expected result: Output shows the current database revision matching the target release.

If unexpected: If the revision is incorrect, the migration may have partially failed. Check `docker logs neutron_server 2>&1 | grep -i migration` for details.

Step 6: Verify all agents are alive and report the correct version.

```bash
openstack network agent list
```

Expected result: All agents alive with updated binary version.

If unexpected: Wait up to 180 seconds for agents to reconnect after a major upgrade. If agents remain down, restart them individually: `docker restart <agent_container>`.

Step 7: Verify full network connectivity.

```bash
openstack network list
openstack router list
openstack floating ip list
openstack port list --status ACTIVE
```

Expected result: All pre-upgrade resources are present and accessible.

If unexpected: Compare with pre-upgrade state from Step 1. Missing resources require investigation of database migration logs.

Step 8: Verify OVS/OVN bridge and flow integrity.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | head -20
```

Expected result: Bridges intact, flows present for active ports.

If unexpected: If bridges are misconfigured, run `kolla-ansible reconfigure --tags neutron`.

Step 9: Test end-to-end connectivity.

```bash
# From an existing instance (if accessible), verify:
# - Instance can reach its gateway
# - Instance can reach external network via floating IP
# - Instance can reach other instances on the same network
openstack console log show <test-instance> | tail -20
```

Expected result: Instance network connectivity is functional.

If unexpected: If connectivity is broken, check OVS flows and router namespaces. Refer to OPS-NEUTRON-006.

### VERIFICATION

1. Confirm database at target revision: `docker exec neutron_server neutron-db-manage current` shows expected revision
2. Confirm all agents alive: `openstack network agent list` all show True/UP
3. Confirm network count matches: `openstack network list | wc -l` matches pre-upgrade count
4. Confirm port count matches: `openstack port list | wc -l` matches pre-upgrade count
5. Confirm bridges intact: `docker exec openvswitch_vswitchd ovs-vsctl show` shows expected topology

### ROLLBACK

Major upgrade rollback requires a full database restore:

1. Stop all Neutron containers: `docker stop $(docker ps --filter name=neutron -q)`
2. Restore the Neutron database from backup (OPS-NEUTRON-003 Step 8)
3. Restore OVN databases if applicable (OPS-NEUTRON-003 Step 4 in reverse)
4. Redeploy with previous version: set the previous tag in globals.yml and run `kolla-ansible deploy --tags neutron`
5. Verify all agents and connectivity: run OPS-NEUTRON-001

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (pre/post verification)
- OPS-NEUTRON-003: Backup and Restore (mandatory pre-upgrade)
- OPS-KEYSTONE-005: Keystone Major Upgrade (must be completed first)
- OPS-NOVA-005: Nova Major Upgrade (upgrade after Neutron)
- OpenStack Neutron Upgrade Guide: https://docs.openstack.org/neutron/2024.2/admin/upgrade.html
- OpenStack Release Notes: https://docs.openstack.org/releasenotes/neutron/
- SP-6105 SS 5.4: System Maintenance and Upgrades
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-006: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-NEUTRON-006
TITLE: Troubleshooting Common Neutron Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Neutron failure modes: network unreachable (OVS bridge issues), DHCP agent failures, floating IP not working, security group rules not applied, and metadata agent unreachable. Execute when operators report networking issues.

### PRECONDITIONS

1. OpenStack cloud is deployed
2. Operator has admin credentials sourced
3. Access to the host for container log inspection and OVS commands
4. Basic health check completed to identify which failure mode applies (OPS-NEUTRON-001)

### SAFETY CONSIDERATIONS

- Troubleshooting commands are read-only unless explicitly noted
- Restarting agents may cause brief connectivity disruptions for instances using that agent
- Flushing OVS flows causes all traffic to be re-learned, causing a brief network interruption
- Never delete OVS bridges without a clear recovery plan

### PROCEDURE

**Failure Mode A: Network Unreachable (OVS Bridge Issues)**

Step 1: Check OVS bridge status.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show
```

Expected result: `br-int` and `br-ex` bridges listed with expected ports.

If unexpected: If `br-ex` is missing, recreate it:
```bash
docker exec openvswitch_vswitchd ovs-vsctl add-br br-ex
docker exec openvswitch_vswitchd ovs-vsctl add-port br-ex eth1
```
Replace `eth1` with the actual external interface.

Step 2: Check OVS flow table for stale flows.

```bash
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | wc -l
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep "n_packets=0" | wc -l
```

Expected result: Flow table has entries; some zero-packet flows are normal for recently created ports.

If unexpected: If most flows have zero packets, the flow table may be stale. Restart the OVS agent: `docker restart neutron_openvswitch_agent` (or `ovn_controller` for OVN).

Step 3: Verify the physical interface is up.

```bash
ip link show eth1
```

Expected result: Interface shows `state UP` and `LOWER_UP`.

If unexpected: If the interface is down, bring it up with `ip link set eth1 up`. Check cable and switch port status.

Step 4: Trace a packet through OVS (advanced).

```bash
docker exec openvswitch_vswitchd ovs-appctl ofproto/trace br-int in_port=<port_number>,dl_src=<mac>,dl_dst=<mac>,dl_type=0x0800,nw_src=<src_ip>,nw_dst=<dst_ip>
```

Expected result: Trace shows the packet being forwarded to the expected output port.

If unexpected: If the trace shows the packet being dropped, examine the matching flow rules and security group configuration.

**Failure Mode B: DHCP Agent Failures**

Step 5: Check DHCP agent status.

```bash
openstack network agent list | grep -i dhcp
```

Expected result: DHCP agent shows alive and UP.

If unexpected: Restart the DHCP agent: `docker restart neutron_dhcp_agent`.

Step 6: Verify dnsmasq process in the network namespace (OVS backend).

```bash
docker exec neutron_dhcp_agent ip netns list | head -5
docker exec neutron_dhcp_agent ip netns exec qdhcp-<network-id> ps aux | grep dnsmasq
```

Expected result: dnsmasq process is running in the DHCP namespace for the network.

If unexpected: If dnsmasq is not running, restart the DHCP agent: `docker restart neutron_dhcp_agent`. If the namespace does not exist, the DHCP agent failed to create it -- check logs.

Step 7: Check DHCP lease file.

```bash
docker exec neutron_dhcp_agent cat /var/lib/neutron/dhcp/<network-id>/leases
```

Expected result: Lease file exists and contains entries for active ports.

If unexpected: Empty lease file indicates the DHCP agent is not receiving port notifications. Check `docker logs neutron_dhcp_agent 2>&1 | tail -20`.

**Failure Mode C: Floating IP Not Working**

Step 8: Verify router gateway is set.

```bash
openstack router show <router-name> -c external_gateway_info
```

Expected result: `external_gateway_info` shows the provider network ID.

If unexpected: Set the gateway: `openstack router set --external-gateway provider-net <router-name>`.

Step 9: Verify NAT rules (OVS backend).

```bash
docker exec neutron_l3_agent ip netns exec qrouter-<router-id> iptables -t nat -L -n -v
```

Expected result: DNAT rules mapping the floating IP to the fixed IP, and SNAT rules for outbound traffic.

If unexpected: If NAT rules are missing, restart the L3 agent: `docker restart neutron_l3_agent`.

Step 10: Verify ARP response for the floating IP.

```bash
arping -I eth1 <floating-ip> -c 3
```

Expected result: ARP replies received from the router namespace.

If unexpected: If no ARP replies, the L3 agent is not responding for this IP. Check OVN gateway chassis: `docker exec ovn_northd ovn-nbctl lr-nat-list <router>`.

**Failure Mode D: Security Group Rules Not Applied**

Step 11: Verify security group rules.

```bash
openstack security group rule list <security-group-name>
```

Expected result: Expected rules are listed with correct direction, protocol, and port range.

If unexpected: Add missing rules: `openstack security group rule create --protocol tcp --dst-port <port> <group>`.

Step 12: Check port security status.

```bash
openstack port show <port-id> -c port_security_enabled -c security_group_ids
```

Expected result: `port_security_enabled` is True and the expected security group is listed.

If unexpected: If port security is disabled, rules are bypassed entirely. Enable with `openstack port set --enable-port-security <port-id>`.

Step 13: Check OVS/OVN ACLs.

```bash
# OVN backend:
docker exec ovn_northd ovn-nbctl acl-list <logical-switch>

# OVS backend:
docker exec openvswitch_vswitchd ovs-ofctl dump-flows br-int | grep "ct_state"
```

Expected result: ACLs or conntrack flows match the security group rules.

If unexpected: Restart the security agent to force resync: `docker restart neutron_openvswitch_agent` or `docker restart ovn_controller`.

**Failure Mode E: Metadata Agent Unreachable**

Step 14: Check metadata agent status.

```bash
openstack network agent list | grep -i metadata
docker ps --filter name=metadata
```

Expected result: Metadata agent is alive and container is running.

If unexpected: Restart metadata agent: `docker restart neutron_metadata_agent` or `docker restart neutron_ovn_metadata_agent`.

Step 15: Verify metadata proxy configuration.

```bash
docker exec neutron_metadata_agent cat /etc/neutron/metadata_agent.ini | grep -E 'nova_metadata|metadata_proxy'
```

Expected result: `nova_metadata_host` points to the correct Nova API endpoint.

If unexpected: If the configuration is incorrect, reconfigure with `kolla-ansible reconfigure --tags neutron`.

Step 16: Test metadata from inside a network namespace (OVS backend).

```bash
docker exec neutron_l3_agent ip netns exec qrouter-<router-id> curl -s http://169.254.169.254/latest/meta-data/
```

Expected result: Returns metadata fields (hostname, instance-id, etc.).

If unexpected: If curl times out, the metadata proxy is not forwarding requests. Check `docker logs neutron_metadata_agent 2>&1 | tail -20`.

### VERIFICATION

1. For each failure mode resolved, run the corresponding verification command from the Expected result
2. Run OPS-NEUTRON-001 to confirm overall service health
3. Verify end-to-end connectivity from an instance: `openstack console log show <instance> | tail -20`

### ROLLBACK

Troubleshooting actions are primarily diagnostic. For any configuration changes made during troubleshooting:

1. Document changes in the operations log
2. If a configuration change worsens the issue, reverse it by restoring the previous value
3. If OVS bridge changes were made, restore from OVS backup if available (OPS-NEUTRON-003)

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (initial diagnostics)
- OPS-NEUTRON-009: Floating IP Management (floating IP issues)
- OPS-NEUTRON-010: Security Group Audit (security group issues)
- OPS-NOVA-006: Nova Troubleshooting (compute-network integration issues)
- OpenStack Neutron Troubleshooting: https://docs.openstack.org/neutron/2024.2/admin/config-debug.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-007: Security Audit

```
PROCEDURE ID: OPS-NEUTRON-007
TITLE: Neutron Security Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Perform a monthly security audit of the Neutron networking configuration. Review security group rules for overly permissive access, verify network isolation between projects, check RBAC network policies, verify port security settings, and confirm anti-spoofing protections. Execute monthly or after any security incident.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. List of expected security policies and network isolation requirements available
4. Previous audit report available for comparison (if not the first audit)

### SAFETY CONSIDERATIONS

- This is a read-only audit procedure with no risk of data loss
- Do not modify security groups or network policies during the audit -- document findings and schedule remediation separately
- Security group changes take effect immediately and can lock out instance access if applied incorrectly

### PROCEDURE

Step 1: Review all security group rules across all projects.

```bash
openstack security group list --all-projects -f json > /tmp/security_audit_groups.json
openstack security group list --all-projects
```

Expected result: List of all security groups across all projects.

If unexpected: If the `--all-projects` flag fails, the operator may not have admin privileges. Verify admin role.

Step 2: Identify overly permissive rules.

```bash
for sg in $(openstack security group list --all-projects -f value -c ID); do
  openstack security group rule list "$sg" -f json | python3 -c "
import json, sys
rules = json.load(sys.stdin)
for r in rules:
    if r.get('IP Range') == '0.0.0.0/0' and r.get('Direction') == 'ingress':
        port = r.get('Port Range', 'any')
        proto = r.get('IP Protocol', 'any')
        print(f'WARNING: SG {r.get(\"Security Group\")} allows {proto}:{port} from 0.0.0.0/0')
" 2>/dev/null
done
```

Expected result: Any rules allowing unrestricted ingress from 0.0.0.0/0 are flagged.

If unexpected: Permissive rules should be reviewed and restricted to specific source IP ranges where possible.

Step 3: Verify network isolation between projects.

```bash
openstack network list --all-projects --long -f value -c Name -c "Project ID" -c Shared
```

Expected result: Shared networks are only the designated shared networks (e.g., provider network). Tenant networks should not be shared.

If unexpected: If a tenant network is inadvertently shared, remove sharing: `openstack network set --no-share <network>`.

Step 4: Check RBAC network policies.

```bash
openstack network rbac list
```

Expected result: RBAC policies restrict network access to authorized projects only.

If unexpected: Overly broad RBAC policies (granting access to `*` wildcard) should be replaced with project-specific policies.

Step 5: Verify port security settings.

```bash
openstack port list --all-projects -f json | python3 -c "
import json, sys
ports = json.load(sys.stdin)
for p in ports:
    if not p.get('port_security_enabled', True):
        print(f'WARNING: Port {p[\"ID\"]} ({p.get(\"Name\",\"unnamed\")}) has port security DISABLED')
"
```

Expected result: Only ports with a documented justification (e.g., load balancers, VPN gateways) have port security disabled.

If unexpected: Re-enable port security on unjustified ports: `openstack port set --enable-port-security <port-id>`.

Step 6: Verify anti-spoofing protections.

```bash
openstack port list --all-projects -f json | python3 -c "
import json, sys
ports = json.load(sys.stdin)
for p in ports:
    aap = p.get('allowed_address_pairs', [])
    if aap:
        print(f'INFO: Port {p[\"ID\"]} has allowed address pairs: {aap}')
"
```

Expected result: Only ports with a documented justification have allowed address pairs configured.

If unexpected: Review each allowed address pair for necessity. Remove unauthorized pairs: `openstack port unset --allowed-address ip-address=<ip> <port-id>`.

Step 7: Check for default security group modifications.

```bash
for project in $(openstack project list -f value -c ID); do
  echo "Project: $project"
  openstack security group list --project "$project" -f value -c Name | grep default
  openstack security group rule list default --project "$project" -f value -c Direction -c "IP Protocol" -c "Port Range" -c "IP Range" 2>/dev/null
done
```

Expected result: Default security groups follow organizational policy (typically deny all ingress, allow all egress).

If unexpected: If default security groups have been modified to allow broad ingress, document and remediate.

### VERIFICATION

1. Audit report generated: All findings documented with security group IDs, port IDs, and specific rules
2. No unauthorized 0.0.0.0/0 ingress rules exist outside documented exceptions
3. All tenant networks are properly isolated (not shared)
4. Port security enabled on all ports except documented exceptions
5. RBAC policies restrict access to authorized projects only

### ROLLBACK

This is a read-only audit procedure. No rollback is required. Remediation actions should be planned and executed separately with proper change control.

### REFERENCES

- OPS-NEUTRON-010: Security Group Audit (detailed security group review)
- OPS-KEYSTONE-007: Keystone Security Audit (identity security)
- OpenStack Neutron Security Groups: https://docs.openstack.org/neutron/2024.2/admin/archives/config-security.html
- OpenStack Neutron RBAC: https://docs.openstack.org/neutron/2024.2/admin/config-rbac.html
- SP-6105 SS 5.5: Product Transition -- Security Compliance
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-008: Network Topology Changes

```
PROCEDURE ID: OPS-NEUTRON-008
TITLE: Network Topology Changes
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Add, modify, or remove networks, subnets, and routers in the Neutron topology. Includes creating new tenant networks, modifying subnet configurations, adding/removing router interfaces, and verifying connectivity after changes. Execute when the network topology needs to change for new projects, workloads, or infrastructure changes.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Network design document specifying the desired topology change
4. No conflicting CIDR ranges with existing subnets
5. Neutron agents are alive (confirm with OPS-NEUTRON-001)

### SAFETY CONSIDERATIONS

- Adding networks is non-disruptive
- Modifying subnets can affect DHCP assignments for existing instances
- Removing subnets or networks with active ports will fail -- ports must be removed first
- Router interface changes can cause temporary connectivity loss for instances on affected subnets
- Always capture the current topology before making changes

### PROCEDURE

Step 1: Capture current network topology.

```bash
openstack network list -f json > /tmp/topology_pre_change.json
openstack subnet list -f json >> /tmp/topology_pre_change.json
openstack router list -f json >> /tmp/topology_pre_change.json
```

Expected result: Current topology saved for comparison.

If unexpected: API errors indicate service issues -- resolve with OPS-NEUTRON-001.

**Add a Network:**

Step 2: Create a new tenant network.

```bash
openstack network create <network-name> \
  --project <project-id>
```

Expected result: Network created with status ACTIVE.

If unexpected: If creation fails with a quota error, check project network quota: `openstack quota show <project-id> -c networks`.

Step 3: Create a subnet on the network.

```bash
openstack subnet create <subnet-name> \
  --network <network-name> \
  --subnet-range <cidr> \
  --gateway <gateway-ip> \
  --dns-nameserver 8.8.8.8 \
  --allocation-pool start=<start-ip>,end=<end-ip>
```

Expected result: Subnet created with DHCP enabled by default.

If unexpected: If the CIDR overlaps with an existing subnet, choose a different range. Check: `openstack subnet list -c CIDR`.

Step 4: Connect the network to a router.

```bash
openstack router add subnet <router-name> <subnet-name>
```

Expected result: Subnet interface added to the router.

If unexpected: If the router already has a subnet in the same CIDR range, the operation fails. Remove the conflicting interface first.

**Modify a Subnet:**

Step 5: Update subnet properties.

```bash
openstack subnet set <subnet-name> \
  --dns-nameserver <new-dns> \
  --gateway <new-gateway> \
  --allocation-pool start=<new-start>,end=<new-end>
```

Expected result: Subnet properties updated. Existing instances retain their current IPs.

If unexpected: Allocation pool changes do not affect existing leases. New instances will use the updated pool.

**Remove a Network:**

Step 6: Remove all ports on the network.

```bash
openstack port list --network <network-name> -f value -c ID
# For each port:
openstack port delete <port-id>
```

Expected result: All ports removed.

If unexpected: Ports attached to instances must be detached first. Remove the instance from the network or delete the instance.

Step 7: Remove the subnet from the router.

```bash
openstack router remove subnet <router-name> <subnet-name>
```

Expected result: Router interface removed.

If unexpected: If the subnet has active ports, remove them first (Step 6).

Step 8: Delete the subnet and network.

```bash
openstack subnet delete <subnet-name>
openstack network delete <network-name>
```

Expected result: Subnet and network deleted.

If unexpected: If deletion fails with "in use" error, there are remaining ports. Run `openstack port list --network <network-name>` to find them.

Step 9: Verify connectivity after changes.

```bash
openstack network list
openstack router show <router-name> -c interfaces_info
```

Expected result: Updated topology matches the design document. Router interfaces reflect the changes.

If unexpected: If connectivity is broken, check router interfaces and OVS flows. Refer to OPS-NEUTRON-006.

### VERIFICATION

1. Confirm new network created (if adding): `openstack network show <network-name>` returns ACTIVE
2. Confirm subnet CIDR correct: `openstack subnet show <subnet-name> -c cidr`
3. Confirm router interface present (if added): `openstack router show <router-name> -c interfaces_info` lists the new subnet
4. Confirm old network removed (if deleting): `openstack network show <network-name>` returns "No Network found"
5. Run OPS-NEUTRON-001 to confirm overall health

### ROLLBACK

1. If a network was added: `openstack network delete <network-name>` (remove subnets and router interfaces first)
2. If a subnet was modified: `openstack subnet set <subnet-name>` with the original values from the pre-change capture
3. If a network was removed: Recreate using the topology saved in Step 1
4. Run OPS-NEUTRON-001 to verify health after rollback

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (pre/post verification)
- OPS-NEUTRON-006: Troubleshooting Common Failures (connectivity issues)
- OPS-NOVA-008: Live Migration (instances on modified networks)
- OpenStack Neutron Networks Guide: https://docs.openstack.org/neutron/2024.2/admin/intro-os-networking.html
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-009: Floating IP Management

```
PROCEDURE ID: OPS-NEUTRON-009
TITLE: Floating IP Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Allocate, assign, release, and troubleshoot floating IPs for external connectivity. Includes NAT verification, external connectivity testing, and floating IP pool management. Execute when instances need external access or when floating IPs are not functioning correctly.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Provider network (external) exists with available allocation pool
4. Router has external gateway set to the provider network
5. Neutron agents are alive (confirm with OPS-NEUTRON-001)

### SAFETY CONSIDERATIONS

- Allocating a floating IP consumes an IP from the provider pool -- pools have finite capacity
- Assigning a floating IP creates NAT rules immediately -- external traffic can reach the instance
- Releasing a floating IP removes external access immediately
- Floating IPs are project-scoped -- ensure the correct project context

### PROCEDURE

Step 1: Verify the provider network and allocation pool.

```bash
openstack network show provider-net -c id -c status
openstack subnet show provider-subnet -c allocation_pools
```

Expected result: Provider network is ACTIVE and subnet has available IPs in the allocation pool.

If unexpected: If the allocation pool is exhausted, extend it: `openstack subnet set provider-subnet --allocation-pool start=<new-start>,end=<new-end>`.

**Allocate and Assign:**

Step 2: Allocate a floating IP from the provider network.

```bash
openstack floating ip create provider-net
```

Expected result: Floating IP created with status DOWN (not yet assigned).

If unexpected: If allocation fails with "No more IP addresses available," the pool is exhausted. Release unused floating IPs or expand the pool.

Step 3: Assign the floating IP to an instance.

```bash
openstack server add floating ip <instance-name> <floating-ip-address>
```

Expected result: Floating IP assigned and status changes to ACTIVE.

If unexpected: If assignment fails, verify the instance has a port on a network connected to a router with the provider network as its gateway.

Step 4: Verify external connectivity.

```bash
ping -c 3 <floating-ip-address>
```

Expected result: ICMP replies received (assuming security group allows ICMP).

If unexpected: If no reply, check security groups allow ICMP: `openstack security group rule list default | grep icmp`. Also verify the router gateway and NAT rules (see Troubleshoot section below).

**Release:**

Step 5: Disassociate the floating IP from the instance.

```bash
openstack server remove floating ip <instance-name> <floating-ip-address>
```

Expected result: Floating IP disassociated, status returns to DOWN.

If unexpected: If disassociation fails, the port may have been deleted. Force-release: `openstack floating ip set --port "" <floating-ip-id>`.

Step 6: Release the floating IP back to the pool.

```bash
openstack floating ip delete <floating-ip-address>
```

Expected result: Floating IP released and returned to the allocation pool.

If unexpected: If deletion fails with "in use" error, ensure the IP is disassociated first (Step 5).

**Troubleshoot NAT Issues:**

Step 7: Verify NAT rules for the floating IP.

```bash
# OVS backend:
ROUTER_ID=$(openstack router list -f value -c ID | head -1)
docker exec neutron_l3_agent ip netns exec qrouter-$ROUTER_ID iptables -t nat -L -n -v | grep <floating-ip>

# OVN backend:
docker exec ovn_northd ovn-nbctl lr-nat-list <router-name>
```

Expected result: DNAT rule mapping the floating IP to the instance fixed IP, and SNAT rule for outbound traffic.

If unexpected: If NAT rules are missing, restart the L3 agent (OVS) or verify the OVN logical router configuration.

Step 8: Verify external bridge connectivity.

```bash
docker exec openvswitch_vswitchd ovs-vsctl show | grep -A5 br-ex
```

Expected result: `br-ex` bridge has the physical external interface as a port.

If unexpected: If the external interface is not attached to `br-ex`, external traffic cannot reach the floating IPs. Reattach: `docker exec openvswitch_vswitchd ovs-vsctl add-port br-ex <interface>`.

Step 9: Verify ARP for the floating IP.

```bash
arping -I <external-interface> <floating-ip-address> -c 3
```

Expected result: ARP replies received from the router namespace MAC.

If unexpected: If no ARP replies, the L3 agent/OVN is not advertising the floating IP. Restart the agent and check logs.

### VERIFICATION

1. Confirm floating IP allocated: `openstack floating ip show <ip>` returns the IP details
2. Confirm assignment: `openstack floating ip show <ip> -c fixed_ip_address` shows the instance fixed IP
3. Confirm external connectivity: `ping -c 1 <floating-ip>` succeeds
4. Confirm release: `openstack floating ip show <ip>` returns "No floating IP found" after deletion

### ROLLBACK

1. If a floating IP was incorrectly assigned: `openstack server remove floating ip <instance> <ip>`
2. If a floating IP was accidentally released: allocate a new one and reassign (the specific IP may not be recoverable)
3. If NAT rules were manually modified: restart the L3 agent to regenerate: `docker restart neutron_l3_agent`

### REFERENCES

- OPS-NEUTRON-001: Service Health Check (prerequisite)
- OPS-NEUTRON-006: Troubleshooting Common Failures (floating IP diagnostics)
- OPS-NEUTRON-008: Network Topology Changes (router gateway configuration)
- OpenStack Floating IPs: https://docs.openstack.org/neutron/2024.2/admin/intro-os-networking.html#floating-ips
- SP-6105 SS 5.4-5.5: Operations and Sustainment
- NPR 7123.1 SS 3.2 Process 9: Product Transition

---

## OPS-NEUTRON-010: Security Group Audit

```
PROCEDURE ID: OPS-NEUTRON-010
TITLE: Security Group Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Perform a comprehensive audit of all security groups and rules across all projects. Identify overly permissive rules, verify default security group settings, document exceptions, and produce an audit report. Execute monthly as part of the security compliance cycle or after any security incident.

### PRECONDITIONS

1. OpenStack cloud is deployed and operational
2. Operator has admin credentials sourced
3. Security policy document specifying allowed ingress/egress rules available
4. Previous audit report available for comparison (if not the first audit)

### SAFETY CONSIDERATIONS

- This is a read-only audit procedure with no risk of data loss
- Do not modify security groups during the audit -- document findings for scheduled remediation
- Security group rule changes take effect immediately and can disrupt instance connectivity

### PROCEDURE

Step 1: List all security groups across all projects.

```bash
openstack security group list --all-projects -c ID -c Name -c Project
```

Expected result: Complete list of security groups with project assignments.

If unexpected: If `--all-projects` fails, verify admin privileges with `openstack role assignment list --user $(openstack token issue -f value -c user_id)`.

Step 2: Export all security group rules for analysis.

```bash
AUDIT_DIR="/tmp/sg_audit_$(date +%Y%m%d)"
mkdir -p "$AUDIT_DIR"
for sg in $(openstack security group list --all-projects -f value -c ID); do
  openstack security group rule list "$sg" -f json > "$AUDIT_DIR/sg_${sg}.json"
done
```

Expected result: JSON files for each security group saved in the audit directory.

If unexpected: API rate limiting may slow the export. Add a `sleep 1` between requests if needed.

Step 3: Identify rules allowing unrestricted ingress.

```bash
for f in "$AUDIT_DIR"/sg_*.json; do
  python3 -c "
import json, sys
with open('$f') as fh:
    rules = json.load(fh)
for r in rules:
    remote = r.get('IP Range', '')
    if remote == '0.0.0.0/0' and r.get('Direction') == 'ingress':
        proto = r.get('IP Protocol', 'any')
        port = r.get('Port Range', 'any')
        print(f'FINDING: {sys.argv[1]} - ingress {proto}:{port} from 0.0.0.0/0')
" "$(basename $f .json)"
done
```

Expected result: Only documented exceptions (e.g., web servers on port 80/443) allow 0.0.0.0/0 ingress.

If unexpected: Undocumented permissive rules should be flagged for remediation.

Step 4: Verify default security group settings for each project.

```bash
for project in $(openstack project list -f value -c ID); do
  echo "=== Project: $project ==="
  openstack security group rule list default --project "$project" -f value \
    -c Direction -c "IP Protocol" -c "Port Range" -c "IP Range" 2>/dev/null
done
```

Expected result: Default security groups follow organizational policy -- typically deny all ingress (except from same group) and allow all egress.

If unexpected: Modified default security groups should be documented and reviewed.

Step 5: Identify security groups with no rules (empty groups).

```bash
for sg in $(openstack security group list --all-projects -f value -c ID); do
  count=$(openstack security group rule list "$sg" -f value | wc -l)
  if [ "$count" -eq 0 ]; then
    name=$(openstack security group show "$sg" -f value -c name)
    echo "FINDING: Empty security group: $name ($sg)"
  fi
done
```

Expected result: No orphaned empty security groups (except default egress-only groups).

If unexpected: Empty security groups may indicate abandoned resources. Schedule cleanup if no instances use them.

Step 6: Check for security groups not associated with any port.

```bash
for sg in $(openstack security group list --all-projects -f value -c ID); do
  port_count=$(openstack port list --all-projects --security-group "$sg" -f value | wc -l)
  if [ "$port_count" -eq 0 ]; then
    name=$(openstack security group show "$sg" -f value -c name)
    echo "INFO: Unused security group: $name ($sg) - no ports assigned"
  fi
done
```

Expected result: Unused security groups are documented.

If unexpected: Unused groups may be intentionally kept as templates. Confirm with project owners before cleanup.

Step 7: Document audit findings.

```bash
echo "=== Security Group Audit Report ===" > "$AUDIT_DIR/audit_report.txt"
echo "Date: $(date)" >> "$AUDIT_DIR/audit_report.txt"
echo "Total security groups: $(openstack security group list --all-projects -f value | wc -l)" >> "$AUDIT_DIR/audit_report.txt"
echo "" >> "$AUDIT_DIR/audit_report.txt"
echo "Findings:" >> "$AUDIT_DIR/audit_report.txt"
# Append findings from Steps 3-6
```

Expected result: Audit report file created with all findings documented.

If unexpected: If any step failed, note it in the report and schedule a follow-up.

### VERIFICATION

1. Confirm audit report generated: `ls -la "$AUDIT_DIR/audit_report.txt"`
2. Confirm all security groups audited: count of JSON files matches count of security groups
3. Confirm no unauthorized permissive rules exist (or all are documented exceptions)
4. Confirm default security groups follow organizational policy

### ROLLBACK

This is a read-only audit procedure. No rollback is required. Remediation of findings should follow a separate change control process.

### REFERENCES

- OPS-NEUTRON-007: Security Audit (broader security audit including network isolation)
- OPS-KEYSTONE-007: Keystone Security Audit (identity and access review)
- OpenStack Security Groups: https://docs.openstack.org/neutron/2024.2/admin/archives/config-security.html
- OpenStack Security Guide: https://docs.openstack.org/security-guide/networking.html
- SP-6105 SS 5.5: Product Transition -- Security Compliance
- NPR 7123.1 SS 3.2 Process 9: Product Transition
