RUNBOOK: RB-KOLLA-003 -- OpenStack Upgrade Procedure
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Kolla-Ansible managed host
2. Kolla-Ansible installed in virtual environment (`/opt/kolla-venv/`)
3. Current deployment is healthy (all services operational)
4. Backup of databases, passwords.yml, and configuration files completed (see RB-GENERAL-002)
5. New target OpenStack release version identified and validated for compatibility
6. Sufficient disk space for pulling new container images

## PROCEDURE

Step 1: Document current state
```bash
source /etc/kolla/admin-openrc.sh

# Record current service state
openstack service list > /backup/pre-upgrade-services.txt
openstack hypervisor list > /backup/pre-upgrade-hypervisors.txt
openstack network agent list > /backup/pre-upgrade-agents.txt
openstack versions show > /backup/pre-upgrade-versions.txt

# Record current container image tags
docker images --filter label=kolla_role --format "{{.Repository}}:{{.Tag}}" > /backup/pre-upgrade-images.txt
```
Expected: All state files captured for comparison after upgrade
If not: Resolve any service issues before proceeding with the upgrade

Step 2: Back up critical data
```bash
# Database backup
docker exec mariadb mysqldump --all-databases --single-transaction \
  > /backup/pre-upgrade-all-databases.sql

# Configuration backup
cp -r /etc/kolla/ /backup/pre-upgrade-kolla-config/

# Password backup (critical -- never regenerate without backup)
cp /etc/kolla/passwords.yml /backup/pre-upgrade-passwords.yml
```
Expected: Database dump, full config directory, and passwords.yml backed up
If not: Do NOT proceed without a successful database backup

Step 3: Update Kolla-Ansible to the target release
```bash
source /opt/kolla-venv/bin/activate

# Upgrade kolla-ansible package
pip install --upgrade 'kolla-ansible==<target-version>.*'

# Example: upgrading to 2024.2
# pip install --upgrade 'kolla-ansible==18.0.*'

# Update globals.yml with new release
# Edit /etc/kolla/globals.yml:
# openstack_release: "<new-release>"
```
Expected: kolla-ansible package updated; globals.yml reflects the new release
If not: Check Python dependency conflicts; consider creating a fresh virtual environment

Step 4: Generate new passwords (preserve existing)
```bash
# CRITICAL: Use --include-unset to only generate NEW passwords
# Never run plain kolla-genpwd -- it overwrites ALL passwords!
kolla-genpwd --include-unset
```
Expected: Only passwords for new services added in the target release are generated; existing passwords preserved
If not: If passwords were accidentally overwritten, restore from backup: `cp /backup/pre-upgrade-passwords.yml /etc/kolla/passwords.yml`

Step 5: Pull new container images
```bash
kolla-ansible -i /etc/kolla/all-in-one pull
```
Expected: All container images for enabled services are downloaded with the new release tag
If not: Check Docker registry connectivity and disk space. Retry failed pulls: `docker pull <image>:<tag>`

Step 6: Execute the upgrade
```bash
kolla-ansible -i /etc/kolla/all-in-one upgrade
```
Expected: Upgrade proceeds in dependency order: infrastructure (MariaDB, RabbitMQ) first, then services. Each service is stopped, database migrations run, then restarted with new images. Duration: 20-60 minutes depending on services and database size.
If not: If upgrade fails mid-process, check the specific service that failed: `docker logs <service_name>`. See Step 8 for rollback.

Step 7: Post-upgrade verification
```bash
source /etc/kolla/admin-openrc.sh

# Verify all services are running
openstack service list
openstack endpoint list

# Verify API versions match target release
openstack versions show

# Compare with pre-upgrade state
diff /backup/pre-upgrade-services.txt <(openstack service list)
diff /backup/pre-upgrade-hypervisors.txt <(openstack hypervisor list)
diff /backup/pre-upgrade-agents.txt <(openstack network agent list)

# Verify container image tags
docker images --filter label=kolla_role --format "{{.Repository}}:{{.Tag}}" | head -10

# Test basic operations
openstack token issue
openstack server list
openstack network list
openstack volume list
```
Expected: All services operational; API versions match target release; basic operations succeed
If not: If specific services failed, try reconfiguring them individually: `kolla-ansible -i /etc/kolla/all-in-one reconfigure --tags <service>`

Step 8: Rollback procedure (if upgrade fails)
```bash
# 1. Stop all Kolla containers
docker stop $(docker ps -q --filter label=kolla_role)

# 2. Restore database from backup
docker start mariadb
sleep 10
docker exec -i mariadb mysql < /backup/pre-upgrade-all-databases.sql

# 3. Restore configuration
cp -r /backup/pre-upgrade-kolla-config/* /etc/kolla/

# 4. Downgrade kolla-ansible
source /opt/kolla-venv/bin/activate
pip install 'kolla-ansible==<previous-version>.*'

# 5. Redeploy with previous version
kolla-ansible -i /etc/kolla/all-in-one deploy

# 6. Verify rollback
source /etc/kolla/admin-openrc.sh
openstack service list
```
Expected: Services return to pre-upgrade state with previous version
If not: Check database restoration -- ensure mariadb accepted the backup. Check image availability for the previous version.

## VERIFICATION

1. `openstack versions show` reports the target release version for all services
2. All containers running with correct image tags: `docker images --filter label=kolla_role --format "{{.Repository}}:{{.Tag}}"`
3. All service health checks pass (token issue, server list, network list, volume list)
4. Container health: `docker ps --filter label=kolla_role --format "table {{.Names}}\t{{.Status}}"` shows all containers healthy
5. No errors in service logs within 10 minutes of upgrade completion

## ROLLBACK

1. Stop all containers: `docker stop $(docker ps -q --filter label=kolla_role)`
2. Restore database: `docker exec -i mariadb mysql < /backup/pre-upgrade-all-databases.sql`
3. Restore configuration: `cp -r /backup/pre-upgrade-kolla-config/* /etc/kolla/`
4. Downgrade Kolla-Ansible: `pip install 'kolla-ansible==<previous-version>.*'`
5. Redeploy: `kolla-ansible -i /etc/kolla/all-in-one deploy`
6. Verify: `openstack service list` and basic operations succeed

## RELATED RUNBOOKS

- RB-KOLLA-001: Container Service Recovery -- when individual containers fail after upgrade
- RB-KOLLA-002: Service Reconfiguration Procedure -- for post-upgrade configuration adjustments
- RB-GENERAL-002: Full Cloud Backup and Restore -- for comprehensive pre-upgrade backup
- RB-GENERAL-004: MariaDB/MySQL Database Maintenance -- when database migration fails during upgrade
