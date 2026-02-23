RUNBOOK: RB-GENERAL-003 -- RabbitMQ Message Queue Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the RabbitMQ host
2. Docker CLI available on the host
3. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
4. Knowledge of the symptoms (service communication failures, message buildup, connection errors)

## PROCEDURE

Step 1: Check RabbitMQ container status
```bash
docker ps --filter name=rabbitmq
docker inspect --format '{{.State.Status}} (restarts: {{.RestartCount}})' rabbitmq
```
Expected: Container is running with low restart count
If not: If container is stopped, start it: `docker start rabbitmq`. If restarting repeatedly, check logs (Step 2).

Step 2: Check RabbitMQ cluster status
```bash
docker exec rabbitmq rabbitmqctl cluster_status
```
Expected: Output shows the cluster is operational with all expected nodes listed and running. Disk free space is above the watermark. File descriptors and sockets are within limits.
If not: If cluster is partitioned or nodes are missing, proceed to Step 5 for recovery.

Step 3: Check queue lengths and consumer status
```bash
# List all queues with message counts
docker exec rabbitmq rabbitmqctl list_queues name messages consumers

# Find queues with high message counts (potential stuck consumers)
docker exec rabbitmq rabbitmqctl list_queues name messages consumers | awk '$2 > 100 {print}'
```
Expected: Most queues have 0 or low message counts with active consumers
If not: High message counts indicate stuck consumers or overwhelmed services. Identify the affected service by queue name prefix (e.g., `nova`, `neutron`, `cinder`).

Step 4: Check connections from OpenStack services
```bash
# List all connections
docker exec rabbitmq rabbitmqctl list_connections name state | head -20

# Count connections by state
docker exec rabbitmq rabbitmqctl list_connections state | sort | uniq -c
```
Expected: Connections show `running` state; connection count matches expected services
If not: If connections are blocked or missing, the service may have lost its RabbitMQ connection. Restart the affected service.

Step 5: Identify and fix stuck consumers
```bash
# List consumers for a specific queue
docker exec rabbitmq rabbitmqctl list_consumers

# If a queue has messages but no consumers, restart the consuming service
# Queue name prefix identifies the service:
# - compute.* -> nova_compute
# - conductor.* -> nova_conductor
# - scheduler.* -> nova_scheduler, neutron_server
# - dhcp_agent.* -> neutron_dhcp_agent
# - l3_agent.* -> neutron_l3_agent
docker restart <service_container>
```
Expected: After service restart, consumers reconnect and begin processing messages
If not: Check the service logs for connection errors: `docker logs <service_container> --tail 50`

Step 6: Clear stuck messages (if queue is unrecoverable)
```bash
# Purge a specific queue (DESTRUCTIVE -- messages will be lost)
docker exec rabbitmq rabbitmqctl purge_queue <queue_name>

# After purging, restart the producing and consuming services
docker restart <producer_service> <consumer_service>
```
Expected: Queue is emptied; services reconnect and resume normal operation
If not: If the queue refills immediately, the producing service may be in an error loop. Check its logs.

Step 7: Restart RabbitMQ container (if cluster is unhealthy)
```bash
# Stop RabbitMQ gracefully
docker stop rabbitmq

# Wait for clean shutdown
sleep 10

# Start RabbitMQ
docker start rabbitmq

# Wait for node to rejoin cluster
sleep 30

# Verify cluster status
docker exec rabbitmq rabbitmqctl cluster_status
```
Expected: RabbitMQ starts cleanly and rejoins the cluster
If not: If RabbitMQ cannot start, proceed to Step 8

Step 8: Restore RabbitMQ database from backup (last resort)
```bash
# Stop RabbitMQ
docker stop rabbitmq

# Reset the Mnesia database (DESTRUCTIVE -- all queue state is lost)
docker exec rabbitmq rabbitmqctl reset

# Start RabbitMQ
docker start rabbitmq

# Reconfigure via Kolla-Ansible to restore users and vhosts
source /opt/kolla-venv/bin/activate
kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags rabbitmq

# Restart all OpenStack services to reconnect
docker restart $(docker ps -q --filter label=kolla_role --filter name=nova)
docker restart $(docker ps -q --filter label=kolla_role --filter name=neutron)
docker restart $(docker ps -q --filter label=kolla_role --filter name=cinder)
docker restart $(docker ps -q --filter label=kolla_role --filter name=heat)
docker restart $(docker ps -q --filter label=kolla_role --filter name=glance)
```
Expected: RabbitMQ is reset with clean state; services reconnect and rebuild queues
If not: Full redeployment may be required: `kolla-ansible -i /etc/kolla/all-in-one deploy`

Step 9: Verify service reconnection
```bash
source /etc/kolla/admin-openrc.sh

# Test each service that uses RabbitMQ
openstack token issue
openstack server list --limit 1
openstack network list --limit 1
openstack volume list --limit 1

# Verify message flow by creating and deleting a test resource
openstack network create test-rabbitmq-verify
openstack network delete test-rabbitmq-verify
```
Expected: All API calls succeed; resource creation triggers message flow through RabbitMQ
If not: Check individual service logs for RabbitMQ connection errors

## VERIFICATION

1. `docker exec rabbitmq rabbitmqctl cluster_status` shows healthy cluster
2. `docker exec rabbitmq rabbitmqctl list_queues name messages | awk '$2 > 100'` returns no results (no queue backlog)
3. All OpenStack services can communicate through RabbitMQ (API calls succeed)
4. No `connection refused` or `channel closed` errors in service logs

## ROLLBACK

1. If RabbitMQ was reset, Kolla-Ansible reconfigure restores the expected configuration:
   ```bash
   kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags rabbitmq
   ```
2. If queues were purged, there is no rollback -- messages are permanently lost. Services will regenerate necessary state.
3. If the entire RabbitMQ state is unrecoverable, full redeploy restores function:
   ```bash
   kolla-ansible -i /etc/kolla/all-in-one deploy
   ```

## RELATED RUNBOOKS

- RB-KOLLA-001: Container Service Recovery -- when RabbitMQ container keeps crashing
- RB-GENERAL-001: Full Cloud Daily Health Check -- includes RabbitMQ as part of infrastructure checks
- RB-GENERAL-004: MariaDB/MySQL Database Maintenance -- for the other critical infrastructure service
- RB-NOVA-001: Instance Launch Failure -- when launch fails due to message queue issues
