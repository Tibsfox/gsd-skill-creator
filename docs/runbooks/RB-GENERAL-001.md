RUNBOOK: RB-GENERAL-001 -- Full Cloud Daily Health Check
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: both

## PRECONDITIONS

1. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
2. OpenStack CLI tools installed (`openstack`)
3. SSH or console access to all OpenStack hosts
4. All infrastructure containers are running (MariaDB, RabbitMQ, Memcached, HAProxy)

## PROCEDURE

Step 1: Verify Keystone (Identity) health
```bash
openstack token issue
openstack service list
openstack endpoint list --service keystone
```
Expected: Token issued successfully; all services registered; Keystone endpoints (admin, internal, public) present
If not: See RB-KEYSTONE-001 for token issuance failures; RB-KEYSTONE-002 for service catalog issues

Step 2: Verify Nova (Compute) health
```bash
openstack hypervisor list
openstack compute service list
openstack server list --all-projects --limit 5
```
Expected: Hypervisors show with state `up` and status `enabled`; compute services running; server list returns without error
If not: See RB-NOVA-001 for compute failures; RB-NOVA-002 for scheduling issues

Step 3: Verify Neutron (Networking) health
```bash
openstack network agent list
openstack network list
openstack router list
```
Expected: All network agents show `alive: True` and `admin_state_up: True`; networks and routers listed
If not: See RB-NEUTRON-001 for connectivity issues; RB-NEUTRON-002 for DHCP failures

Step 4: Verify Cinder (Block Storage) health
```bash
openstack volume service list
openstack volume list --all-projects --limit 5
openstack volume type list
```
Expected: Volume services show `State: up` and `Status: enabled`; volume operations accessible
If not: See RB-CINDER-001 for volume creation failures; RB-CINDER-003 for backend connectivity

Step 5: Verify Glance (Image Service) health
```bash
openstack image list --limit 5
```
Expected: Image list returns without error; at least one image (e.g., cirros) is available
If not: See RB-GLANCE-001 for image upload failures

Step 6: Verify Swift (Object Storage) health
```bash
openstack object store account show
docker exec swift_object_server swift-recon --replication 2>/dev/null
```
Expected: Account shows container/object counts; replication timestamps are recent
If not: See RB-SWIFT-001 for access issues; RB-SWIFT-002 for replication problems

Step 7: Verify Heat (Orchestration) health
```bash
openstack orchestration service list
openstack stack list --limit 5
```
Expected: Heat engine shows status `up`; stack list returns without error
If not: See RB-HEAT-001 for stack creation failures

Step 8: Verify Horizon (Dashboard) health
```bash
curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/
docker inspect --format '{{.State.Health.Status}}' horizon 2>/dev/null
```
Expected: HTTP 200 response; container health is `healthy`
If not: See RB-HORIZON-001 for dashboard access issues

Step 9: Check infrastructure services
```bash
# MariaDB
docker exec mariadb mysql -e "SHOW STATUS LIKE 'Threads_connected';" 2>/dev/null

# RabbitMQ
docker exec rabbitmq rabbitmqctl cluster_status 2>/dev/null | head -10

# Memcached
docker exec memcached sh -c 'echo "stats" | nc localhost 11211 | grep curr_items' 2>/dev/null

# HAProxy
docker inspect --format '{{.State.Health.Status}}' haproxy 2>/dev/null
```
Expected: MariaDB shows active connections; RabbitMQ cluster is running; Memcached shows session count; HAProxy is healthy
If not: See RB-GENERAL-003 for RabbitMQ; RB-GENERAL-004 for MariaDB

Step 10: Check system resources
```bash
# Disk utilization (alert if >80%)
df -h / /var/lib/docker 2>/dev/null

# Memory utilization
free -h

# CPU load
uptime

# Check for any OOM kills in the last 24 hours
dmesg -T 2>/dev/null | grep -i "out of memory\|oom" | tail -5
```
Expected: Disk below 80%; memory has adequate free space; load average below CPU count; no OOM events
If not: Address resource constraints before they cause service failures

Step 11: Review recent error logs
```bash
# Check for errors across all service logs in the last 24 hours
for service in keystone nova neutron cinder glance heat; do
  count=$(grep -c "ERROR" /var/log/kolla/$service/*.log 2>/dev/null | awk -F: '{s+=$2}END{print s+0}')
  echo "$service: $count errors in last logs"
done
```
Expected: Error counts are low and stable (no sudden spikes)
If not: Investigate services with high error counts using service-specific runbooks

## VERIFICATION

1. All 8 OpenStack services respond to health check commands without errors
2. All network agents are alive and admin-state up
3. Infrastructure services (MariaDB, RabbitMQ, Memcached, HAProxy) are running and healthy
4. System resources are within acceptable thresholds (disk <80%, memory available, no OOM)
5. No unexpected error spikes in service logs

## ROLLBACK

N/A -- This is a read-only health check procedure. No system state is modified. If issues are found, follow the referenced service-specific runbooks for remediation.

## RELATED RUNBOOKS

- RB-KEYSTONE-001: Token Issuance and Authentication -- for Keystone failures found during health check
- RB-NOVA-001: Instance Launch Failure -- for Nova issues found during health check
- RB-NEUTRON-001: Network Connectivity Troubleshooting -- for Neutron issues found during health check
- RB-CINDER-001: Volume Creation Failure -- for Cinder issues found during health check
- RB-SWIFT-002: Replication Status Verification -- for Swift replication issues found during health check
- RB-HORIZON-001: Dashboard Access Recovery -- for Horizon access issues found during health check
- RB-GENERAL-003: RabbitMQ Message Queue Recovery -- for RabbitMQ issues found during health check
- RB-GENERAL-004: MariaDB/MySQL Database Maintenance -- for database issues found during health check
