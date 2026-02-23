RUNBOOK: RB-KOLLA-001 -- Container Service Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Kolla-Ansible managed host
2. Docker CLI available (`docker ps`)
3. Kolla-Ansible installed in virtual environment (`/opt/kolla-venv/`)
4. Inventory file available (`/etc/kolla/all-in-one` or `/etc/kolla/multinode`)
5. Knowledge of the affected service container name

## PROCEDURE

Step 1: Identify crashed or restarting containers
```bash
# List all Kolla containers with their status
docker ps -a --filter label=kolla_role --format "table {{.Names}}\t{{.Status}}\t{{.State}}"

# Find containers in restart loops
docker ps -a --filter label=kolla_role --filter status=restarting --format "{{.Names}}"

# Find recently exited containers
docker ps -a --filter label=kolla_role --filter status=exited --format "table {{.Names}}\t{{.Status}}"
```
Expected: One or more containers showing `Exited`, `Restarting`, or `Up X seconds` (rapid restarts)
If not: If all containers are healthy, the issue may be at the application level rather than container level

Step 2: Retrieve logs from the failed container
```bash
# Current container logs
docker logs <container_name> --tail 100

# If the container keeps restarting, capture logs before restart
docker logs <container_name> 2>&1 | tail -100

# Check for repeated error patterns
docker logs <container_name> 2>&1 | grep -i "error\|fatal\|exception" | tail -20
```
Expected: Logs reveal the specific error causing the crash (config error, dependency failure, permission issue, OOM)
If not: If logs are empty, the container may be crashing before the service starts. Check Docker events: `docker events --filter container=<container_name> --since 10m`

Step 3: Inspect container configuration
```bash
# Check container environment variables
docker inspect <container_name> --format '{{json .Config.Env}}' | python3 -m json.tool

# Check mounted volumes
docker inspect <container_name> --format '{{json .HostConfig.Binds}}' | python3 -m json.tool

# Check restart count
docker inspect <container_name> --format '{{.RestartCount}}'
```
Expected: Configuration shows correct mount paths and environment variables for the service
If not: If mounts or env vars are wrong, the container image may be corrupted. Re-pull images (Step 6).

Step 4: Check service configuration inside the container
```bash
# Verify the service config file is valid
docker exec <container_name> cat /etc/<service>/<service>.conf 2>/dev/null | head -20

# For containers that won't start, use docker cp to extract config
docker cp <container_name>:/etc/<service>/<service>.conf /tmp/debug-config.conf
cat /tmp/debug-config.conf
```
Expected: Configuration file is syntactically valid and contains correct values (database URL, RabbitMQ URL, Keystone endpoint)
If not: Config file may have a syntax error from a bad override. Check `/etc/kolla/config/<service>/`

Step 5: Restart the container
```bash
docker restart <container_name>

# Wait and check status
sleep 10
docker inspect --format '{{.State.Status}} (restarts: {{.RestartCount}})' <container_name>
```
Expected: Container starts and stays running (status `running`, restart count does not increase)
If not: Simple restart did not resolve the issue. Proceed to Step 6.

Step 6: Reconfigure the service via Kolla-Ansible
```bash
source /opt/kolla-venv/bin/activate
kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags <service>
```
Expected: Kolla-Ansible regenerates the container configuration and restarts the service
If not: If reconfigure fails, check for config override errors in `/etc/kolla/config/<service>/`

Step 7: Restore container from previous image tag (rollback)
```bash
# List available image tags
docker images | grep <service>

# If the current image is broken, re-pull the previous version
# Edit globals.yml to set openstack_release to the previous version
# Then re-deploy the specific service
kolla-ansible -i /etc/kolla/all-in-one deploy --tags <service>
```
Expected: Service container starts with the previous image version
If not: Check that the previous image is available in the registry: `docker pull <registry>/<namespace>/<service>:<previous-tag>`

Step 8: Verify service recovery
```bash
# Check container health
docker inspect --format '{{.State.Health.Status}}' <container_name>

# Check service registration
source /etc/kolla/admin-openrc.sh
openstack service list | grep <service-type>

# Test service functionality
openstack token issue      # If Keystone
openstack server list      # If Nova
openstack network list     # If Neutron
```
Expected: Container is healthy; service is registered; basic operations succeed
If not: Escalate -- the issue may require database recovery or full redeployment

## VERIFICATION

1. `docker ps --filter name=<container_name>` shows container running with `Up` status and no rapid restarts
2. `docker inspect --format '{{.State.Health.Status}}' <container_name>` returns `healthy`
3. Service-specific health check passes (API responds, agents report status)
4. No new errors in container logs: `docker logs <container_name> --since 5m 2>&1 | grep -c error` returns 0

## ROLLBACK

1. If the container was reconfigured, revert configuration changes:
   ```bash
   # Remove or fix config overrides
   ls /etc/kolla/config/<service>/
   # Revert changes and reconfigure
   kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags <service>
   ```
2. If the container image was changed, restore previous image:
   ```bash
   # Set openstack_release back to previous version in globals.yml
   kolla-ansible -i /etc/kolla/all-in-one deploy --tags <service>
   ```
3. Verify the service is operational after rollback

## RELATED RUNBOOKS

- RB-KOLLA-002: Service Reconfiguration Procedure -- for planned configuration changes
- RB-KOLLA-003: OpenStack Upgrade Procedure -- when container issues are caused by an upgrade
- RB-GENERAL-003: RabbitMQ Message Queue Recovery -- when container crashes are caused by message queue issues
- RB-GENERAL-004: MariaDB/MySQL Database Maintenance -- when container crashes are caused by database issues
