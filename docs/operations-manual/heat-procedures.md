# Heat Orchestration Service -- Operations Procedures

Operations procedures for the OpenStack Heat orchestration service following NASA procedure format per SP-6105 SS 5.5 (Product Transition) and NPR 7123.1 SS 3.2 Process 9 (Product Transition).

Heat provides infrastructure-as-code through HOT (Heat Orchestration Template) files, managing cloud resources as atomic stacks with dependency ordering, rollback on failure, and lifecycle management.

## Table of Contents

- [OPS-HEAT-001: Service Health Check](#ops-heat-001-service-health-check)
- [OPS-HEAT-002: Configuration Verification](#ops-heat-002-configuration-verification)
- [OPS-HEAT-003: Backup and Restore](#ops-heat-003-backup-and-restore)
- [OPS-HEAT-004: Minor Upgrade](#ops-heat-004-minor-upgrade)
- [OPS-HEAT-005: Major Upgrade](#ops-heat-005-major-upgrade)
- [OPS-HEAT-006: Troubleshooting Common Failures](#ops-heat-006-troubleshooting-common-failures)
- [OPS-HEAT-007: Security Audit](#ops-heat-007-security-audit)
- [OPS-HEAT-008: Stack Template Validation](#ops-heat-008-stack-template-validation)
- [OPS-HEAT-009: Resource Dependency Analysis](#ops-heat-009-resource-dependency-analysis)
- [OPS-HEAT-010: Orphan Cleanup](#ops-heat-010-orphan-cleanup)

---

## OPS-HEAT-001: Service Health Check

```
PROCEDURE ID: OPS-HEAT-001
TITLE: Heat Orchestration Service Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Verify that the Heat orchestration service is fully operational, all containers are running, the API is responsive, and stack operations function correctly. Execute daily or after any infrastructure change that may affect the orchestration service.

### PRECONDITIONS

1. OpenStack control plane is running and accessible
2. Keystone authentication is functional (see OPS-KEYSTONE-001)
3. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
4. Docker daemon is running on the control node

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any service state
- API queries generate minimal load on the Heat engine
- If the service is unhealthy, do not attempt stack operations until the issue is resolved

### PROCEDURE

Step 1: Verify Heat containers are running.

```bash
docker ps --filter name=heat --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected result: Three containers are listed -- `heat_api`, `heat_api_cfn`, and `heat_engine` -- all showing status "Up" with uptime.

If unexpected: If any container is missing or shows "Restarting", check container logs:

```bash
docker logs heat_api --tail 50
docker logs heat_engine --tail 50
```

Step 2: Verify Heat service registration in the Keystone catalog.

```bash
openstack service list | grep orchestration
```

Expected result: A row showing service type `orchestration` with name `heat`.

If unexpected: If the orchestration service is not listed, re-run `kolla-ansible post-deploy` to register Heat endpoints. See OPS-KEYSTONE-001 for catalog verification.

Step 3: Verify Heat engine status.

```bash
openstack orchestration service list
```

Expected result: One or more engines listed with status `up` and a recent `updated_at` timestamp (within the last few minutes).

If unexpected: If engines show status `down` or the `updated_at` timestamp is stale, restart the Heat engine container:

```bash
docker restart heat_engine
```

Wait 30 seconds and re-check.

Step 4: Verify stack operations are functional by listing existing stacks.

```bash
openstack stack list
```

Expected result: A table of stacks (possibly empty if no stacks exist) with no error messages. The command completes without timeout or authentication errors.

If unexpected: If the command returns an authentication error, verify Keystone credentials are valid (see OPS-KEYSTONE-001). If the command times out, check Heat API container logs:

```bash
docker logs heat_api --tail 50
```

Step 5: Check Heat logs for errors.

```bash
docker logs heat_api --tail 100 2>&1 | grep -i "error\|exception\|traceback"
docker logs heat_engine --tail 100 2>&1 | grep -i "error\|exception\|traceback"
```

Expected result: No critical errors or unhandled exceptions in recent logs.

If unexpected: Record the error messages and consult OPS-HEAT-006 for troubleshooting common failures.

### VERIFICATION

1. Confirm all three Heat containers are running: `docker ps --filter name=heat | wc -l` returns 4 (header + 3 containers)
2. Confirm Heat engine reports status `up`: `openstack orchestration service list --format value -c Status` returns `up`
3. Confirm stack list command completes without error: `openstack stack list -f json` returns valid JSON

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (authentication dependency)
- OpenStack Heat Administration Guide: https://docs.openstack.org/heat/2024.2/admin/
- SP-6105 SS 5.4: Operations and Sustainment -- system health monitoring
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- operational readiness verification

---

## OPS-HEAT-002: Configuration Verification

```
PROCEDURE ID: OPS-HEAT-002
TITLE: Heat Configuration Verification
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm that Heat configuration settings match the expected state after deployment, reconfiguration, or upgrade. Verify stack domain user configuration, convergence engine settings, and template version support. Execute after any configuration change to globals.yml or Heat-specific settings.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. Access to the Kolla-Ansible configuration directory (`/etc/kolla/`)
4. Previous configuration baseline is available for comparison

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify configuration
- Comparing live configuration against expected values may reveal security-sensitive settings (passwords, tokens)
- Do not copy configuration output to insecure locations

### PROCEDURE

Step 1: Verify Heat is enabled in globals.yml.

```bash
docker exec heat_api grep -E "^enable_heat" /etc/kolla/globals.yml 2>/dev/null || grep -E "^enable_heat" /etc/kolla/globals.yml
```

Expected result: `enable_heat: "yes"`

If unexpected: If Heat is not enabled, edit `/etc/kolla/globals.yml` and set `enable_heat: "yes"`, then run `kolla-ansible reconfigure --tags heat`.

Step 2: Verify Heat stack domain user configuration.

```bash
docker exec heat_api cat /etc/heat/heat.conf | grep -A5 "\[DEFAULT\]" | grep stack_user_domain_name
docker exec heat_api cat /etc/heat/heat.conf | grep -A5 "\[DEFAULT\]" | grep stack_domain_admin
```

Expected result: `stack_user_domain_name` is set to `heat` (or the configured domain name). `stack_domain_admin` is set to `heat_domain_admin`.

If unexpected: The stack domain user may not have been created. Verify the domain exists:

```bash
openstack domain list | grep heat
openstack user list --domain heat | grep heat_domain_admin
```

If missing, re-run `kolla-ansible post-deploy`.

Step 3: Verify convergence engine settings.

```bash
docker exec heat_api cat /etc/heat/heat.conf | grep convergence_engine
```

Expected result: `convergence_engine = true` (default in recent releases).

If unexpected: If convergence engine is disabled, stack updates use the legacy engine which lacks atomic resource replacement. Enable by adding the setting to Heat configuration overrides and running `kolla-ansible reconfigure --tags heat`.

Step 4: Verify supported template versions.

```bash
openstack orchestration template version list
```

Expected result: A list of supported template versions including `heat_template_version: wallaby` (or later) and `heat_template_version: 2021-04-16` (or later date-based versions).

If unexpected: If template versions are limited, the Heat engine may be running an older release. Verify the container image version:

```bash
docker inspect heat_engine --format '{{.Config.Image}}'
```

Step 5: Verify Heat API endpoint configuration.

```bash
openstack endpoint list --service orchestration --interface public -f value -c URL
openstack endpoint list --service orchestration --interface internal -f value -c URL
```

Expected result: Both public and internal endpoints are listed with correct hostnames and port 8004.

If unexpected: If endpoints are missing or point to incorrect addresses, re-register them via `kolla-ansible post-deploy` or manually:

```bash
openstack endpoint create --region RegionOne orchestration public http://<public-vip>:8004/v1/%\(tenant_id\)s
```

### VERIFICATION

1. Confirm `enable_heat: "yes"` in globals.yml
2. Confirm stack domain user exists: `openstack user list --domain heat -f value -c Name` includes `heat_domain_admin`
3. Confirm template versions are available: `openstack orchestration template version list -f value | wc -l` returns at least 1
4. Confirm API endpoints exist: `openstack endpoint list --service orchestration -f value | wc -l` returns at least 2

### ROLLBACK

This procedure is read-only. No rollback required. If configuration was changed prior to this verification, rollback the configuration change using the backup taken before modification.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (endpoint and domain verification)
- OpenStack Heat Configuration Reference: https://docs.openstack.org/heat/2024.2/configuration/
- SP-6105 SS 5.5: Product Transition -- configuration management verification
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- configuration baseline verification

---

## OPS-HEAT-003: Backup and Restore

```
PROCEDURE ID: OPS-HEAT-003
TITLE: Heat Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Heat database, template repository, and stack definitions. Provide a verified restore procedure that confirms stack state integrity after restoration. Execute before upgrades, major configuration changes, or on a regular schedule.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. MariaDB/MySQL is accessible from the control node
4. Sufficient disk space for the backup (check with `df -h /backup/`)
5. Backup target directory exists and is writable

### SAFETY CONSIDERATIONS

- Database backups contain all stack definitions, resource states, and potentially sensitive parameter values
- Store backups in a secure location with restricted access
- Database export may cause brief increased load on MariaDB -- avoid running during peak stack operations
- Restore operations are destructive -- they replace the current database content with backup data

### PROCEDURE

**Part A: Backup**

Step 1: Record the current stack state for post-restore verification.

```bash
openstack stack list -f json > /backup/heat-stack-list-$(date +%Y%m%d).json
```

Expected result: A JSON file listing all current stacks with their IDs, names, and statuses.

If unexpected: If the command fails, check Heat API health (see OPS-HEAT-001).

Step 2: Export the Heat database.

```bash
docker exec mariadb mysqldump -u root -p$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}') heat > /backup/heat-db-$(date +%Y%m%d).sql
```

Expected result: A SQL dump file containing all Heat database tables and data.

If unexpected: If MariaDB is not accessible, verify the mariadb container is running:

```bash
docker ps --filter name=mariadb
```

Step 3: Backup Heat configuration files.

```bash
mkdir -p /backup/heat-config-$(date +%Y%m%d)
docker cp heat_api:/etc/heat/heat.conf /backup/heat-config-$(date +%Y%m%d)/heat.conf
docker cp heat_api:/etc/heat/api-paste.ini /backup/heat-config-$(date +%Y%m%d)/api-paste.ini
cp -r /etc/kolla/config/heat/ /backup/heat-config-$(date +%Y%m%d)/kolla-overrides/ 2>/dev/null || echo "No Kolla overrides found"
```

Expected result: Configuration files copied to the backup directory.

If unexpected: If the docker cp command fails, the container name may differ. Check: `docker ps --filter name=heat`.

Step 4: Export stack definitions for each active stack.

```bash
for stack_id in $(openstack stack list -f value -c ID); do
  openstack stack template show "$stack_id" > "/backup/heat-template-${stack_id}-$(date +%Y%m%d).yaml" 2>/dev/null
done
```

Expected result: One template file per active stack in the backup directory.

If unexpected: Some stacks in DELETE_FAILED or ERROR state may not have retrievable templates. This is expected.

Step 5: Verify backup integrity.

```bash
ls -la /backup/heat-db-$(date +%Y%m%d).sql
ls -la /backup/heat-stack-list-$(date +%Y%m%d).json
ls -la /backup/heat-config-$(date +%Y%m%d)/
```

Expected result: All backup files exist with non-zero sizes.

If unexpected: Re-run the failed backup step before proceeding.

**Part B: Restore**

Step 6: Stop Heat services before restoring the database.

```bash
docker stop heat_api heat_api_cfn heat_engine
```

Expected result: All three containers report "stopped".

If unexpected: If containers do not stop, force stop: `docker kill heat_api heat_api_cfn heat_engine`.

Step 7: Restore the Heat database from backup.

```bash
docker exec -i mariadb mysql -u root -p$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}') heat < /backup/heat-db-YYYYMMDD.sql
```

Expected result: Database import completes without errors.

If unexpected: If import fails with table-exists errors, drop and recreate the heat database first:

```bash
docker exec mariadb mysql -u root -p$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}') -e "DROP DATABASE heat; CREATE DATABASE heat;"
```

Then re-run the import.

Step 8: Restore Heat configuration files.

```bash
docker cp /backup/heat-config-YYYYMMDD/heat.conf heat_api:/etc/heat/heat.conf
docker cp /backup/heat-config-YYYYMMDD/api-paste.ini heat_api:/etc/heat/api-paste.ini
```

Expected result: Configuration files restored to the container.

If unexpected: If the container is stopped, configuration restore happens automatically on restart if Kolla-Ansible manages the configuration.

Step 9: Start Heat services.

```bash
docker start heat_engine heat_api heat_api_cfn
```

Expected result: All three containers start and show status "Up".

If unexpected: Check container logs: `docker logs heat_api --tail 50`.

Step 10: Verify stack state matches pre-backup snapshot.

```bash
openstack stack list -f json > /tmp/heat-stack-list-restored.json
diff <(jq -S . /backup/heat-stack-list-YYYYMMDD.json) <(jq -S . /tmp/heat-stack-list-restored.json)
```

Expected result: Stack list matches the pre-backup snapshot (same stacks, same statuses).

If unexpected: If stacks are missing or in different states, check the database import logs and Heat engine logs for migration or state reconciliation issues.

### VERIFICATION

1. Confirm database backup file exists and is non-empty: `test -s /backup/heat-db-$(date +%Y%m%d).sql && echo "OK"`
2. Confirm configuration backup exists: `test -f /backup/heat-config-$(date +%Y%m%d)/heat.conf && echo "OK"`
3. After restore, confirm Heat is operational: run OPS-HEAT-001 health check
4. After restore, confirm stack list matches pre-backup snapshot

### ROLLBACK

If restore fails and the database is corrupted:

1. Stop Heat services: `docker stop heat_api heat_api_cfn heat_engine`
2. Drop and recreate the database: `docker exec mariadb mysql -u root -p<password> -e "DROP DATABASE heat; CREATE DATABASE heat;"`
3. Re-import the backup: repeat Step 7
4. If backup itself is corrupted, redeploy Heat via `kolla-ansible deploy --tags heat`

### REFERENCES

- OPS-HEAT-001: Service Health Check (post-restore verification)
- OPS-KEYSTONE-001: Keystone Service Health Check (authentication dependency)
- OpenStack Heat Database Management: https://docs.openstack.org/heat/2024.2/admin/
- SP-6105 SS 5.4: Operations and Sustainment -- data protection and recovery
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- backup and recovery procedures

---

## OPS-HEAT-004: Minor Upgrade

```
PROCEDURE ID: OPS-HEAT-004
TITLE: Heat Minor Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a minor version update to the Heat orchestration service using Kolla-Ansible. Capture pre-upgrade stack state, execute the upgrade, and verify all stacks and template versions function correctly post-upgrade. Execute when a new minor release is available within the current OpenStack series.

### PRECONDITIONS

1. Heat service is healthy (see OPS-HEAT-001)
2. Full backup completed (see OPS-HEAT-003)
3. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
4. New container images are pulled and available locally
5. No stack operations are in progress (`openstack stack list` shows no IN_PROGRESS states)
6. Maintenance window is scheduled -- stack operations will be unavailable during upgrade

### SAFETY CONSIDERATIONS

- Stack operations are unavailable during the upgrade process
- In-progress stack operations may fail if the upgrade starts while they are running
- Database migrations may be applied -- ensure backup is verified before proceeding
- Rolling back a minor upgrade requires restoring from backup (see OPS-HEAT-003)

### PROCEDURE

Step 1: Capture pre-upgrade stack state.

```bash
openstack stack list -f json > /backup/heat-pre-upgrade-stacks-$(date +%Y%m%d).json
openstack orchestration service list -f json > /backup/heat-pre-upgrade-engines-$(date +%Y%m%d).json
openstack orchestration template version list -f json > /backup/heat-pre-upgrade-templates-$(date +%Y%m%d).json
```

Expected result: Three JSON files capturing current stacks, engine status, and supported template versions.

If unexpected: If any command fails, resolve the issue before proceeding with the upgrade.

Step 2: Verify no stack operations are in progress.

```bash
openstack stack list -f value -c "Stack Status" | grep -c "IN_PROGRESS"
```

Expected result: Output is `0` (no stacks in progress).

If unexpected: Wait for in-progress operations to complete before upgrading. Do not proceed with stacks in IN_PROGRESS state.

Step 3: Execute the Heat upgrade via Kolla-Ansible.

```bash
kolla-ansible upgrade --tags heat -i /etc/kolla/all-in-one
```

Expected result: Upgrade completes with "PLAY RECAP" showing `ok` and `changed` counts, zero failures.

If unexpected: If the upgrade fails, check the Ansible output for the specific failing task. Common issues: image pull failure (check registry connectivity), database migration error (check MariaDB logs). Restore from backup if necessary (see OPS-HEAT-003).

Step 4: Verify Heat containers are running with updated images.

```bash
docker ps --filter name=heat --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
```

Expected result: All three Heat containers running with new image tags.

If unexpected: If containers are not running, check Docker logs:

```bash
docker logs heat_api --tail 50
docker logs heat_engine --tail 50
```

Step 5: Verify post-upgrade stack list matches pre-upgrade state.

```bash
openstack stack list -f json > /tmp/heat-post-upgrade-stacks.json
diff <(jq -S '[.[] | {id: .ID, name: ."Stack Name", status: ."Stack Status"}]' /backup/heat-pre-upgrade-stacks-$(date +%Y%m%d).json) \
     <(jq -S '[.[] | {id: .ID, name: ."Stack Name", status: ."Stack Status"}]' /tmp/heat-post-upgrade-stacks.json)
```

Expected result: No differences -- all stacks present with same statuses.

If unexpected: Investigate missing or failed stacks. Check Heat engine logs for reconciliation errors.

Step 6: Verify template version support.

```bash
openstack orchestration template version list
```

Expected result: Template version list includes at least the same versions as pre-upgrade, potentially with new versions added.

If unexpected: If template versions are reduced, the upgrade may have regressed. Check the container image version is correct.

### VERIFICATION

1. Confirm Heat containers are running: `docker ps --filter name=heat | wc -l` returns 4
2. Confirm Heat engine is healthy: `openstack orchestration service list --format value -c Status` returns `up`
3. Confirm stack list matches pre-upgrade: no differences in stack names and statuses
4. Confirm template versions available: `openstack orchestration template version list -f value | wc -l` returns at least 1

### ROLLBACK

1. Stop Heat services: `docker stop heat_api heat_api_cfn heat_engine`
2. Restore from pre-upgrade backup: follow OPS-HEAT-003 Part B (Restore)
3. Redeploy previous Heat version: update Kolla-Ansible configuration to pin previous image tags
4. Run `kolla-ansible deploy --tags heat -i /etc/kolla/all-in-one`
5. Verify rollback: run OPS-HEAT-001

### REFERENCES

- OPS-HEAT-001: Service Health Check (post-upgrade verification)
- OPS-HEAT-003: Backup and Restore (pre-upgrade backup)
- OpenStack Heat Release Notes: https://docs.openstack.org/releasenotes/heat/
- SP-6105 SS 5.4: Operations and Sustainment -- system maintenance
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- upgrade procedures

---

## OPS-HEAT-005: Major Upgrade

```
PROCEDURE ID: OPS-HEAT-005
TITLE: Heat Major Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a major version upgrade to the Heat orchestration service (e.g., moving from one OpenStack release series to another). Includes extended pre-checks, database migration verification, template compatibility testing, and comprehensive post-upgrade validation. Execute when upgrading between OpenStack release series.

### PRECONDITIONS

1. Heat service is healthy (see OPS-HEAT-001)
2. Full backup completed and verified (see OPS-HEAT-003)
3. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
4. New container images for the target release are pulled and available
5. No stack operations are in progress
6. All dependent services (Keystone, Nova, Neutron, Cinder) are upgraded or compatible with the target release
7. Extended maintenance window scheduled -- stack operations will be unavailable for the duration
8. Release notes for the target version reviewed for deprecations and breaking changes

### SAFETY CONSIDERATIONS

- Major upgrades may include database schema migrations that are not reversible
- Template syntax deprecated in the new release may cause existing stacks to become unmanageable
- Resource type changes between releases may affect existing stack definitions
- If the upgrade fails mid-migration, manual database repair may be required
- Coordinate with OPS-NOVA, OPS-NEUTRON, OPS-CINDER upgrade schedules -- Heat orchestrates resources from these services

### PROCEDURE

Step 1: Perform extended pre-upgrade checks.

```bash
# Capture complete state
openstack stack list --all-projects -f json > /backup/heat-major-pre-upgrade-all-stacks-$(date +%Y%m%d).json
openstack orchestration service list -f json > /backup/heat-major-pre-upgrade-engines-$(date +%Y%m%d).json
openstack orchestration template version list -f json > /backup/heat-major-pre-upgrade-versions-$(date +%Y%m%d).json
openstack orchestration resource type list -f json > /backup/heat-major-pre-upgrade-resources-$(date +%Y%m%d).json
```

Expected result: Four JSON files capturing all stacks (across all projects), engine status, template versions, and available resource types.

If unexpected: Resolve any command failures before proceeding. Every pre-upgrade capture is essential for post-upgrade comparison.

Step 2: Verify no stacks are in transitional states.

```bash
openstack stack list --all-projects -f value -c "Stack Status" | grep -c "IN_PROGRESS\|FAILED"
```

Expected result: Output is `0` -- no stacks in progress or failed state.

If unexpected: Resolve failed stacks (see OPS-HEAT-006) and wait for in-progress operations before proceeding.

Step 3: Export templates for all stacks for compatibility testing.

```bash
mkdir -p /backup/heat-templates-pre-upgrade-$(date +%Y%m%d)
for stack_id in $(openstack stack list --all-projects -f value -c ID); do
  openstack stack template show "$stack_id" > "/backup/heat-templates-pre-upgrade-$(date +%Y%m%d)/${stack_id}.yaml" 2>/dev/null
done
```

Expected result: One template file per stack in the backup directory.

If unexpected: Some stacks in error states may not have retrievable templates. Log and continue.

Step 4: Create full database backup.

```bash
docker exec mariadb mysqldump -u root -p$(grep ^database_password /etc/kolla/passwords.yml | awk '{print $2}') --single-transaction heat > /backup/heat-major-db-$(date +%Y%m%d).sql
```

Expected result: SQL dump file created with non-zero size.

If unexpected: If database export fails, do not proceed with the upgrade.

Step 5: Execute the major upgrade.

```bash
kolla-ansible upgrade --tags heat -i /etc/kolla/all-in-one
```

Expected result: Upgrade completes with zero Ansible failures. Database migrations apply automatically.

If unexpected: If the upgrade fails:
1. Check the Ansible output for the specific failing task
2. Check Heat container logs: `docker logs heat_api --tail 100`
3. If database migration failed, check MariaDB logs: `docker logs mariadb --tail 100`
4. Do not re-run the upgrade without understanding the failure -- partial migrations may require manual intervention

Step 6: Verify database migrations completed.

```bash
docker exec heat_engine heat-manage db_version
```

Expected result: Database version matches the target release's expected migration version.

If unexpected: If the database version is incorrect, the migration may have failed. Check Heat engine logs for migration errors.

Step 7: Verify post-upgrade stack state.

```bash
openstack stack list --all-projects -f json > /tmp/heat-major-post-upgrade-stacks.json
diff <(jq -S '[.[] | {id: .ID, name: ."Stack Name", status: ."Stack Status"}]' /backup/heat-major-pre-upgrade-all-stacks-$(date +%Y%m%d).json) \
     <(jq -S '[.[] | {id: .ID, name: ."Stack Name", status: ."Stack Status"}]' /tmp/heat-major-post-upgrade-stacks.json)
```

Expected result: All stacks present with same statuses as pre-upgrade.

If unexpected: Investigate any missing or changed stacks. Some status changes may be expected if the upgrade triggers state reconciliation.

Step 8: Verify template version compatibility.

```bash
openstack orchestration template version list -f json > /tmp/heat-major-post-upgrade-versions.json
diff <(jq -S . /backup/heat-major-pre-upgrade-versions-$(date +%Y%m%d).json) <(jq -S . /tmp/heat-major-post-upgrade-versions.json)
```

Expected result: All previously supported template versions are still supported. New versions may be added.

If unexpected: If template versions were removed, existing stacks using those versions may become unmanageable. Check release notes for deprecated template versions.

Step 9: Verify resource type availability.

```bash
openstack orchestration resource type list -f json > /tmp/heat-major-post-upgrade-resources.json
diff <(jq -S . /backup/heat-major-pre-upgrade-resources-$(date +%Y%m%d).json) <(jq -S . /tmp/heat-major-post-upgrade-resources.json)
```

Expected result: All previously available resource types still exist. New types may be added.

If unexpected: If resource types were removed, stacks referencing them cannot be updated. Document removed types and assess impact on existing stacks.

### VERIFICATION

1. Confirm Heat containers are running with new images: `docker ps --filter name=heat --format "{{.Image}}"`
2. Confirm database migration version is correct: `docker exec heat_engine heat-manage db_version`
3. Confirm all stacks are present and in expected states
4. Confirm template version support includes previously supported versions
5. Confirm resource types include previously available types
6. Run OPS-HEAT-001 full health check

### ROLLBACK

1. Stop Heat services: `docker stop heat_api heat_api_cfn heat_engine`
2. Restore database from pre-upgrade backup: follow OPS-HEAT-003 Part B using the major upgrade backup
3. Restore previous container images: update Kolla-Ansible configuration to pin previous release images
4. Redeploy: `kolla-ansible deploy --tags heat -i /etc/kolla/all-in-one`
5. Verify rollback: run OPS-HEAT-001 and compare stack list against pre-upgrade snapshot
6. If database migration was partially applied and restore fails, contact database administrator for manual repair

### REFERENCES

- OPS-HEAT-001: Service Health Check (post-upgrade verification)
- OPS-HEAT-003: Backup and Restore (pre-upgrade backup)
- OPS-HEAT-008: Stack Template Validation (post-upgrade template testing)
- OPS-NOVA-005: Nova Major Upgrade (coordinate upgrade order)
- OPS-NEUTRON-005: Neutron Major Upgrade (coordinate upgrade order)
- OPS-CINDER-005: Cinder Major Upgrade (coordinate upgrade order)
- OpenStack Heat Release Notes: https://docs.openstack.org/releasenotes/heat/
- OpenStack Heat Upgrade Guide: https://docs.openstack.org/heat/2024.2/admin/upgrades.html
- SP-6105 SS 5.4: Operations and Sustainment -- major system maintenance
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- major upgrade procedures

---

## OPS-HEAT-006: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-HEAT-006
TITLE: Troubleshooting Common Heat Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Heat orchestration failures: stack create failures from resource dependency errors, stack update rollback failures, stuck stack deletes with nested stacks, Heat engine timeouts, and template validation errors. Use this procedure when stack operations fail or behave unexpectedly.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. Access to Heat container logs via Docker
4. Knowledge of the failing stack name or ID

### SAFETY CONSIDERATIONS

- Troubleshooting may require deleting resources that are in error state
- Force-deleting stacks removes resources without cleanup -- verify no critical resources will be lost
- Some troubleshooting steps modify stack state irreversibly
- Always attempt normal resolution before force operations

### PROCEDURE

**Failure Mode A: Stack Create Failure -- Resource Dependency Errors**

Step 1: Identify the failing resource.

```bash
openstack stack resource list <stack-name> --filter status=CREATE_FAILED -f table
```

Expected result: A table showing which resource(s) failed creation with their status reason.

If unexpected: If no resources show as failed but the stack itself is CREATE_FAILED, check the stack events:

```bash
openstack stack event list <stack-name> --sort-key event_time --sort-dir desc --limit 20
```

Step 2: Check the specific error for the failed resource.

```bash
openstack stack resource show <stack-name> <resource-name> -c resource_status_reason -f value
```

Expected result: A detailed error message explaining why the resource failed.

If unexpected: If the status reason is empty, check Heat engine logs:

```bash
docker logs heat_engine --tail 200 2>&1 | grep "<stack-name>"
```

Step 3: Resolve the dependency issue.

Common causes and fixes:
- **Circular dependency:** Restructure the template to break the cycle. Use explicit `depends_on` to clarify ordering.
- **Missing referenced resource:** Verify all `get_resource` references point to resources defined in the same template.
- **Quota exceeded:** Check project quotas with `openstack quota show`. Increase quotas or reduce template resources. See OPS-NOVA-001, OPS-NEUTRON-001, OPS-CINDER-001 for service-specific quota checks.

Step 4: Delete the failed stack and retry.

```bash
openstack stack delete <stack-name> --yes --wait
openstack stack create -t <template.yaml> <stack-name>
```

Expected result: Stack deletion completes, and the new stack creation proceeds.

If unexpected: If deletion gets stuck, see Failure Mode C below.

**Failure Mode B: Stack Update Rollback Failure**

Step 5: Identify the update failure.

```bash
openstack stack show <stack-name> -c stack_status -c stack_status_reason -f table
```

Expected result: Stack status shows `UPDATE_FAILED` with a status reason describing what went wrong.

Step 6: List resources in error state.

```bash
openstack stack resource list <stack-name> --filter status=UPDATE_FAILED -f table
```

Expected result: One or more resources showing `UPDATE_FAILED` status.

Step 7: Attempt manual resource resolution.

```bash
# Check the specific resource error
openstack stack resource show <stack-name> <resource-name> -c resource_status_reason -f value

# If the resource can be manually corrected, mark it for update
openstack stack resource mark-unhealthy <stack-name> <resource-name> "Manual resolution required"
```

Expected result: Resource marked for update; the next stack update will recreate it.

Step 8: Retry the stack update.

```bash
openstack stack update -t <corrected-template.yaml> <stack-name>
```

Expected result: Update proceeds with the corrected template.

If unexpected: If the stack is stuck in `UPDATE_FAILED` and will not accept updates, use `--existing` to retry with the current template, or delete and recreate.

**Failure Mode C: Stack Delete Stuck (Nested Stacks)**

Step 9: Identify stuck nested stacks.

```bash
openstack stack resource list <stack-name> --nested-depth 2 --filter status=DELETE_FAILED -f table
```

Expected result: A list of nested stack resources that failed to delete.

Step 10: Delete nested stacks individually.

```bash
# Get the nested stack ID
openstack stack resource show <parent-stack> <nested-resource> -c physical_resource_id -f value

# Delete the nested stack directly
openstack stack delete <nested-stack-id> --yes --wait
```

Expected result: Nested stack deletes successfully.

If unexpected: If the nested stack also has stuck resources, recurse: check its resources for DELETE_FAILED entries.

Step 11: Force-delete the parent stack if normal deletion fails.

```bash
# Abandon the stack (removes from Heat without deleting resources)
openstack stack abandon <stack-name> > /tmp/abandoned-stack.json

# Manually clean up remaining resources using service-specific commands
# Check the abandon output for resource IDs that need manual cleanup
cat /tmp/abandoned-stack.json | jq '.resources'
```

Expected result: Stack removed from Heat. Resources require manual cleanup via Nova, Neutron, or Cinder commands.

**Failure Mode D: Heat Engine Timeout**

Step 12: Identify timeout symptoms.

```bash
docker logs heat_engine --tail 100 2>&1 | grep -i "timeout\|timed out"
```

Expected result: Log entries showing timeout errors with stack or resource identifiers.

Step 13: Check Heat engine connectivity.

```bash
# Verify engine can reach the message queue
docker exec heat_engine python -c "import socket; s=socket.create_connection(('rabbitmq', 5672)); print('RabbitMQ: OK')"

# Verify engine can reach the database
docker exec heat_engine python -c "import socket; s=socket.create_connection(('mariadb', 3306)); print('MariaDB: OK')"
```

Expected result: Both connectivity checks print "OK".

If unexpected: If RabbitMQ or MariaDB is unreachable, restart the affected service and then restart the Heat engine.

Step 14: Restart the Heat engine.

```bash
docker restart heat_engine
sleep 30
openstack orchestration service list
```

Expected result: Heat engine restarts and reports status `up`.

**Failure Mode E: Template Validation Errors**

Step 15: Validate the template.

```bash
openstack stack template validate -t <template.yaml>
```

Expected result: If valid, the command outputs the template parameters. If invalid, the error message indicates the specific problem.

Step 16: Check for common template errors.

```bash
# Verify YAML syntax
python3 -c "import yaml; yaml.safe_load(open('<template.yaml>'))" && echo "YAML: OK"

# Check heat_template_version is supported
grep heat_template_version <template.yaml>
openstack orchestration template version list | grep "$(grep heat_template_version <template.yaml> | awk '{print $2}')"
```

Expected result: YAML parses without error. Template version is in the supported list.

If unexpected: Fix the YAML syntax error or update the `heat_template_version` to a supported value. See OPS-HEAT-008 for detailed template validation.

### VERIFICATION

1. After resolving any failure, verify the stack reaches the expected state: `openstack stack show <stack-name> -c stack_status -f value`
2. Confirm Heat engine is healthy: `openstack orchestration service list`
3. Run OPS-HEAT-001 health check to confirm overall service health

### ROLLBACK

Rollback depends on the failure mode:
- **Create failures:** Delete the failed stack and recreate with a corrected template
- **Update failures:** If the stack is in UPDATE_FAILED, attempt `openstack stack update --rollback <stack-name>` to revert
- **Delete stuck:** Use `openstack stack abandon` and manually clean up resources
- **Engine timeout:** Restart the engine; no rollback needed
- **Template errors:** Fix the template; no system changes were made

### REFERENCES

- OPS-HEAT-001: Service Health Check (post-troubleshooting verification)
- OPS-HEAT-008: Stack Template Validation (detailed template verification)
- OPS-HEAT-009: Resource Dependency Analysis (dependency debugging)
- OPS-NOVA-006: Nova Troubleshooting (instance-level resource failures)
- OPS-NEUTRON-006: Neutron Troubleshooting (network-level resource failures)
- OPS-CINDER-006: Cinder Troubleshooting (volume-level resource failures)
- OpenStack Heat Troubleshooting Guide: https://docs.openstack.org/heat/2024.2/admin/troubleshooting.html
- SP-6105 SS 5.4: Operations and Sustainment -- fault management
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- troubleshooting procedures

---

## OPS-HEAT-007: Security Audit

```
PROCEDURE ID: OPS-HEAT-007
TITLE: Heat Security Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Audit the security configuration of the Heat orchestration service including stack domain user permissions, trusts configuration, template policy restrictions, and resource type restrictions. Execute monthly or after any security-related configuration change.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. Access to Heat configuration files within containers
4. Knowledge of the expected security baseline

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify security settings
- Audit output may contain sensitive information (domain credentials, trust IDs)
- Store audit results in a secure location with restricted access
- Do not share audit results through insecure channels

### PROCEDURE

Step 1: Audit stack domain user permissions.

```bash
# Verify the heat stack domain exists
openstack domain show heat -f table

# Verify the stack domain admin user
openstack user show heat_domain_admin --domain heat -f table

# Check roles assigned to the stack domain admin
openstack role assignment list --user heat_domain_admin --domain heat -f table
```

Expected result: The `heat` domain exists and is enabled. The `heat_domain_admin` user exists within the heat domain. The user has the `admin` role on the heat domain.

If unexpected: If the domain or user is missing, re-run `kolla-ansible post-deploy` to recreate them. If excessive roles are assigned, remove unnecessary roles:

```bash
openstack role remove --domain heat --user heat_domain_admin <unnecessary-role>
```

Step 2: Review trusts configuration.

```bash
docker exec heat_api cat /etc/heat/heat.conf | grep -E "^(trusts_delegated_roles|deferred_auth_method|reauthentication_auth_method)"
```

Expected result: `deferred_auth_method = trusts` (Heat uses trusts for deferred operations). `trusts_delegated_roles` lists the roles delegated through trusts (should be minimal -- typically `heat_stack_owner`).

If unexpected: If `deferred_auth_method` is set to `password`, Heat stores user passwords for deferred operations, which is a security risk. Change to `trusts` and reconfigure.

Step 3: Review template policy restrictions.

```bash
docker exec heat_api cat /etc/heat/policy.json 2>/dev/null || docker exec heat_api cat /etc/heat/policy.yaml 2>/dev/null || echo "Using default policy"
```

Expected result: Either a policy file with custom restrictions, or "Using default policy" if defaults are in use.

If unexpected: If custom policies are in place, verify they match the security baseline. If no custom policies exist and restrictions are needed, create a policy override file.

Step 4: Check resource type restrictions.

```bash
docker exec heat_api cat /etc/heat/heat.conf | grep -E "^(hidden_stack_tags|resource_finder_cache_timeout)"
docker exec heat_api cat /etc/heat/heat.conf | grep -A10 "\[resource_finder\]" 2>/dev/null
```

Expected result: Resource type restrictions are configured according to the security baseline. `hidden_stack_tags` prevents certain stack tags from being exposed.

Step 5: Verify Heat API uses HTTPS.

```bash
openstack endpoint list --service orchestration -f table
```

Expected result: Endpoint URLs use `https://` protocol.

If unexpected: If endpoints use `http://`, configure TLS. See OPS-KEYSTONE-007 for endpoint security.

Step 6: Check for overly permissive stack creation policies.

```bash
# List all projects that can create stacks
openstack role assignment list --names --role heat_stack_owner -f table 2>/dev/null || echo "No explicit heat_stack_owner assignments"
```

Expected result: Only authorized projects and users have the `heat_stack_owner` role.

If unexpected: Remove unauthorized role assignments:

```bash
openstack role remove --project <project> --user <user> heat_stack_owner
```

Step 7: Audit active trusts.

```bash
# List trusts (requires admin)
openstack trust list -f table 2>/dev/null || echo "Trust listing not available"
```

Expected result: Active trusts correspond to running stacks or auto-scaling groups. No orphaned trusts from deleted stacks.

If unexpected: If orphaned trusts exist (for stacks that no longer exist), they represent unnecessary delegated permissions. Delete orphaned trusts:

```bash
openstack trust delete <trust-id>
```

### VERIFICATION

1. Confirm heat domain exists and is enabled: `openstack domain show heat -c enabled -f value` returns `True`
2. Confirm heat_domain_admin user exists: `openstack user show heat_domain_admin --domain heat -c id -f value` returns a valid ID
3. Confirm deferred auth method is trusts: `docker exec heat_api grep deferred_auth_method /etc/heat/heat.conf` shows `trusts`
4. Confirm endpoints use HTTPS: `openstack endpoint list --service orchestration -f value -c URL | grep -c https` is non-zero

### ROLLBACK

This procedure is read-only. If security issues were identified and changes were made to resolve them:

1. Document all changes made during the audit
2. Revert changes by restoring the previous configuration from backup
3. Run `kolla-ansible reconfigure --tags heat` to re-apply the previous configuration

### REFERENCES

- OPS-KEYSTONE-007: Keystone Security Audit (authentication and authorization baseline)
- OPS-KEYSTONE-001: Keystone Service Health Check (auth dependency)
- OpenStack Heat Security Guide: https://docs.openstack.org/heat/2024.2/admin/security.html
- OpenStack Security Guide -- Orchestration: https://docs.openstack.org/security-guide/orchestration.html
- SP-6105 SS 5.4: Operations and Sustainment -- security monitoring
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- security audit procedures

---

## OPS-HEAT-008: Stack Template Validation

```
PROCEDURE ID: OPS-HEAT-008
TITLE: Stack Template Validation
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Validate HOT templates before deployment to catch syntax errors, resource type availability issues, parameter constraint violations, and resource preview problems. Execute before deploying any new or modified template to a production environment.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. Template file(s) accessible on the local filesystem
4. Environment files (if any) accessible on the local filesystem

### SAFETY CONSIDERATIONS

- Template validation is read-only and does not create any resources
- The `--dry-run` preview queries service APIs to check resource availability but does not allocate resources
- Validation does not catch all runtime errors (e.g., image not found, flavor not available) -- these only surface at create time

### PROCEDURE

Step 1: Validate YAML syntax.

```bash
python3 -c "
import yaml, sys
try:
    with open('<template.yaml>') as f:
        doc = yaml.safe_load(f)
    print('YAML syntax: VALID')
    print(f'Top-level keys: {list(doc.keys())}')
except yaml.YAMLError as e:
    print(f'YAML syntax: INVALID - {e}')
    sys.exit(1)
"
```

Expected result: "YAML syntax: VALID" with top-level keys including `heat_template_version`, `resources`, and optionally `description`, `parameters`, `outputs`.

If unexpected: Fix the YAML syntax error indicated in the output. Common issues: incorrect indentation, missing quotes around special characters, tab characters instead of spaces.

Step 2: Verify template version is supported.

```bash
grep heat_template_version <template.yaml>
openstack orchestration template version list
```

Expected result: The `heat_template_version` value in the template appears in the supported versions list.

If unexpected: Update the `heat_template_version` to a supported value. Use the most recent supported version for maximum feature availability.

Step 3: Validate template through the Heat API.

```bash
openstack stack template validate -t <template.yaml>
```

Expected result: The command outputs a JSON document describing the template parameters (names, types, defaults, constraints). No errors.

If unexpected: The error message indicates the specific validation failure:
- "Unknown resource type" -- check resource type availability (Step 4)
- "Invalid reference" -- a `get_resource` or `get_param` references something undefined
- "Circular dependency" -- resources form a dependency cycle (see OPS-HEAT-009)

Step 4: Check resource type availability.

```bash
# List all available resource types
openstack orchestration resource type list -f value > /tmp/available-resource-types.txt

# Extract resource types used in the template
grep "type: OS::" <template.yaml> | awk '{print $2}' | sort -u > /tmp/template-resource-types.txt

# Compare
while read rtype; do
  if grep -q "^${rtype}$" /tmp/available-resource-types.txt; then
    echo "AVAILABLE: $rtype"
  else
    echo "MISSING:   $rtype"
  fi
done < /tmp/template-resource-types.txt
```

Expected result: All resource types show "AVAILABLE".

If unexpected: If a resource type is "MISSING", the corresponding OpenStack service may not be deployed. Verify service availability or use an alternative resource type.

Step 5: Verify parameter constraints.

```bash
openstack stack template validate -t <template.yaml> -f json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for name, param in data.get('Parameters', {}).items():
    constraints = param.get('Constraints', [])
    default = param.get('Default', 'NONE')
    print(f'{name}: type={param[\"Type\"]}, default={default}, constraints={len(constraints)}')
"
```

Expected result: All parameters listed with their types, defaults, and constraint counts.

If unexpected: If a parameter has no default and no constraint, it requires user input at stack creation. Verify this is intentional.

Step 6: Preview stack resources (dry run).

```bash
openstack stack create --dry-run -t <template.yaml> -e <env.yaml> preview-stack -f json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for resource in data.get('resources', []):
    print(f'{resource[\"resource_name\"]}: {resource[\"resource_type\"]} -> {resource.get(\"resource_status\", \"PREVIEW\")}')
"
```

Expected result: All resources listed with their types and PREVIEW status.

If unexpected: If the preview fails, the template has issues that would cause create-time failures. Review the error message for specific resource problems.

### VERIFICATION

1. Confirm YAML parses without error
2. Confirm template version is supported
3. Confirm Heat API validation passes: `openstack stack template validate -t <template.yaml>` returns parameter list without errors
4. Confirm all resource types are available
5. Confirm dry-run preview succeeds

### ROLLBACK

This procedure is read-only. No rollback required. No resources are created or modified.

### REFERENCES

- OPS-HEAT-001: Service Health Check (Heat API availability)
- OPS-HEAT-006: Troubleshooting Common Failures (template validation error resolution)
- OPS-HEAT-009: Resource Dependency Analysis (dependency debugging)
- OpenStack HOT Template Guide: https://docs.openstack.org/heat/2024.2/template_guide/hot_guide.html
- OpenStack HOT Specification: https://docs.openstack.org/heat/2024.2/template_guide/hot_spec.html
- OpenStack Resource Type Reference: https://docs.openstack.org/heat/2024.2/template_guide/openstack.html
- SP-6105 SS 5.1: Final Design and Fabrication -- design verification
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- pre-deployment validation

---

## OPS-HEAT-009: Resource Dependency Analysis

```
PROCEDURE ID: OPS-HEAT-009
TITLE: Resource Dependency Analysis
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Inspect stack resource dependencies to identify circular references, analyze resource creation order, and debug dependency failures. Execute when stack creation or updates fail due to dependency issues, or when optimizing template structure for parallel resource creation.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. Access to the template file for static analysis and/or a running stack for runtime analysis

### SAFETY CONSIDERATIONS

- This procedure is read-only for existing stacks
- Template analysis does not create resources
- Modifying templates to resolve dependency issues should be tested via OPS-HEAT-008 before deployment

### PROCEDURE

Step 1: Extract implicit dependencies from a template.

```bash
python3 -c "
import yaml, re, sys

with open('<template.yaml>') as f:
    template = yaml.safe_load(f)

resources = template.get('resources', {})
deps = {}

for rname, rdef in resources.items():
    deps[rname] = set()
    rdef_str = str(rdef)
    # Find get_resource references
    for ref in re.findall(r\"get_resource:\s*(\w+)\", rdef_str):
        if ref != rname and ref in resources:
            deps[rname].add(ref)
    # Find explicit depends_on
    depends = rdef.get('depends_on', [])
    if isinstance(depends, str):
        depends = [depends]
    for d in depends:
        if d in resources:
            deps[rname].add(d)

print('Resource Dependencies:')
for rname, rdeps in deps.items():
    if rdeps:
        print(f'  {rname} -> {sorted(rdeps)}')
    else:
        print(f'  {rname} -> (no dependencies, can create first)')
"
```

Expected result: A dependency list showing which resources depend on which others. Resources with no dependencies can be created in parallel at the start.

If unexpected: If the script fails to parse the template, check YAML syntax first (see OPS-HEAT-008 Step 1).

Step 2: Detect circular dependencies.

```bash
python3 -c "
import yaml, re, sys

with open('<template.yaml>') as f:
    template = yaml.safe_load(f)

resources = template.get('resources', {})
deps = {}

for rname, rdef in resources.items():
    deps[rname] = set()
    rdef_str = str(rdef)
    for ref in re.findall(r\"get_resource:\s*(\w+)\", rdef_str):
        if ref != rname and ref in resources:
            deps[rname].add(ref)
    depends = rdef.get('depends_on', [])
    if isinstance(depends, str):
        depends = [depends]
    for d in depends:
        if d in resources:
            deps[rname].add(d)

# Topological sort to detect cycles
visited = set()
in_stack = set()
cycle_found = False

def dfs(node, path):
    global cycle_found
    if node in in_stack:
        cycle_start = path.index(node)
        cycle = path[cycle_start:] + [node]
        print(f'CIRCULAR DEPENDENCY DETECTED: {\" -> \".join(cycle)}')
        cycle_found = True
        return
    if node in visited:
        return
    visited.add(node)
    in_stack.add(node)
    path.append(node)
    for dep in deps.get(node, set()):
        dfs(dep, path)
    path.pop()
    in_stack.remove(node)

for r in resources:
    dfs(r, [])

if not cycle_found:
    print('No circular dependencies detected.')
"
```

Expected result: "No circular dependencies detected."

If unexpected: If a cycle is detected, the output shows the chain of resources forming the cycle. Break the cycle by:
- Removing unnecessary `get_resource` references
- Using `get_attr` with a separate resource instead of direct references
- Splitting into nested stacks with parameter passing

Step 3: Analyze resource creation order for a running stack.

```bash
openstack stack event list <stack-name> --sort-key event_time --sort-dir asc -f table | grep "CREATE_IN_PROGRESS\|CREATE_COMPLETE"
```

Expected result: Events listed in chronological order showing which resources started and completed creation. Independent resources should start simultaneously.

If unexpected: If resources that should be independent are serialized, check for hidden dependencies (implicit references that create ordering constraints).

Step 4: Inspect specific resource dependencies in a running stack.

```bash
openstack stack resource show <stack-name> <resource-name> -c required_by -c depends_on -f table
```

Expected result: The `required_by` field shows resources that depend on this resource. The `depends_on` field shows resources this resource depends on.

If unexpected: If unexpected dependencies appear, they may come from implicit references in the template (e.g., `get_resource` usage that creates implicit `depends_on`).

Step 5: Debug a specific dependency failure.

```bash
# Show the failed resource's dependencies
openstack stack resource show <stack-name> <failed-resource> -f json | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Resource: {data[\"resource_name\"]}')
print(f'Type: {data[\"resource_type\"]}')
print(f'Status: {data[\"resource_status\"]}')
print(f'Reason: {data[\"resource_status_reason\"]}')
print(f'Depends on: {data.get(\"depends_on\", [])}')
print(f'Required by: {data.get(\"required_by\", [])}')
"
```

Expected result: Detailed information about the failed resource, its dependencies, and the failure reason.

If unexpected: If the resource has no status reason, check the Heat engine logs for the specific resource:

```bash
docker logs heat_engine --tail 500 2>&1 | grep "<resource-name>"
```

### VERIFICATION

1. Confirm no circular dependencies in template: run Step 2 and verify "No circular dependencies detected"
2. Confirm all resources in a running stack show expected dependency chains: `openstack stack resource list <stack-name> -c resource_name -c depends_on -f table`
3. Confirm no resources are stuck waiting for dependencies: `openstack stack resource list <stack-name> --filter status=CREATE_IN_PROGRESS` shows zero long-stuck resources

### ROLLBACK

This procedure is read-only. No rollback required. If template modifications were made to resolve dependencies, test via OPS-HEAT-008 before deploying.

### REFERENCES

- OPS-HEAT-006: Troubleshooting Common Failures (dependency error resolution)
- OPS-HEAT-008: Stack Template Validation (template verification after changes)
- OpenStack HOT Specification -- Dependencies: https://docs.openstack.org/heat/2024.2/template_guide/hot_spec.html#resources-section
- OpenStack Heat Developer Guide -- Resource Dependencies: https://docs.openstack.org/heat/2024.2/developing_guides/architecture.html
- SP-6105 SS 5.2: System Assembly, Integration, and Test -- dependency analysis
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- system dependency verification

---

## OPS-HEAT-010: Orphan Cleanup

```
PROCEDURE ID: OPS-HEAT-010
TITLE: Orphan Stack and Resource Cleanup
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Identify and clean up orphaned stacks (stacks in permanent error or deleted state) and orphaned resources (cloud resources no longer managed by any stack). Purge deleted stack records from the database. Verify resource reclamation after cleanup. Execute monthly or when database growth or resource waste is observed.

### PRECONDITIONS

1. Heat service is running (see OPS-HEAT-001)
2. Administrator credentials are sourced (`source /etc/kolla/admin-openrc.sh`)
3. Access to the Heat database for purge operations
4. Understanding of which stacks and resources are expected to exist
5. Backup completed (see OPS-HEAT-003) -- orphan cleanup is destructive

### SAFETY CONSIDERATIONS

- Deleting orphaned stacks may trigger deletion of associated cloud resources (instances, networks, volumes)
- Verify each orphaned stack is truly orphaned before deletion -- confirm no active users depend on it
- Database purge permanently removes deleted stack records -- ensure backup exists
- Resource reclamation may affect other services (see cross-references to OPS-NOVA, OPS-NEUTRON, OPS-CINDER)

### PROCEDURE

Step 1: Identify stacks in permanent error states across all projects.

```bash
openstack stack list --all-projects -f json | python3 -c "
import json, sys
stacks = json.load(sys.stdin)
error_states = ['CREATE_FAILED', 'DELETE_FAILED', 'UPDATE_FAILED', 'ROLLBACK_FAILED']
orphans = [s for s in stacks if s.get('Stack Status') in error_states]
print(f'Found {len(orphans)} stacks in error state:')
for s in orphans:
    print(f'  {s[\"ID\"]} | {s[\"Stack Name\"]} | {s[\"Stack Status\"]} | Project: {s.get(\"Project\", \"unknown\")}')
"
```

Expected result: A list of stacks in error states, or "Found 0 stacks in error state" if none exist.

If unexpected: If the command fails, check Heat API health (see OPS-HEAT-001).

Step 2: Investigate each orphaned stack before cleanup.

```bash
# Show stack details
openstack stack show <stack-id> -f table

# Show stack resources and their states
openstack stack resource list <stack-id> -f table

# Check when the stack was last updated
openstack stack show <stack-id> -c updated_time -f value
```

Expected result: Stack details showing error state, resource list showing which resources succeeded or failed, and timestamp showing how long the stack has been in error state.

Step 3: Attempt normal deletion of orphaned stacks.

```bash
openstack stack delete <stack-id> --yes --wait
```

Expected result: Stack deletion completes and the stack is removed.

If unexpected: If deletion fails (stack remains in DELETE_FAILED), proceed to Step 4.

Step 4: Force-clean stacks stuck in DELETE_FAILED.

```bash
# Abandon the stack (removes Heat management without deleting resources)
openstack stack abandon <stack-id> > /tmp/abandoned-<stack-id>.json

# Review resources that need manual cleanup
cat /tmp/abandoned-<stack-id>.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
for rname, rdata in data.get('resources', {}).items():
    print(f'{rname}: type={rdata[\"type\"]}, id={rdata.get(\"resource_id\", \"unknown\")}')
"
```

Expected result: Stack removed from Heat. Resource list showing what needs manual cleanup.

Step 5: Clean up orphaned resources manually.

```bash
# Delete orphaned instances (coordinate with OPS-NOVA)
openstack server delete <instance-id>

# Delete orphaned networks (coordinate with OPS-NEUTRON)
openstack network delete <network-id>

# Delete orphaned volumes (coordinate with OPS-CINDER)
openstack volume delete <volume-id>

# Delete orphaned floating IPs (coordinate with OPS-NEUTRON)
openstack floating ip delete <floating-ip-id>
```

Expected result: Each resource deletion completes without error.

If unexpected: If resources cannot be deleted due to dependencies, identify and remove the dependent resources first. For example, instances must be deleted before their networks.

Step 6: Purge deleted stack records from the Heat database.

```bash
# Purge stack records deleted more than 30 days ago
docker exec heat_engine heat-manage purge_deleted -g days 30
```

Expected result: Output indicating the number of purged records.

If unexpected: If the purge command fails, check database connectivity:

```bash
docker exec heat_engine heat-manage db_version
```

Step 7: Verify resource reclamation.

```bash
# Count stacks in error state (should be reduced)
openstack stack list --all-projects -f value -c "Stack Status" | grep -c "FAILED"

# Verify freed resources
openstack server list --all-projects -f value | wc -l
openstack network list -f value | wc -l
openstack volume list --all-projects -f value | wc -l
```

Expected result: Fewer stacks in error state than before cleanup. Resource counts reflect the deleted orphaned resources.

### VERIFICATION

1. Confirm error-state stack count is reduced: compare before and after counts from Step 1
2. Confirm abandoned stack resources are cleaned up: verify resource IDs from Step 4 no longer exist
3. Confirm database purge succeeded: `docker exec heat_engine heat-manage purge_deleted -g days 30` reports 0 remaining
4. Run OPS-HEAT-001 health check to confirm service stability after cleanup

### ROLLBACK

Orphan cleanup is partially irreversible:
- **Abandoned stacks** can be re-adopted using `openstack stack adopt` if the abandon JSON file was saved
- **Deleted resources** (instances, networks, volumes) cannot be recovered -- ensure backup exists before cleanup
- **Purged database records** cannot be recovered -- ensure database backup exists (see OPS-HEAT-003)

### REFERENCES

- OPS-HEAT-001: Service Health Check (post-cleanup verification)
- OPS-HEAT-003: Backup and Restore (pre-cleanup backup)
- OPS-HEAT-006: Troubleshooting Common Failures (resolving DELETE_FAILED stacks)
- OPS-NOVA-006: Nova Troubleshooting (orphaned instance cleanup)
- OPS-NEUTRON-006: Neutron Troubleshooting (orphaned network cleanup)
- OPS-CINDER-006: Cinder Troubleshooting (orphaned volume cleanup)
- OpenStack Heat Administration -- Database Purge: https://docs.openstack.org/heat/2024.2/admin/
- SP-6105 SS 5.4: Operations and Sustainment -- resource management
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- resource reclamation procedures
