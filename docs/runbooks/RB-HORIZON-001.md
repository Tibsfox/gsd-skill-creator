RUNBOOK: RB-HORIZON-001 -- Dashboard Access Recovery
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Horizon host
2. Docker CLI available on the host
3. Admin credentials available (`/etc/kolla/admin-openrc.sh`)
4. Knowledge of the external VIP address or FQDN for dashboard access

## PROCEDURE

Step 1: Check Horizon container status
```bash
docker ps --filter name=horizon
docker inspect --format '{{.State.Status}} (health: {{.State.Health.Status}})' horizon
```
Expected: Container is `running` with health status `healthy`
If not: If container is stopped or unhealthy, restart it: `docker restart horizon`. If it keeps crashing, check logs (Step 4).

Step 2: Check Apache/WSGI service inside the container
```bash
docker exec horizon ps aux | grep -i "apache\|httpd\|wsgi"
```
Expected: Apache/httpd processes are running, serving the WSGI application
If not: The web server has crashed. Restart the container: `docker restart horizon`

Step 3: Verify memcached connectivity (session backend)
```bash
# Check if memcached container is running
docker ps --filter name=memcached

# Test connectivity from Horizon to memcached
docker exec horizon python3 -c "
import socket
s = socket.create_connection(('memcached', 11211), timeout=5)
s.send(b'stats\r\n')
data = s.recv(4096)
print('Memcached OK' if b'STAT' in data else 'Memcached ERROR')
s.close()
"
```
Expected: Memcached container is running and connectivity test prints "Memcached OK"
If not: Restart memcached: `docker restart memcached`. If memcached is persistently down, check its logs: `docker logs memcached`

Step 4: Check Horizon Django application logs
```bash
docker logs horizon --tail 100
docker logs horizon 2>&1 | grep -i "error\|exception\|traceback" | tail -20
```
Expected: No recent errors or exceptions in the logs
If not: Common errors and their resolutions:
- `OperationalError: no such table` -- database migration needed: `docker exec horizon python3 manage.py migrate`
- `ConnectionRefusedError: [Errno 111]` -- memcached or Keystone is down
- `ImproperlyConfigured` -- local_settings.py has a configuration error

Step 5: Verify local_settings.py configuration
```bash
docker exec horizon cat /etc/openstack-dashboard/local_settings.py | grep -E "OPENSTACK_KEYSTONE_URL|SESSION_ENGINE|ALLOWED_HOSTS"
```
Expected: `OPENSTACK_KEYSTONE_URL` points to a reachable Keystone endpoint; `SESSION_ENGINE` is configured; `ALLOWED_HOSTS` includes the dashboard hostname
If not: Fix via Kolla-Ansible config override and reconfigure (Step 8)

Step 6: Test dashboard HTTP response
```bash
# Test from the host
curl -sI https://<kolla_external_vip_address>/auth/login/ | head -10

# Test response code
curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/
```
Expected: HTTP 200 OK (or 302 redirect to login page)
If not: If 502/503, HAProxy cannot reach Horizon. Check HAProxy: `docker logs haproxy --tail 20`. If 500, see Step 4 for application errors.

Step 7: Verify HAProxy routing to Horizon
```bash
docker exec haproxy cat /etc/haproxy/haproxy.cfg | grep -A5 "horizon"
```
Expected: HAProxy backend configuration routes to the Horizon container on the correct port
If not: Reconfigure HAProxy: `kolla-ansible -i inventory reconfigure --tags haproxy`

Step 8: Restart services to recover access
```bash
# Restart in dependency order
docker restart memcached
sleep 5
docker restart horizon

# Verify recovery
curl -so /dev/null -w "%{http_code}" https://<kolla_external_vip_address>/auth/login/
```
Expected: Dashboard returns 200 after restart
If not: If restart does not resolve, run full reconfigure: `kolla-ansible -i inventory reconfigure --tags horizon`

## VERIFICATION

1. Dashboard login page loads in a browser at `https://<vip>/auth/login/`
2. Admin can log in with credentials from `/etc/kolla/admin-openrc.sh`
3. After login, Project and Admin panels load with service data
4. `docker inspect --format '{{.State.Health.Status}}' horizon` returns `healthy`

## ROLLBACK

1. If configuration changes were made, revert to previous settings:
   ```bash
   # Remove custom config overrides
   rm /etc/kolla/config/horizon/custom_local_settings
   kolla-ansible -i inventory reconfigure --tags horizon
   ```
2. Restart Apache and memcached services:
   ```bash
   docker restart memcached horizon
   ```
3. Verify dashboard access is restored to pre-change state

## RELATED RUNBOOKS

- RB-KEYSTONE-001: Token Issuance and Authentication -- when dashboard login fails due to Keystone issues
- RB-HORIZON-002: Session and Authentication Troubleshooting -- when dashboard loads but login/session fails
- RB-HORIZON-003: Panel and Plugin Configuration -- when dashboard loads but panels are missing or broken
- RB-GENERAL-001: Full Cloud Daily Health Check -- includes Horizon accessibility as part of daily checks
