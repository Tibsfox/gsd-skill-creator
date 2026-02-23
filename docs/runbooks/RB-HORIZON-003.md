RUNBOOK: RB-HORIZON-003 -- Panel and Plugin Configuration
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Horizon host
2. Docker CLI available on the host
3. Admin credentials sourced (`source /etc/kolla/admin-openrc.sh`)
4. Dashboard is accessible and login works -- if not, see RB-HORIZON-001 and RB-HORIZON-002 first
5. Knowledge of which panel(s) are missing or failing

## PROCEDURE

Step 1: Identify missing or broken panels
```bash
# Log in to the dashboard and note which panels are missing or show errors
# Common missing panels: Heat (Orchestration), Swift (Object Store), Cinder (Volumes)
# Panels that load but show errors are a different issue (API version mismatch)
```
Expected: Specific panels identified as missing or broken
If not: Compare visible panels against expected panels based on enabled services

Step 2: Check service catalog for missing services
```bash
openstack catalog list
```
Expected: Every enabled OpenStack service appears in the catalog with correct endpoints (admin, internal, public)
If not: Missing services will not have panels in Horizon. Register the missing service:
```bash
# If a service is missing from the catalog, re-run post-deploy:
kolla-ansible -i inventory post-deploy
```

Step 3: Check enabled panel files inside Horizon container
```bash
docker exec horizon ls /usr/share/openstack-dashboard/openstack_dashboard/local/enabled/
```
Expected: Files like `_1000_project.py`, `_2000_admin.py`, `_3000_identity.py` and service-specific panel files (e.g., `_1610_project_orchestration_stacks_panel.py` for Heat)
If not: If a panel definition file is missing, the service may not have been enabled when the Horizon container was built. Re-deploy Horizon:
```bash
kolla-ansible -i inventory reconfigure --tags horizon
```

Step 4: Verify OPENSTACK_API_VERSIONS configuration
```bash
docker exec horizon python3 -c "
from openstack_dashboard import settings
print('API_VERSIONS:', settings.OPENSTACK_API_VERSIONS)
"
```
Expected: API versions match the deployed service versions:
```
{'identity': 3, 'image': 2, 'volume': 3}
```
If not: Mismatched API versions cause panels to fail loading data. Fix via config override:
```bash
cat >> /etc/kolla/config/horizon/custom_local_settings << 'EOF'
OPENSTACK_API_VERSIONS = {
    "identity": 3,
    "image": 2,
    "volume": 3,
}
EOF
kolla-ansible -i inventory reconfigure --tags horizon
```

Step 5: Test Keystone endpoint connectivity from Horizon
```bash
# Verify Horizon can reach each service endpoint
docker exec horizon curl -s http://keystone-internal:5000/v3/ | python3 -m json.tool
docker exec horizon curl -s http://nova-api:8774/
docker exec horizon curl -s http://neutron-server:9696/
docker exec horizon curl -s http://glance-api:9292/
docker exec horizon curl -s http://cinder-api:8776/
docker exec horizon curl -s http://heat-api:8004/
docker exec horizon curl -s http://swift-proxy-server:8080/info
```
Expected: Each service responds with version info or API root
If not: If a service is unreachable, the issue is with the service itself, not Horizon. Check the specific service's status: `docker ps --filter name=<service>`

Step 6: Check for custom panel loading errors
```bash
docker logs horizon 2>&1 | grep -i "panel\|plugin\|import\|module" | tail -20
```
Expected: No import errors or module-not-found messages
If not: A custom panel plugin has a dependency issue. Disable the problematic panel:
```bash
# Identify and disable the broken panel
docker exec horizon mv /usr/share/openstack-dashboard/openstack_dashboard/local/enabled/_XXXX_broken_panel.py \
  /usr/share/openstack-dashboard/openstack_dashboard/local/enabled/_XXXX_broken_panel.py.disabled
docker restart horizon
```

Step 7: Verify panel functionality after fixes
```bash
# Restart Horizon to pick up any changes
docker restart horizon

# Wait for container to be healthy
sleep 10
docker inspect --format '{{.State.Health.Status}}' horizon

# Test dashboard access
curl -so /dev/null -w "%{http_code}" https://<vip>/auth/login/
```
Expected: Container is healthy; dashboard loads; previously missing panels now appear
If not: Check Horizon logs again for new errors: `docker logs horizon --tail 30`

## VERIFICATION

1. All expected panels appear in the dashboard after login (Project, Admin, Identity panel groups)
2. Each panel loads data without errors (click through key panels to verify)
3. Service-specific panels (Heat Stacks, Swift Containers, Cinder Volumes) display current data
4. API version warnings are absent from Horizon logs: `docker logs horizon 2>&1 | grep -c "version\|deprecated"` shows 0

## ROLLBACK

1. If a problematic panel was disabled, re-enable it:
   ```bash
   docker exec horizon mv /usr/share/openstack-dashboard/openstack_dashboard/local/enabled/_XXXX_broken_panel.py.disabled \
     /usr/share/openstack-dashboard/openstack_dashboard/local/enabled/_XXXX_broken_panel.py
   docker restart horizon
   ```
2. If API version configuration was changed, revert the custom_local_settings and reconfigure:
   ```bash
   kolla-ansible -i inventory reconfigure --tags horizon
   ```
3. Verify that dashboard behavior returns to the pre-change state

## RELATED RUNBOOKS

- RB-HORIZON-001: Dashboard Access Recovery -- when the dashboard itself is not loading
- RB-HORIZON-002: Session and Authentication Troubleshooting -- when login/session is the issue
- RB-KEYSTONE-002: Service Catalog Troubleshooting -- when missing panels are caused by catalog issues
- RB-HEAT-001: Stack Creation Failure Diagnosis -- when Heat panel loads but stack operations fail
