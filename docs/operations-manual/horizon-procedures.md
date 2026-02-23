# Horizon Dashboard Service -- Operations Procedures

Operations procedures for the OpenStack Horizon web dashboard following NASA procedure format per SP-6105 SS 5.5 (Product Transition) and NPR 7123.1 SS 3.2 Process 9 (Product Transition).

Horizon provides the web-based graphical interface to OpenStack services, allowing operators and users to manage instances, networks, volumes, and identities through a browser-based dashboard backed by Keystone authentication.

## Table of Contents

- [OPS-HORIZON-001: Service Health Check](#ops-horizon-001-service-health-check)
- [OPS-HORIZON-002: Configuration Verification](#ops-horizon-002-configuration-verification)
- [OPS-HORIZON-003: Backup and Restore](#ops-horizon-003-backup-and-restore)
- [OPS-HORIZON-004: Minor Upgrade](#ops-horizon-004-minor-upgrade)
- [OPS-HORIZON-005: Major Upgrade](#ops-horizon-005-major-upgrade)
- [OPS-HORIZON-006: Troubleshooting Common Failures](#ops-horizon-006-troubleshooting-common-failures)
- [OPS-HORIZON-007: Security Audit](#ops-horizon-007-security-audit)
- [OPS-HORIZON-008: Session Management](#ops-horizon-008-session-management)
- [OPS-HORIZON-009: Custom Panel Deployment](#ops-horizon-009-custom-panel-deployment)
- [OPS-HORIZON-010: Theme Configuration](#ops-horizon-010-theme-configuration)

---

## OPS-HORIZON-001: Service Health Check

```
PROCEDURE ID: OPS-HORIZON-001
TITLE: Horizon Dashboard Service Health Check
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Verify that the Horizon dashboard service is fully operational, the container is running, the web server responds with HTTP 200, Keystone authentication works through the dashboard, and logs show no critical errors. Execute daily or after any infrastructure change that may affect the dashboard.

### PRECONDITIONS

1. OpenStack control plane is running and accessible
2. Keystone authentication is functional (see OPS-KEYSTONE-001)
3. Docker daemon is running on the control node
4. Network access to the dashboard URL from the verification host

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify any service state
- HTTP requests to the dashboard generate minimal load
- If the dashboard is unhealthy, users cannot access the web interface but CLI and API access remain unaffected

### PROCEDURE

Step 1: Verify the Horizon container is running.

```bash
docker ps --filter name=horizon --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

Expected result: The `horizon` container is listed with status "Up" and uptime shown.

If unexpected: If the container is missing or shows "Restarting", check container logs:

```bash
docker logs horizon --tail 50
```

Step 2: Check the container health status.

```bash
docker inspect --format '{{.State.Health.Status}}' horizon
```

Expected result: `healthy`

If unexpected: If status is `unhealthy`, check the health check logs:

```bash
docker inspect --format '{{json .State.Health}}' horizon | python3 -m json.tool
```

Step 3: Verify the web server responds at the dashboard URL.

```bash
curl -so /dev/null -w "HTTP Status: %{http_code}\nResponse Time: %{time_total}s\n" https://<kolla_external_vip_address>/auth/login/
```

Expected result: HTTP Status 200 (login page) or 302 (redirect to login). Response time under 5 seconds.

If unexpected: If the connection times out or returns 502/503, check HAProxy status and the Horizon container:

```bash
docker logs horizon --tail 20
```

Step 4: Verify Keystone authentication through the dashboard.

```bash
# Obtain a CSRF token from the login page
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')

# Attempt login (expect 302 redirect to dashboard on success)
curl -sb /tmp/horizon-cookies -w "Login Status: %{http_code}\n" \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null
```

Expected result: Login Status 302 (redirect to dashboard, indicating successful authentication).

If unexpected: If login returns 200 (back to login page with error), check Keystone connectivity:

```bash
docker exec horizon curl -s http://keystone-internal:5000/v3/ | python3 -m json.tool
```

See OPS-KEYSTONE-001 for Keystone health verification.

Step 5: Check Horizon logs for errors.

```bash
docker logs horizon --tail 100 2>&1 | grep -i "error\|exception\|traceback"
```

Expected result: No critical errors or unhandled exceptions in recent logs.

If unexpected: Record the error messages and consult OPS-HORIZON-006 for troubleshooting common failures.

Step 6: Verify static assets are loading.

```bash
curl -so /dev/null -w "Static CSS: %{http_code}\n" https://<kolla_external_vip_address>/static/dashboard/css/style.css
```

Expected result: HTTP Status 200.

If unexpected: If static assets return 404, see OPS-HORIZON-006 Failure Mode E.

### VERIFICATION

1. Confirm Horizon container is running: `docker ps --filter name=horizon | wc -l` returns 2 (header + 1 container)
2. Confirm HTTP 200 at login page: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/` returns `200`
3. Confirm no critical errors in logs: `docker logs horizon --tail 100 2>&1 | grep -ic "error\|exception"` returns 0 or low count
4. Confirm static assets accessible: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/static/dashboard/css/style.css` returns `200`

### ROLLBACK

This procedure is read-only. No rollback required.

### REFERENCES

- OPS-KEYSTONE-001: Keystone Service Health Check (authentication dependency)
- OpenStack Horizon Administration Guide: https://docs.openstack.org/horizon/2024.2/admin/
- SP-6105 SS 5.4: Operations and Sustainment -- system health monitoring
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- operational readiness verification

---

## OPS-HORIZON-002: Configuration Verification

```
PROCEDURE ID: OPS-HORIZON-002
TITLE: Horizon Configuration Verification
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Confirm that Horizon configuration settings match the expected state after deployment, reconfiguration, or upgrade. Verify local_settings.py configuration including API versions, session engine, cache backend, allowed hosts, and SSL certificate. Execute after any configuration change.

### PRECONDITIONS

1. Horizon service is running (see OPS-HORIZON-001)
2. Access to the Horizon container via Docker
3. Access to the Kolla-Ansible configuration directory (`/etc/kolla/`)
4. Previous configuration baseline is available for comparison

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify configuration
- Configuration output may contain sensitive settings (secret keys, cache credentials)
- Do not copy configuration output to insecure locations

### PROCEDURE

Step 1: Verify Horizon is enabled in globals.yml.

```bash
grep -E "^enable_horizon" /etc/kolla/globals.yml
```

Expected result: `enable_horizon: "yes"`

If unexpected: If Horizon is not enabled, edit `/etc/kolla/globals.yml` and set `enable_horizon: "yes"`, then run `kolla-ansible reconfigure --tags horizon`.

Step 2: Verify OPENSTACK_API_VERSIONS configuration.

```bash
docker exec horizon python3 -c "
from openstack_dashboard.settings import OPENSTACK_API_VERSIONS
for api, version in OPENSTACK_API_VERSIONS.items():
    print(f'{api}: v{version}')
"
```

Expected result: API versions matching the deployed services:
- `identity: v3`
- `image: v2`
- `volume: v3`

If unexpected: If API versions do not match the deployed service versions, update the Horizon configuration override:

```bash
cat >> /etc/kolla/config/horizon/custom_local_settings << 'EOF'
OPENSTACK_API_VERSIONS = {
    "identity": 3,
    "image": 2,
    "volume": 3,
}
EOF
kolla-ansible reconfigure --tags horizon
```

Step 3: Verify SESSION_ENGINE configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'SESSION_ENGINE: {settings.SESSION_ENGINE}')
print(f'SESSION_TIMEOUT: {settings.SESSION_COOKIE_AGE}')
print(f'SESSION_COOKIE_SECURE: {settings.SESSION_COOKIE_SECURE}')
print(f'SESSION_COOKIE_HTTPONLY: {settings.SESSION_COOKIE_HTTPONLY}')
"
```

Expected result: SESSION_ENGINE is `django.contrib.sessions.backends.cache` (memcached) or `django.contrib.sessions.backends.db` (database). SESSION_COOKIE_SECURE is `True` for HTTPS deployments. SESSION_COOKIE_HTTPONLY is `True`.

If unexpected: If session settings do not match expected values, update via Kolla-Ansible configuration override and reconfigure.

Step 4: Verify CACHES configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
import json
print(json.dumps(settings.CACHES, indent=2, default=str))
"
```

Expected result: Cache backend shows memcached configuration with the correct memcached address (typically `memcached:11211`).

If unexpected: If the cache backend is misconfigured, Horizon sessions will fail. Verify memcached is running:

```bash
docker ps --filter name=memcached
```

Step 5: Verify ALLOWED_HOSTS configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
"
```

Expected result: ALLOWED_HOSTS includes the dashboard hostname(s). In production, this should not be `['*']`.

If unexpected: If ALLOWED_HOSTS is `['*']`, restrict it to specific hostnames in the configuration override for production use.

Step 6: Verify SSL certificate validity (HTTPS deployments).

```bash
curl -vI https://<kolla_external_vip_address>/auth/login/ 2>&1 | grep -E "SSL certificate|subject:|expire date:"
```

Expected result: SSL certificate is valid, subject matches the dashboard hostname, and expiry date is in the future.

If unexpected: If the certificate is expired or mismatched, replace it and reconfigure:

```bash
cp /path/to/new/cert.pem /etc/kolla/certificates/haproxy.pem
kolla-ansible reconfigure --tags haproxy
```

### VERIFICATION

1. Confirm Horizon is enabled: `grep "enable_horizon" /etc/kolla/globals.yml` shows `yes`
2. Confirm API versions are correct: `docker exec horizon python3 -c "from openstack_dashboard.settings import OPENSTACK_API_VERSIONS; print(OPENSTACK_API_VERSIONS)"` shows expected versions
3. Confirm session backend is configured: `docker exec horizon python3 -c "from django.conf import settings; print(settings.SESSION_ENGINE)"` returns expected engine
4. Confirm SSL certificate is valid: `curl -sI https://<kolla_external_vip_address>/auth/login/` returns HTTP 200 without certificate errors

### ROLLBACK

This procedure is read-only. No rollback required. If configuration was changed prior to this verification, rollback the configuration change using the backup taken before modification and run `kolla-ansible reconfigure --tags horizon`.

### REFERENCES

- OPS-HORIZON-001: Service Health Check (dashboard availability)
- OPS-KEYSTONE-001: Keystone Service Health Check (authentication endpoint verification)
- OpenStack Horizon Configuration Reference: https://docs.openstack.org/horizon/2024.2/configuration/
- OpenStack Horizon Settings Reference: https://docs.openstack.org/horizon/2024.2/configuration/settings.html
- SP-6105 SS 5.5: Product Transition -- configuration management verification
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- configuration baseline verification

---

## OPS-HORIZON-003: Backup and Restore

```
PROCEDURE ID: OPS-HORIZON-003
TITLE: Horizon Backup and Restore
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Create a complete backup of the Horizon configuration, custom panels, themes, and local_settings.py customizations. Provide a verified restore procedure that confirms dashboard login works after restoration. Execute before upgrades, major configuration changes, or on a regular schedule.

### PRECONDITIONS

1. Horizon service is running (see OPS-HORIZON-001)
2. Docker daemon is running on the control node
3. Sufficient disk space for the backup (check with `df -h /backup/`)
4. Backup target directory exists and is writable

### SAFETY CONSIDERATIONS

- Configuration backups may contain sensitive settings (secret key, database credentials)
- Store backups in a secure location with restricted access
- Restore operations overwrite the current configuration -- ensure the current state is backed up before restoring a previous backup
- Container restart during restore causes brief dashboard downtime

### PROCEDURE

**Part A: Backup**

Step 1: Backup Horizon configuration from the container.

```bash
mkdir -p /backup/horizon-config-$(date +%Y%m%d)
docker cp horizon:/etc/openstack-dashboard/local_settings.py /backup/horizon-config-$(date +%Y%m%d)/local_settings.py
docker cp horizon:/etc/openstack-dashboard/local_settings.d/ /backup/horizon-config-$(date +%Y%m%d)/local_settings.d/ 2>/dev/null || echo "No local_settings.d directory"
```

Expected result: local_settings.py and any settings drop-in files copied to the backup directory.

If unexpected: If the docker cp command fails, verify the container name: `docker ps --filter name=horizon`.

Step 2: Backup Kolla-Ansible Horizon overrides.

```bash
cp -r /etc/kolla/config/horizon/ /backup/horizon-config-$(date +%Y%m%d)/kolla-overrides/ 2>/dev/null || echo "No Kolla overrides found"
```

Expected result: Kolla override files (custom_local_settings, themes, etc.) copied to the backup.

If unexpected: If the directory does not exist, no custom overrides have been applied. This is normal for default deployments.

Step 3: Backup custom panels and themes.

```bash
docker cp horizon:/var/lib/openstack-dashboard/static/dashboard/img/ /backup/horizon-config-$(date +%Y%m%d)/custom-images/ 2>/dev/null || echo "No custom images"
docker cp horizon:/var/lib/openstack-dashboard/openstack_dashboard/themes/ /backup/horizon-config-$(date +%Y%m%d)/themes/ 2>/dev/null || echo "No custom themes"
docker cp horizon:/var/lib/openstack-dashboard/openstack_dashboard/local/enabled/ /backup/horizon-config-$(date +%Y%m%d)/enabled-panels/ 2>/dev/null || echo "No custom panel configs"
```

Expected result: Custom images, themes, and panel configurations backed up (if any exist).

If unexpected: Missing directories are normal if no customizations have been applied.

Step 4: Record the current dashboard state for post-restore verification.

```bash
curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/ > /backup/horizon-config-$(date +%Y%m%d)/pre-backup-status.txt
echo "Backup timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> /backup/horizon-config-$(date +%Y%m%d)/pre-backup-status.txt
```

Expected result: HTTP status code (200) and timestamp recorded.

Step 5: Verify backup integrity.

```bash
ls -la /backup/horizon-config-$(date +%Y%m%d)/
test -f /backup/horizon-config-$(date +%Y%m%d)/local_settings.py && echo "local_settings.py: OK" || echo "local_settings.py: MISSING"
```

Expected result: Backup directory listing shows all backed-up files with non-zero sizes. local_settings.py reports "OK".

**Part B: Restore**

Step 6: Stop the Horizon container before restoring configuration.

```bash
docker stop horizon
```

Expected result: Container reports "stopped".

If unexpected: If the container does not stop, force stop: `docker kill horizon`.

Step 7: Restore Kolla-Ansible configuration overrides.

```bash
cp -r /backup/horizon-config-YYYYMMDD/kolla-overrides/* /etc/kolla/config/horizon/ 2>/dev/null || echo "No overrides to restore"
```

Expected result: Override files restored to Kolla configuration directory.

Step 8: Redeploy Horizon with restored configuration.

```bash
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Ansible playbook completes with zero failures. The Horizon container is rebuilt with the restored configuration.

If unexpected: If reconfiguration fails, check the Ansible output for the specific failing task.

Step 9: Verify dashboard is accessible after restore.

```bash
curl -so /dev/null -w "HTTP Status: %{http_code}\n" https://<kolla_external_vip_address>/auth/login/
```

Expected result: HTTP Status 200.

If unexpected: Check container logs: `docker logs horizon --tail 50`.

Step 10: Verify login works after restore.

```bash
# Quick login test using curl
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')
curl -sb /tmp/horizon-cookies -w "Login Status: %{http_code}\n" \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null
```

Expected result: Login Status 302 (successful authentication redirect).

If unexpected: If login fails, check Keystone connectivity (see OPS-KEYSTONE-001) and session backend configuration (see OPS-HORIZON-008).

### VERIFICATION

1. Confirm backup files exist: `test -f /backup/horizon-config-$(date +%Y%m%d)/local_settings.py && echo "OK"`
2. After restore, confirm HTTP 200 at login page: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/` returns `200`
3. After restore, confirm login succeeds with expected credentials
4. After restore, run OPS-HORIZON-001 full health check

### ROLLBACK

If restore fails:

1. Stop the Horizon container: `docker stop horizon`
2. Remove the restored configuration overrides: `rm -rf /etc/kolla/config/horizon/*`
3. Redeploy Horizon with defaults: `kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one`
4. Verify default dashboard is accessible: run OPS-HORIZON-001

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-restore verification)
- OPS-KEYSTONE-001: Keystone Service Health Check (authentication dependency)
- OpenStack Horizon Administration Guide: https://docs.openstack.org/horizon/2024.2/admin/
- SP-6105 SS 5.4: Operations and Sustainment -- data protection and recovery
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- backup and recovery procedures

---

## OPS-HORIZON-004: Minor Upgrade

```
PROCEDURE ID: OPS-HORIZON-004
TITLE: Horizon Minor Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a minor version update to the Horizon dashboard using Kolla-Ansible. Backup configuration, execute the upgrade, and verify login and panel accessibility post-upgrade. Execute when a new minor release is available within the current OpenStack series.

### PRECONDITIONS

1. Horizon service is healthy (see OPS-HORIZON-001)
2. Configuration backup completed (see OPS-HORIZON-003)
3. New container images are pulled and available locally
4. Maintenance window scheduled -- dashboard will be unavailable during upgrade
5. Users notified of scheduled dashboard downtime

### SAFETY CONSIDERATIONS

- Dashboard is unavailable during the upgrade process (typically 2-5 minutes)
- CLI and API access remain available during Horizon upgrade
- Custom panels or themes may be incompatible with the new version
- Static assets may need cache clearing in user browsers after upgrade

### PROCEDURE

Step 1: Backup current configuration.

```bash
mkdir -p /backup/horizon-pre-upgrade-$(date +%Y%m%d)
docker cp horizon:/etc/openstack-dashboard/local_settings.py /backup/horizon-pre-upgrade-$(date +%Y%m%d)/local_settings.py
cp -r /etc/kolla/config/horizon/ /backup/horizon-pre-upgrade-$(date +%Y%m%d)/kolla-overrides/ 2>/dev/null
```

Expected result: Configuration files backed up successfully.

If unexpected: Resolve backup issues before proceeding. Do not upgrade without a backup.

Step 2: Record pre-upgrade dashboard state.

```bash
curl -so /dev/null -w "Pre-upgrade HTTP Status: %{http_code}\n" https://<kolla_external_vip_address>/auth/login/
docker inspect horizon --format '{{.Config.Image}}' > /backup/horizon-pre-upgrade-$(date +%Y%m%d)/image-tag.txt
cat /backup/horizon-pre-upgrade-$(date +%Y%m%d)/image-tag.txt
```

Expected result: HTTP Status 200 and the current container image tag recorded.

Step 3: Execute the Horizon upgrade via Kolla-Ansible.

```bash
kolla-ansible upgrade --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Upgrade completes with "PLAY RECAP" showing zero failures.

If unexpected: If the upgrade fails, check the Ansible output. Restore from backup if necessary (see OPS-HORIZON-003 Part B).

Step 4: Verify the container is running with the updated image.

```bash
docker ps --filter name=horizon --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
```

Expected result: Horizon container running with the new image tag.

If unexpected: If the container is not running, check logs:

```bash
docker logs horizon --tail 50
```

Step 5: Verify dashboard login works post-upgrade.

```bash
curl -so /dev/null -w "Post-upgrade HTTP Status: %{http_code}\n" https://<kolla_external_vip_address>/auth/login/
```

Expected result: HTTP Status 200.

If unexpected: If the login page does not load, wait 30 seconds for the container to fully initialize, then retry. If still failing, check container logs and restore from backup.

Step 6: Verify panel accessibility.

```bash
# Login and check that main panels load
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')
curl -sb /tmp/horizon-cookies -w "Login: %{http_code}\n" \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  -c /tmp/horizon-cookies \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null

# Check project dashboard (expect 200)
curl -sb /tmp/horizon-cookies -w "Project Dashboard: %{http_code}\n" \
  https://<kolla_external_vip_address>/project/ -o /dev/null

# Check admin dashboard (expect 200)
curl -sb /tmp/horizon-cookies -w "Admin Dashboard: %{http_code}\n" \
  https://<kolla_external_vip_address>/admin/ -o /dev/null
```

Expected result: Login returns 302, Project Dashboard returns 200, Admin Dashboard returns 200.

If unexpected: If panels return errors, check for API version mismatches (see OPS-HORIZON-002 Step 2).

### VERIFICATION

1. Confirm container running with new image: `docker inspect horizon --format '{{.Config.Image}}'` shows updated tag
2. Confirm HTTP 200 at login: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/` returns `200`
3. Confirm login succeeds: login curl test returns 302
4. Confirm static assets load: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/static/dashboard/css/style.css` returns `200`

### ROLLBACK

1. Stop the Horizon container: `docker stop horizon`
2. Restore configuration from pre-upgrade backup: follow OPS-HORIZON-003 Part B
3. Pin the previous container image in Kolla-Ansible configuration
4. Redeploy: `kolla-ansible deploy --tags horizon -i /etc/kolla/all-in-one`
5. Verify rollback: run OPS-HORIZON-001

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-upgrade verification)
- OPS-HORIZON-003: Backup and Restore (pre-upgrade backup)
- OpenStack Horizon Release Notes: https://docs.openstack.org/releasenotes/horizon/
- SP-6105 SS 5.4: Operations and Sustainment -- system maintenance
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- upgrade procedures

---

## OPS-HORIZON-005: Major Upgrade

```
PROCEDURE ID: OPS-HORIZON-005
TITLE: Horizon Major Upgrade
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply a major version upgrade to the Horizon dashboard (e.g., moving from one OpenStack release series to another). Includes extended pre-checks, custom panel compatibility verification, upgrade execution, and full dashboard functionality testing. Execute when upgrading between OpenStack release series.

### PRECONDITIONS

1. Horizon service is healthy (see OPS-HORIZON-001)
2. Configuration backup completed and verified (see OPS-HORIZON-003)
3. New container images for the target release are pulled and available
4. All dependent services (especially Keystone) are upgraded or compatible with the target release
5. Extended maintenance window scheduled
6. Release notes reviewed for deprecations, removed panels, and Django version changes
7. Custom panel developers notified and compatibility confirmed

### SAFETY CONSIDERATIONS

- Major upgrades may change the Django version, breaking custom panels and themes
- Session storage format may change, forcing all users to re-authenticate
- Custom local_settings.py directives may be deprecated or renamed in the new release
- CSS/JS changes may break custom themes
- Panel API calls may target different API versions in the new release

### PROCEDURE

Step 1: Perform extended pre-upgrade checks.

```bash
# Record current state
curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/ > /backup/horizon-major-pre-upgrade-$(date +%Y%m%d)-http-status.txt
docker inspect horizon --format '{{.Config.Image}}' > /backup/horizon-major-pre-upgrade-$(date +%Y%m%d)-image.txt

# Capture list of enabled panels
docker exec horizon python3 -c "
import importlib, os, sys
sys.path.insert(0, '/var/lib/openstack-dashboard')
enabled_dir = '/var/lib/openstack-dashboard/openstack_dashboard/local/enabled/'
if os.path.exists(enabled_dir):
    for f in sorted(os.listdir(enabled_dir)):
        if f.endswith('.py') and not f.startswith('_'):
            print(f)
else:
    print('No custom enabled directory')
" > /backup/horizon-major-pre-upgrade-$(date +%Y%m%d)-panels.txt
```

Expected result: HTTP status, image tag, and panel list captured.

Step 2: Verify custom panel compatibility with the target release.

```bash
# List custom panels
ls /etc/kolla/config/horizon/custom_local_settings 2>/dev/null && echo "Custom settings exist"
ls /etc/kolla/config/horizon/themes/ 2>/dev/null && echo "Custom themes exist"
```

Expected result: Identify all custom components that need compatibility verification.

If unexpected: If custom panels exist, verify they are compatible with the target Django and Horizon versions before proceeding. Consult the panel developer documentation and the Horizon release notes.

Step 3: Create full backup including all custom components.

```bash
mkdir -p /backup/horizon-major-backup-$(date +%Y%m%d)
docker cp horizon:/etc/openstack-dashboard/ /backup/horizon-major-backup-$(date +%Y%m%d)/openstack-dashboard/
docker cp horizon:/var/lib/openstack-dashboard/openstack_dashboard/themes/ /backup/horizon-major-backup-$(date +%Y%m%d)/themes/ 2>/dev/null
cp -r /etc/kolla/config/horizon/ /backup/horizon-major-backup-$(date +%Y%m%d)/kolla-overrides/ 2>/dev/null
```

Expected result: Complete Horizon configuration and customizations backed up.

Step 4: Execute the major upgrade.

```bash
kolla-ansible upgrade --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Upgrade completes with zero Ansible failures.

If unexpected: If the upgrade fails, check the Ansible output. Common failure: new Django version rejects deprecated settings in custom_local_settings. Fix the settings and re-run.

Step 5: Verify container is running with the new image.

```bash
docker ps --filter name=horizon --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"
docker inspect horizon --format '{{.Config.Image}}'
```

Expected result: Container running with the target release image.

Step 6: Perform full dashboard functionality test.

```bash
# Test login page
curl -so /dev/null -w "Login page: %{http_code}\n" https://<kolla_external_vip_address>/auth/login/

# Test authentication
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')
curl -sb /tmp/horizon-cookies -w "Login: %{http_code}\n" \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  -c /tmp/horizon-cookies \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null

# Test all panel groups
curl -sb /tmp/horizon-cookies -w "Project: %{http_code}\n" https://<kolla_external_vip_address>/project/ -o /dev/null
curl -sb /tmp/horizon-cookies -w "Admin: %{http_code}\n" https://<kolla_external_vip_address>/admin/ -o /dev/null
curl -sb /tmp/horizon-cookies -w "Identity: %{http_code}\n" https://<kolla_external_vip_address>/identity/ -o /dev/null

# Test static assets
curl -so /dev/null -w "Static CSS: %{http_code}\n" https://<kolla_external_vip_address>/static/dashboard/css/style.css
curl -so /dev/null -w "Static JS: %{http_code}\n" https://<kolla_external_vip_address>/static/dashboard/js/horizon.js
```

Expected result: Login page 200, login 302, all panel groups 200, static assets 200.

If unexpected: If specific panels fail while others work, check API version configuration (see OPS-HORIZON-002) and service catalog (see OPS-KEYSTONE-001).

Step 7: Verify custom panels and themes render correctly.

```bash
# If custom themes were installed, check they still render
curl -sb /tmp/horizon-cookies -so /dev/null -w "Custom theme CSS: %{http_code}\n" \
  https://<kolla_external_vip_address>/static/themes/<theme-name>/_styles.css 2>/dev/null || echo "No custom theme to verify"
```

Expected result: Custom theme assets return 200, or "No custom theme to verify" if none were installed.

If unexpected: If custom themes fail, they may need updating for the new Django/Horizon version. Restore the default theme and consult OPS-HORIZON-010.

### VERIFICATION

1. Confirm container running with new image: `docker inspect horizon --format '{{.Config.Image}}'`
2. Confirm login page accessible: HTTP 200 at `/auth/login/`
3. Confirm authentication works: login curl test returns 302
4. Confirm all panel groups accessible: Project, Admin, Identity all return 200
5. Confirm static assets load: CSS and JS return 200
6. Confirm custom panels render (if applicable)
7. Run OPS-HORIZON-001 full health check

### ROLLBACK

1. Stop the Horizon container: `docker stop horizon`
2. Restore Kolla-Ansible overrides from major backup: `cp -r /backup/horizon-major-backup-YYYYMMDD/kolla-overrides/* /etc/kolla/config/horizon/`
3. Pin the previous container image in Kolla-Ansible configuration
4. Redeploy: `kolla-ansible deploy --tags horizon -i /etc/kolla/all-in-one`
5. Verify rollback: run OPS-HORIZON-001
6. Notify users that the upgrade has been rolled back

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-upgrade verification)
- OPS-HORIZON-003: Backup and Restore (pre-upgrade backup)
- OPS-HORIZON-009: Custom Panel Deployment (panel compatibility check)
- OPS-HORIZON-010: Theme Configuration (theme compatibility check)
- OPS-KEYSTONE-005: Keystone Major Upgrade (coordinate upgrade order)
- OpenStack Horizon Release Notes: https://docs.openstack.org/releasenotes/horizon/
- OpenStack Horizon Upgrade Guide: https://docs.openstack.org/horizon/2024.2/admin/upgrades.html
- SP-6105 SS 5.4: Operations and Sustainment -- major system maintenance
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- major upgrade procedures

---

## OPS-HORIZON-006: Troubleshooting Common Failures

```
PROCEDURE ID: OPS-HORIZON-006
TITLE: Troubleshooting Common Horizon Failures
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Diagnose and resolve the most common Horizon dashboard failures: 500 Internal Server Error (memcached connection, Keystone unreachable), blank dashboard after login, session timeout issues, static asset loading failures, and CORS errors. Use this procedure when the dashboard is malfunctioning.

### PRECONDITIONS

1. Docker daemon is running on the control node
2. Network access to the dashboard URL
3. Access to container logs via Docker
4. Administrator credentials available for testing

### SAFETY CONSIDERATIONS

- Some troubleshooting steps require container restart, causing brief dashboard downtime
- Flushing memcached cache forces all users to re-authenticate
- Modifying configuration requires testing before applying to production
- Users may lose unsaved work if the dashboard is restarted during active sessions

### PROCEDURE

**Failure Mode A: 500 Internal Server Error -- Memcached Connection**

Step 1: Verify memcached is running.

```bash
docker ps --filter name=memcached --format "table {{.Names}}\t{{.Status}}"
```

Expected result: Memcached container listed with status "Up".

If unexpected: If memcached is not running, restart it:

```bash
docker restart memcached
```

Step 2: Test memcached connectivity from Horizon.

```bash
docker exec horizon python3 -c "
import socket
try:
    s = socket.create_connection(('memcached', 11211), timeout=5)
    s.close()
    print('Memcached connectivity: OK')
except Exception as e:
    print(f'Memcached connectivity: FAILED - {e}')
"
```

Expected result: "Memcached connectivity: OK"

If unexpected: If connectivity fails, check the Docker network:

```bash
docker network inspect kolla 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
for net in data:
    containers = net.get('Containers', {})
    for cid, info in containers.items():
        if 'memcached' in info.get('Name', '') or 'horizon' in info.get('Name', ''):
            print(f'{info[\"Name\"]}: {info[\"IPv4Address\"]}')
"
```

Step 3: Verify memcached has available memory.

```bash
docker exec memcached sh -c 'echo "stats" | nc localhost 11211' | grep -E "curr_items|bytes |limit_maxbytes|evictions"
```

Expected result: `evictions` should be 0 or very low. `bytes` should be well below `limit_maxbytes`.

If unexpected: If evictions are high, increase memcached memory in `/etc/kolla/globals.yml`:

```bash
# Add to globals.yml:
# memcached_max_memory: 512
kolla-ansible reconfigure --tags memcached
```

**Failure Mode B: 500 Internal Server Error -- Keystone Unreachable**

Step 4: Test Keystone connectivity from Horizon.

```bash
docker exec horizon curl -s http://keystone-internal:5000/v3/ | python3 -m json.tool
```

Expected result: JSON response with Keystone version information.

If unexpected: If Keystone is unreachable, verify Keystone is running (see OPS-KEYSTONE-001). If Keystone is running but unreachable from Horizon, check Docker networking between the containers.

Step 5: Verify Keystone endpoint in Horizon configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'OPENSTACK_KEYSTONE_URL: {settings.OPENSTACK_KEYSTONE_URL}')
"
```

Expected result: URL matches the Keystone internal endpoint.

If unexpected: If the URL is incorrect, update the Kolla-Ansible Horizon override and reconfigure:

```bash
echo 'OPENSTACK_KEYSTONE_URL = "http://keystone-internal:5000/v3"' >> /etc/kolla/config/horizon/custom_local_settings
kolla-ansible reconfigure --tags horizon
```

**Failure Mode C: Blank Dashboard After Login**

Step 6: Check for JavaScript errors.

```bash
# Verify JS assets are loading
curl -so /dev/null -w "horizon.js: %{http_code}\n" https://<kolla_external_vip_address>/static/dashboard/js/horizon.js
curl -so /dev/null -w "angular: %{http_code}\n" https://<kolla_external_vip_address>/static/framework/js/angular/angular.js 2>/dev/null
```

Expected result: HTTP Status 200 for all JavaScript assets.

If unexpected: If JavaScript assets return 404, the static file collection may be incomplete. Restart the container:

```bash
docker restart horizon
```

Step 7: Verify the service catalog returns expected services.

```bash
openstack catalog list -f table
```

Expected result: All expected services listed (keystone, nova, neutron, cinder, glance, heat, etc.).

If unexpected: If services are missing from the catalog, their panels will not render. Re-register missing services via Keystone (see OPS-KEYSTONE-001).

**Failure Mode D: Session Timeout Issues**

Step 8: Check session timeout configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'SESSION_COOKIE_AGE: {getattr(settings, \"SESSION_COOKIE_AGE\", \"not set\")}')
print(f'SESSION_TIMEOUT: {getattr(settings, \"SESSION_TIMEOUT\", \"not set\")}')
"
```

Expected result: SESSION_COOKIE_AGE and/or SESSION_TIMEOUT set to expected values (default 3600 seconds).

Step 9: Check for memcached session evictions.

```bash
docker exec memcached sh -c 'echo "stats" | nc localhost 11211' | grep evictions
```

Expected result: Low or zero evictions.

If unexpected: If evictions are high, users experience premature session loss. See Step 3 for memcached memory increase.

**Failure Mode E: Static Asset Loading Failures**

Step 10: Verify static file serving.

```bash
curl -sI https://<kolla_external_vip_address>/static/dashboard/css/style.css | head -5
```

Expected result: HTTP 200 with Content-Type: text/css.

If unexpected: If static files return 404:

```bash
# Verify static files exist in the container
docker exec horizon ls /var/lib/openstack-dashboard/static/dashboard/css/style.css
```

If the file exists in the container but is not served, check the web server configuration. Restart the container:

```bash
docker restart horizon
```

Step 11: Clear browser-cached stale assets.

Advise users to clear browser cache or access the dashboard in an incognito/private window. Horizon includes cache-busting hashes in some asset URLs, but custom themes may not.

**Failure Mode F: CORS Errors**

Step 12: Check CORS configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}')
print(f'CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE}')
print(f'CSRF_COOKIE_HTTPONLY: {settings.CSRF_COOKIE_HTTPONLY}')
"
```

Expected result: ALLOWED_HOSTS includes the dashboard hostname. CSRF_COOKIE_SECURE is `True` for HTTPS deployments.

If unexpected: If ALLOWED_HOSTS does not include the hostname users access, add it:

```bash
echo "ALLOWED_HOSTS = ['cloud.example.com', '<kolla_external_vip_address>']" >> /etc/kolla/config/horizon/custom_local_settings
kolla-ansible reconfigure --tags horizon
```

Step 13: Verify HTTPS configuration consistency.

```bash
# Check if mixed content (HTTP/HTTPS) is causing CORS issues
curl -sI https://<kolla_external_vip_address>/auth/login/ | grep -i "content-security-policy\|strict-transport"
```

Expected result: Security headers present. No mixed-content issues.

If unexpected: If mixed content is detected, ensure all endpoints use HTTPS consistently. Check HAProxy configuration for correct TLS termination.

### VERIFICATION

1. After resolving any failure, verify HTTP 200 at login page: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/`
2. Confirm login succeeds with valid credentials
3. Confirm all panels load without errors
4. Run OPS-HORIZON-001 full health check

### ROLLBACK

Rollback depends on the failure mode:
- **Memcached issues:** Restart memcached container (users re-authenticate)
- **Keystone unreachable:** Resolve Keystone issue first (see OPS-KEYSTONE-006)
- **Blank dashboard:** Restart Horizon container; if persistent, restore from backup (see OPS-HORIZON-003)
- **Session timeout:** Adjust configuration and reconfigure
- **Static assets:** Restart container to regenerate; if persistent, redeploy
- **CORS errors:** Fix configuration and reconfigure

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-troubleshooting verification)
- OPS-HORIZON-002: Configuration Verification (settings validation)
- OPS-KEYSTONE-001: Keystone Service Health Check (authentication dependency)
- OPS-KEYSTONE-006: Keystone Troubleshooting (auth-related failures)
- OpenStack Horizon Troubleshooting: https://docs.openstack.org/horizon/2024.2/admin/troubleshooting.html
- SP-6105 SS 5.4: Operations and Sustainment -- fault management
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- troubleshooting procedures

---

## OPS-HORIZON-007: Security Audit

```
PROCEDURE ID: OPS-HORIZON-007
TITLE: Horizon Security Audit
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Audit the security configuration of the Horizon dashboard including session configuration (cookie flags, timeout), Content Security Policy header verification, HTTPS enforcement, password complexity settings, and two-factor authentication status. Execute monthly or after any security-related configuration change.

### PRECONDITIONS

1. Horizon service is running (see OPS-HORIZON-001)
2. Access to the Horizon container via Docker
3. Network access to the dashboard URL
4. Knowledge of the expected security baseline

### SAFETY CONSIDERATIONS

- This procedure is read-only and does not modify security settings
- Audit output may contain sensitive configuration details
- Store audit results in a secure location with restricted access
- Do not share audit results through insecure channels

### PROCEDURE

Step 1: Audit session cookie configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print('=== Session Security Configuration ===')
print(f'SESSION_COOKIE_SECURE: {settings.SESSION_COOKIE_SECURE}')
print(f'SESSION_COOKIE_HTTPONLY: {settings.SESSION_COOKIE_HTTPONLY}')
print(f'SESSION_COOKIE_SAMESITE: {getattr(settings, \"SESSION_COOKIE_SAMESITE\", \"not set\")}')
print(f'SESSION_COOKIE_AGE: {settings.SESSION_COOKIE_AGE}')
print(f'SESSION_ENGINE: {settings.SESSION_ENGINE}')
"
```

Expected result:
- SESSION_COOKIE_SECURE: `True` (required for HTTPS deployments)
- SESSION_COOKIE_HTTPONLY: `True` (prevents JavaScript access to session cookie)
- SESSION_COOKIE_SAMESITE: `Lax` or `Strict` (prevents CSRF via cross-site requests)
- SESSION_COOKIE_AGE: reasonable value (3600-7200 seconds)

If unexpected: If cookie flags are insecure, update the configuration:

```bash
cat >> /etc/kolla/config/horizon/custom_local_settings << 'EOF'
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
EOF
kolla-ansible reconfigure --tags horizon
```

Step 2: Verify CSRF protection configuration.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print('=== CSRF Configuration ===')
print(f'CSRF_COOKIE_SECURE: {settings.CSRF_COOKIE_SECURE}')
print(f'CSRF_COOKIE_HTTPONLY: {getattr(settings, \"CSRF_COOKIE_HTTPONLY\", \"not set\")}')
"
```

Expected result: CSRF_COOKIE_SECURE is `True` for HTTPS. CSRF_COOKIE_HTTPONLY is `True`.

If unexpected: Update CSRF settings in the configuration override.

Step 3: Verify Content Security Policy (CSP) headers.

```bash
curl -sI https://<kolla_external_vip_address>/auth/login/ | grep -i "content-security-policy\|x-content-type-options\|x-frame-options\|x-xss-protection\|strict-transport-security"
```

Expected result: Security headers present:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` or `SAMEORIGIN`
- `Strict-Transport-Security` header present (for HTTPS)

If unexpected: If security headers are missing, configure them in the web server or Horizon settings.

Step 4: Verify HTTPS enforcement.

```bash
# Check if HTTP redirects to HTTPS
curl -so /dev/null -w "HTTP redirect: %{http_code}\n" http://<kolla_external_vip_address>/auth/login/

# Check HSTS header
curl -sI https://<kolla_external_vip_address>/auth/login/ | grep -i "strict-transport-security"
```

Expected result: HTTP request returns 301/302 redirect to HTTPS. HSTS header is present with reasonable max-age.

If unexpected: If HTTP is accessible without redirect, configure HAProxy to redirect HTTP to HTTPS.

Step 5: Verify password complexity settings (if configured).

```bash
docker exec horizon python3 -c "
from django.conf import settings
password_settings = {
    'ENFORCE_PASSWORD_CHECK': getattr(settings, 'ENFORCE_PASSWORD_CHECK', 'not set'),
    'PASSWORD_AUTOCOMPLETE': getattr(settings, 'PASSWORD_AUTOCOMPLETE', 'not set'),
}
print('=== Password Settings ===')
for k, v in password_settings.items():
    print(f'{k}: {v}')
"
```

Expected result: ENFORCE_PASSWORD_CHECK is `True` (if password validation is desired). PASSWORD_AUTOCOMPLETE is `off` (prevents browser autocomplete on login).

Step 6: Check two-factor authentication status.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print('=== Multi-Factor Authentication ===')
print(f'OPENSTACK_KEYSTONE_MFA_TOTP_ENABLED: {getattr(settings, \"OPENSTACK_KEYSTONE_MFA_TOTP_ENABLED\", \"not configured\")}')
print(f'WEBSSO_ENABLED: {getattr(settings, \"WEBSSO_ENABLED\", \"not configured\")}')
"
```

Expected result: MFA/TOTP status matches the security baseline. WEBSSO_ENABLED indicates whether external identity provider integration is active.

Step 7: Verify ALLOWED_HOSTS is restricted.

```bash
docker exec horizon python3 -c "
from django.conf import settings
allowed = settings.ALLOWED_HOSTS
if '*' in allowed:
    print('WARNING: ALLOWED_HOSTS contains wildcard (*) -- restrict in production')
else:
    print(f'ALLOWED_HOSTS: {allowed}')
"
```

Expected result: ALLOWED_HOSTS lists specific hostnames, not `['*']`.

If unexpected: Restrict ALLOWED_HOSTS to the actual dashboard hostname(s):

```bash
echo "ALLOWED_HOSTS = ['cloud.example.com']" >> /etc/kolla/config/horizon/custom_local_settings
kolla-ansible reconfigure --tags horizon
```

Step 8: Audit Horizon access logs for suspicious activity.

```bash
docker logs horizon --tail 500 2>&1 | grep -E "401|403|500" | tail -20
```

Expected result: Low count of error responses. No patterns suggesting brute-force login attempts.

If unexpected: If 401/403 counts are unusually high, investigate for brute-force attacks. Consider implementing rate limiting at the HAProxy or web server level.

### VERIFICATION

1. Confirm SESSION_COOKIE_SECURE is True: `docker exec horizon python3 -c "from django.conf import settings; print(settings.SESSION_COOKIE_SECURE)"` returns `True`
2. Confirm CSRF_COOKIE_SECURE is True: `docker exec horizon python3 -c "from django.conf import settings; print(settings.CSRF_COOKIE_SECURE)"` returns `True`
3. Confirm HTTPS enforcement: `curl -so /dev/null -w "%{http_code}" http://<kolla_external_vip_address>/auth/login/` returns `301` or `302`
4. Confirm ALLOWED_HOSTS does not contain wildcard: `docker exec horizon python3 -c "from django.conf import settings; print('*' not in settings.ALLOWED_HOSTS)"`

### ROLLBACK

This procedure is read-only. If security settings were changed to resolve audit findings:

1. Document all changes made during the audit
2. Revert changes by restoring the previous custom_local_settings from backup
3. Run `kolla-ansible reconfigure --tags horizon` to re-apply the previous configuration

### REFERENCES

- OPS-KEYSTONE-007: Keystone Security Audit (authentication security baseline)
- OPS-HORIZON-001: Service Health Check (dashboard availability)
- OpenStack Horizon Security Configuration: https://docs.openstack.org/horizon/2024.2/admin/security.html
- OpenStack Security Guide -- Dashboard: https://docs.openstack.org/security-guide/dashboard.html
- OWASP Secure Headers Project: https://owasp.org/www-project-secure-headers/
- SP-6105 SS 5.4: Operations and Sustainment -- security monitoring
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- security audit procedures

---

## OPS-HORIZON-008: Session Management

```
PROCEDURE ID: OPS-HORIZON-008
TITLE: Horizon Session Management
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Configure and manage Horizon session backend (memcached or database), set session timeout parameters, clear stale sessions, and monitor active session counts. Execute when adjusting session behavior, troubleshooting session issues, or performing routine session maintenance.

### PRECONDITIONS

1. Horizon service is running (see OPS-HORIZON-001)
2. Access to the Horizon container via Docker
3. Access to the memcached container (if using memcached backend)
4. Administrator credentials for testing session functionality

### SAFETY CONSIDERATIONS

- Changing the session backend forces all users to re-authenticate
- Flushing sessions immediately logs out all active dashboard users
- Session timeout changes take effect on the next login, not for existing sessions
- Switching from memcached to database backend requires Django migration

### PROCEDURE

Step 1: Identify the current session backend.

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'Session Engine: {settings.SESSION_ENGINE}')
print(f'Session Cookie Age: {settings.SESSION_COOKIE_AGE} seconds')
"
```

Expected result: Session engine is either `django.contrib.sessions.backends.cache` (memcached) or `django.contrib.sessions.backends.db` (database).

Step 2: Configure session timeout.

To change the session timeout, update the Kolla-Ansible override:

```bash
cat >> /etc/kolla/config/horizon/custom_local_settings << 'EOF'
SESSION_TIMEOUT = 7200  # 2 hours in seconds
EOF
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Reconfiguration completes. New sessions use the updated timeout.

If unexpected: If reconfiguration fails, check the override file for syntax errors:

```bash
python3 -c "exec(open('/etc/kolla/config/horizon/custom_local_settings').read())"
```

Step 3: Monitor active sessions (memcached backend).

```bash
docker exec memcached sh -c 'echo "stats" | nc localhost 11211' | grep -E "curr_items|total_items|evictions|bytes |limit_maxbytes"
```

Expected result: `curr_items` shows active session count. `evictions` should be 0 or very low. `bytes` well below `limit_maxbytes`.

If unexpected: If `curr_items` is unexpectedly high, sessions may not be expiring properly. If `evictions` is high, memcached needs more memory.

Step 4: Clear all stale sessions (memcached backend).

```bash
docker exec memcached sh -c 'echo "flush_all" | nc localhost 11211'
```

Expected result: `OK` -- all cached sessions are cleared. All active users must re-authenticate.

If unexpected: If the command fails, verify memcached is accepting connections:

```bash
docker exec memcached sh -c 'echo "version" | nc localhost 11211'
```

Step 5: Switch to database session backend (if needed).

```bash
cat >> /etc/kolla/config/horizon/custom_local_settings << 'EOF'
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
EOF
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Horizon restarts with database session backend. Sessions persist across memcached restarts.

If unexpected: If the database session table does not exist, run the Django migration:

```bash
docker exec horizon python3 /var/lib/openstack-dashboard/manage.py migrate sessions
```

Step 6: Clean up expired database sessions (database backend).

```bash
docker exec horizon python3 /var/lib/openstack-dashboard/manage.py clearsessions
```

Expected result: Expired session records removed from the database.

If unexpected: If the command fails, verify database connectivity from the Horizon container.

Step 7: Verify session functionality after changes.

```bash
# Test login creates a session
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')
curl -sb /tmp/horizon-cookies -w "Login: %{http_code}\n" \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  -c /tmp/horizon-cookies \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null

# Verify session persists (access a protected page)
curl -sb /tmp/horizon-cookies -w "Session valid: %{http_code}\n" \
  https://<kolla_external_vip_address>/project/ -o /dev/null
```

Expected result: Login returns 302. Subsequent request to /project/ returns 200 (session is valid).

If unexpected: If the session does not persist, check the session backend configuration and cookie settings.

### VERIFICATION

1. Confirm session engine matches expected configuration: `docker exec horizon python3 -c "from django.conf import settings; print(settings.SESSION_ENGINE)"`
2. Confirm session timeout is set correctly: `docker exec horizon python3 -c "from django.conf import settings; print(settings.SESSION_COOKIE_AGE)"`
3. Confirm login creates a working session: login and subsequent request succeed
4. Confirm session cleanup works: stale session count is reduced after cleanup

### ROLLBACK

If session configuration changes cause issues:

1. Remove the session configuration from custom_local_settings
2. Run `kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one`
3. Flush memcached to clear any corrupted sessions: `docker exec memcached sh -c 'echo "flush_all" | nc localhost 11211'`
4. Verify login works: run OPS-HORIZON-001

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-change verification)
- OPS-HORIZON-006: Troubleshooting Common Failures (session-related failures)
- OPS-KEYSTONE-001: Keystone Service Health Check (authentication dependency)
- OpenStack Horizon Session Configuration: https://docs.openstack.org/horizon/2024.2/configuration/settings.html#sessions
- Django Session Documentation: https://docs.djangoproject.com/en/4.2/topics/http/sessions/
- SP-6105 SS 5.4: Operations and Sustainment -- session management
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- session management procedures

---

## OPS-HORIZON-009: Custom Panel Deployment

```
PROCEDURE ID: OPS-HORIZON-009
TITLE: Custom Panel Deployment
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Install custom dashboard panels, configure panel group ordering, enable or disable default panels, and verify custom panel rendering. Execute when adding third-party panels, modifying the dashboard layout, or disabling unused functionality.

### PRECONDITIONS

1. Horizon service is running (see OPS-HORIZON-001)
2. Configuration backup completed (see OPS-HORIZON-003)
3. Custom panel package or configuration files available
4. Compatibility of the custom panel with the current Horizon and Django version verified

### SAFETY CONSIDERATIONS

- Incompatible panels can crash the entire Horizon dashboard
- Always test custom panels in a non-production environment first
- Panel configuration errors may prevent the dashboard from starting
- Backup the current configuration before making any panel changes

### PROCEDURE

Step 1: List currently enabled panels.

```bash
docker exec horizon python3 -c "
import os
enabled_dir = '/var/lib/openstack-dashboard/openstack_dashboard/local/enabled/'
if os.path.exists(enabled_dir):
    for f in sorted(os.listdir(enabled_dir)):
        if f.endswith('.py') and not f.startswith('_'):
            print(f)
else:
    print('No enabled directory found')
"
```

Expected result: List of panel configuration files (e.g., `_1000_project.py`, `_2000_admin.py`, `_3000_identity.py`).

Step 2: Disable a default panel.

To disable a panel, create a configuration file that sets `DISABLED = True`:

```bash
mkdir -p /etc/kolla/config/horizon/
cat > /etc/kolla/config/horizon/custom_local_settings << 'PYEOF'
# Disable Heat stacks panel if Heat is not deployed
OPENSTACK_HEAT_STACK = {
    'enable': False,
}
PYEOF
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Reconfiguration completes. The disabled panel no longer appears in the dashboard.

If unexpected: If the dashboard fails to start, check for Python syntax errors in the override file.

Step 3: Install a custom panel via Kolla-Ansible override.

```bash
# Create the panel configuration
mkdir -p /etc/kolla/config/horizon/
cat > /etc/kolla/config/horizon/_5000_custom_panel.py << 'PYEOF'
# Custom panel group configuration
PANEL_GROUP = 'custom'
PANEL_GROUP_NAME = 'Custom Operations'
PANEL_GROUP_DASHBOARD = 'project'
PYEOF

# Apply the configuration
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Reconfiguration completes. The custom panel group appears in the dashboard navigation.

If unexpected: If the panel does not appear, check that the configuration file was deployed to the container:

```bash
docker exec horizon ls /var/lib/openstack-dashboard/openstack_dashboard/local/enabled/ | grep custom
```

Step 4: Configure panel group ordering.

Panel files are loaded in alphabetical order. The numeric prefix controls ordering:

```
_1000_*.py  - Project panels (first group)
_2000_*.py  - Admin panels (second group)
_3000_*.py  - Identity panels (third group)
_5000_*.py  - Custom panels (after default groups)
```

To reorder, rename the configuration file with a different prefix:

```bash
# Move custom panel to appear before admin panels
mv /etc/kolla/config/horizon/_5000_custom_panel.py /etc/kolla/config/horizon/_1500_custom_panel.py
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Panel group appears in the new position in the dashboard navigation.

Step 5: Verify custom panel rendering.

```bash
# Login to the dashboard
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')
curl -sb /tmp/horizon-cookies \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  -c /tmp/horizon-cookies \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null

# Access the custom panel URL
curl -sb /tmp/horizon-cookies -w "Custom Panel: %{http_code}\n" \
  https://<kolla_external_vip_address>/project/custom/ -o /dev/null
```

Expected result: Custom Panel returns 200.

If unexpected: If the panel returns 404 or 500, check the Horizon logs:

```bash
docker logs horizon --tail 50 2>&1 | grep -i "error\|exception"
```

Step 6: Enable a previously disabled default panel.

```bash
# Remove the disable directive from custom_local_settings
# Edit /etc/kolla/config/horizon/custom_local_settings and remove the OPENSTACK_HEAT_STACK = {'enable': False} line
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: The panel reappears in the dashboard navigation.

### VERIFICATION

1. Confirm panel list includes the custom panel: `docker exec horizon ls /var/lib/openstack-dashboard/openstack_dashboard/local/enabled/ | grep custom`
2. Confirm dashboard loads without errors: `curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/` returns `200`
3. Confirm custom panel is accessible: curl test to the panel URL returns 200
4. Confirm panel ordering matches expectations: visual inspection or navigation order check
5. Run OPS-HORIZON-001 full health check

### ROLLBACK

1. Remove the custom panel configuration: `rm /etc/kolla/config/horizon/_5000_custom_panel.py`
2. Restore the original custom_local_settings from backup
3. Redeploy: `kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one`
4. Verify: run OPS-HORIZON-001

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-deployment verification)
- OPS-HORIZON-003: Backup and Restore (pre-change backup)
- OpenStack Horizon Plugin Guide: https://docs.openstack.org/horizon/2024.2/contributor/tutorials/plugin.html
- OpenStack Horizon Panel Configuration: https://docs.openstack.org/horizon/2024.2/configuration/customizing.html
- SP-6105 SS 5.5: Product Transition -- custom component deployment
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- custom panel deployment

---

## OPS-HORIZON-010: Theme Configuration

```
PROCEDURE ID: OPS-HORIZON-010
TITLE: Horizon Theme Configuration
SE PHASE: Phase E (Operations & Sustainment)
NPR REFERENCE: NPR 7123.1 SS 3.2 Process 9 (Product Transition)
LAST VERIFIED: 2026-02-23 against OpenStack 2024.2 (Dalmatian)
VERIFIED BY: doc-verifier agent
```

### PURPOSE

Apply custom branding to the Horizon dashboard including color scheme, logos, favicon, help URLs, and site branding text. Verify theme rendering across the login page, main dashboard, and admin panels. Execute when branding the dashboard for an organization or updating existing theme assets.

### PRECONDITIONS

1. Horizon service is running (see OPS-HORIZON-001)
2. Configuration backup completed (see OPS-HORIZON-003)
3. Custom theme assets prepared (logos, SCSS/CSS, favicon)
4. Logo files in SVG or PNG format, appropriately sized

### SAFETY CONSIDERATIONS

- Invalid SCSS/CSS in custom themes can break the dashboard layout
- Missing logo files cause rendering errors but do not crash the service
- Theme changes require container reconfiguration to take effect
- Always test custom themes in a non-production environment first

### PROCEDURE

Step 1: Create the custom theme directory structure.

```bash
mkdir -p /etc/kolla/config/horizon/themes/custom-theme/static/img/
```

Expected result: Directory structure created.

Step 2: Place custom logo and favicon files.

```bash
# Copy custom logos (replace with actual file paths)
cp /path/to/logo.svg /etc/kolla/config/horizon/themes/custom-theme/static/img/logo.svg
cp /path/to/logo-splash.svg /etc/kolla/config/horizon/themes/custom-theme/static/img/logo-splash.svg
cp /path/to/favicon.ico /etc/kolla/config/horizon/themes/custom-theme/static/img/favicon.ico
```

Expected result: Logo and favicon files placed in the theme directory.

If unexpected: If source files do not exist, create placeholder files or skip this step to use default branding for the respective elements.

Step 3: Create custom CSS/SCSS for the theme.

```bash
cat > /etc/kolla/config/horizon/themes/custom-theme/static/_styles.scss << 'EOF'
/* Custom theme styles */

/* Primary color override */
$brand-primary: #003366;

/* Navigation bar */
.topbar {
  background-color: #003366;
}

/* Login page */
.login {
  background-color: #f0f0f0;
}

/* Footer branding */
.footer {
  background-color: #003366;
  color: #ffffff;
}
EOF
```

Expected result: Custom SCSS file created with theme overrides.

Step 4: Configure Horizon to use the custom theme.

```bash
cat >> /etc/kolla/config/horizon/custom_local_settings << 'PYEOF'
SITE_BRANDING = "My Organization Cloud"

AVAILABLE_THEMES = [
    ('default', 'Default', 'themes/default'),
    ('custom-theme', 'Organization Theme', 'themes/custom-theme'),
]
DEFAULT_THEME = 'custom-theme'

# Custom help URL
HORIZON_CONFIG["help_url"] = "https://docs.example.com/cloud-help"
PYEOF
```

Expected result: Theme configuration added to the settings override.

Step 5: Apply the theme via Kolla-Ansible reconfiguration.

```bash
kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one
```

Expected result: Reconfiguration completes with zero failures. Horizon container rebuilds with the custom theme.

If unexpected: If reconfiguration fails, check for Python syntax errors in the settings file:

```bash
python3 -c "exec(open('/etc/kolla/config/horizon/custom_local_settings').read())"
```

Step 6: Verify theme rendering on the login page.

```bash
# Check login page loads
curl -so /dev/null -w "Login Page: %{http_code}\n" https://<kolla_external_vip_address>/auth/login/

# Check custom branding text
curl -s https://<kolla_external_vip_address>/auth/login/ | grep -o "My Organization Cloud" || echo "Custom branding not found"

# Check custom logo
curl -so /dev/null -w "Custom Logo: %{http_code}\n" https://<kolla_external_vip_address>/static/themes/custom-theme/static/img/logo.svg 2>/dev/null || echo "Custom logo path may differ"

# Check favicon
curl -so /dev/null -w "Favicon: %{http_code}\n" https://<kolla_external_vip_address>/static/themes/custom-theme/static/img/favicon.ico 2>/dev/null || echo "Favicon path may differ"
```

Expected result: Login page returns 200. Custom branding text found. Logo and favicon return 200.

If unexpected: If branding text is not found, verify the SITE_BRANDING setting was applied:

```bash
docker exec horizon python3 -c "
from django.conf import settings
print(f'SITE_BRANDING: {settings.SITE_BRANDING}')
print(f'DEFAULT_THEME: {getattr(settings, \"DEFAULT_THEME\", \"not set\")}')
"
```

Step 7: Verify theme rendering on the main dashboard.

```bash
# Login
CSRF_TOKEN=$(curl -sc /tmp/horizon-cookies https://<kolla_external_vip_address>/auth/login/ 2>/dev/null | grep -oP 'name="csrfmiddlewaretoken" value="\K[^"]+')
curl -sb /tmp/horizon-cookies \
  -d "csrfmiddlewaretoken=${CSRF_TOKEN}&username=admin&password=<admin-password>&region=https://<kolla_external_vip_address>:5000/v3" \
  -c /tmp/horizon-cookies \
  https://<kolla_external_vip_address>/auth/login/ -o /dev/null

# Check dashboard with custom theme
curl -sb /tmp/horizon-cookies -w "Dashboard: %{http_code}\n" \
  https://<kolla_external_vip_address>/project/ -o /dev/null

# Check admin panel with custom theme
curl -sb /tmp/horizon-cookies -w "Admin Panel: %{http_code}\n" \
  https://<kolla_external_vip_address>/admin/ -o /dev/null
```

Expected result: Dashboard and admin panel return 200. Theme renders consistently across both.

Step 8: Configure help URLs.

```bash
# Verify help URL configuration
docker exec horizon python3 -c "
from django.conf import settings
print(f'HELP_URL: {settings.HORIZON_CONFIG.get(\"help_url\", \"not set\")}')
"
```

Expected result: Help URL matches the configured value.

If unexpected: If the help URL is not set, add it to the settings override and reconfigure.

### VERIFICATION

1. Confirm custom theme is active: `docker exec horizon python3 -c "from django.conf import settings; print(getattr(settings, 'DEFAULT_THEME', 'default'))"` returns the custom theme name
2. Confirm SITE_BRANDING is set: `docker exec horizon python3 -c "from django.conf import settings; print(settings.SITE_BRANDING)"` returns the custom branding
3. Confirm login page renders with custom branding: `curl -s https://<kolla_external_vip_address>/auth/login/ | grep -c 'My Organization Cloud'` returns at least 1
4. Confirm dashboard loads with custom theme: HTTP 200 on /project/ and /admin/
5. Run OPS-HORIZON-001 full health check

### ROLLBACK

1. Remove the custom theme from settings:
   - Edit `/etc/kolla/config/horizon/custom_local_settings`
   - Remove SITE_BRANDING, AVAILABLE_THEMES, DEFAULT_THEME lines
2. Remove the custom theme directory: `rm -rf /etc/kolla/config/horizon/themes/custom-theme/`
3. Reconfigure: `kolla-ansible reconfigure --tags horizon -i /etc/kolla/all-in-one`
4. Verify default theme restored: run OPS-HORIZON-001

### REFERENCES

- OPS-HORIZON-001: Service Health Check (post-theme verification)
- OPS-HORIZON-003: Backup and Restore (pre-change backup)
- OPS-HORIZON-005: Major Upgrade (theme compatibility during upgrades)
- OpenStack Horizon Theming Guide: https://docs.openstack.org/horizon/2024.2/configuration/themes.html
- OpenStack Horizon Customization Guide: https://docs.openstack.org/horizon/2024.2/configuration/customizing.html
- SP-6105 SS 5.5: Product Transition -- custom branding deployment
- NPR 7123.1 SS 3.2 Process 9: Product Transition -- theme configuration procedures
