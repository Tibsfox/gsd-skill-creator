RUNBOOK: RB-KOLLA-002 -- Service Reconfiguration Procedure
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Kolla-Ansible managed host
2. Kolla-Ansible installed in virtual environment (`/opt/kolla-venv/`)
3. Inventory file available (`/etc/kolla/all-in-one` or `/etc/kolla/multinode`)
4. Current deployment is in a healthy state (all containers running)
5. Knowledge of the specific configuration changes to apply

## PROCEDURE

Step 1: Document current configuration before changes
```bash
# Back up current globals.yml
cp /etc/kolla/globals.yml /etc/kolla/globals.yml.backup.$(date +%Y%m%d)

# Back up service-specific overrides
cp -r /etc/kolla/config/ /etc/kolla/config.backup.$(date +%Y%m%d)

# Record current service status
source /etc/kolla/admin-openrc.sh
openstack service list > /tmp/pre-reconfig-services.txt
```
Expected: Backup files created; service list captured
If not: Ensure sufficient disk space and correct permissions

Step 2: Modify globals.yml (for global settings)
```bash
# Edit globals.yml for global configuration changes
vi /etc/kolla/globals.yml

# Common changes:
# - VIP address changes
# - TLS enablement/disablement
# - Service enablement/disablement
# - Network interface changes
# - Docker registry changes
```
Expected: globals.yml is modified with the desired changes
If not: Validate YAML syntax: `python3 -c "import yaml; yaml.safe_load(open('/etc/kolla/globals.yml'))"`

Step 3: Apply service-specific configuration overrides
```bash
# Create or modify override files in /etc/kolla/config/<service>/
mkdir -p /etc/kolla/config/<service>/

# Example: Nova CPU overcommit ratio
cat > /etc/kolla/config/nova/nova.conf << 'EOF'
[DEFAULT]
cpu_allocation_ratio = 16.0
ram_allocation_ratio = 1.5
EOF

# Example: Neutron MTU setting
cat > /etc/kolla/config/neutron/neutron.conf << 'EOF'
[DEFAULT]
global_physnet_mtu = 9000
EOF
```
Expected: Override files created in INI format with only the sections/keys to change
If not: Validate INI syntax -- ensure sections are bracketed `[section]` and key-value pairs use `=`

Step 4: Validate the configuration changes
```bash
# Validate globals.yml YAML syntax
python3 -c "import yaml; yaml.safe_load(open('/etc/kolla/globals.yml'))"

# Validate service config override syntax (INI format)
python3 -c "
import configparser
c = configparser.ConfigParser()
c.read('/etc/kolla/config/<service>/<config>.conf')
print('Sections:', c.sections())
"
```
Expected: No parsing errors; sections and keys are as intended
If not: Fix syntax errors before proceeding -- invalid configs will cause service failures

Step 5: Run reconfigure for the target service
```bash
source /opt/kolla-venv/bin/activate

# Reconfigure a specific service (faster, targeted)
kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags <service>

# Or reconfigure all services (slower, comprehensive)
kolla-ansible -i /etc/kolla/all-in-one reconfigure
```
Expected: Ansible playbook completes without errors; affected containers are restarted with new configuration
If not: Check Ansible output for the specific failure. Common issues: config syntax error, service dependency not running, Docker permission issue.

Step 6: Verify configuration was applied
```bash
# Check the specific config value inside the container
docker exec <container_name> grep <config_key> /etc/<service>/<service>.conf

# Verify container was restarted (StartedAt should be recent)
docker inspect --format '{{.State.StartedAt}}' <container_name>

# Verify service health
docker inspect --format '{{.State.Health.Status}}' <container_name>
```
Expected: Config value matches the override; container start time is recent; health is `healthy`
If not: If config was not applied, check that the override file path matches what Kolla-Ansible expects

Step 7: Test service functionality after reconfiguration
```bash
source /etc/kolla/admin-openrc.sh

# Service-specific verification
openstack token issue              # Keystone
openstack hypervisor list          # Nova
openstack network agent list       # Neutron
openstack volume service list      # Cinder
openstack image list               # Glance
openstack orchestration service list  # Heat
```
Expected: Service responds correctly with the new configuration active
If not: If service fails after reconfiguration, rollback (Step 8)

Step 8: Rollback if reconfiguration causes issues
```bash
# Revert globals.yml
cp /etc/kolla/globals.yml.backup.$(date +%Y%m%d) /etc/kolla/globals.yml

# Revert config overrides
rm -rf /etc/kolla/config/
cp -r /etc/kolla/config.backup.$(date +%Y%m%d) /etc/kolla/config/

# Re-run reconfigure with reverted settings
source /opt/kolla-venv/bin/activate
kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags <service>
```
Expected: Service returns to the pre-change configuration and works correctly
If not: Check if the backup files are intact and try a full reconfigure without --tags

## VERIFICATION

1. `docker inspect --format '{{.State.Health.Status}}' <container_name>` returns `healthy` for all affected containers
2. Configuration change is visible inside the container: `docker exec <container_name> grep <key> /etc/<service>/<service>.conf`
3. Service API responds correctly: service-specific health check passes
4. Compare with pre-reconfig state: `diff /tmp/pre-reconfig-services.txt <(openstack service list)`

## ROLLBACK

1. Restore globals.yml from backup:
   ```bash
   cp /etc/kolla/globals.yml.backup.<date> /etc/kolla/globals.yml
   ```
2. Restore config overrides from backup:
   ```bash
   cp -r /etc/kolla/config.backup.<date>/* /etc/kolla/config/
   ```
3. Re-run reconfigure:
   ```bash
   kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags <service>
   ```
4. Verify service returns to pre-change behavior

## RELATED RUNBOOKS

- RB-KOLLA-001: Container Service Recovery -- when reconfiguration causes container crashes
- RB-KOLLA-003: OpenStack Upgrade Procedure -- for version upgrades (more complex than reconfiguration)
- RB-GENERAL-002: Full Cloud Backup and Restore -- for backing up before major configuration changes
