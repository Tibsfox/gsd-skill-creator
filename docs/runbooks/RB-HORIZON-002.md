RUNBOOK: RB-HORIZON-002 -- Session and Authentication Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: OpenStack 2024.1 (Caracal), 2026-02-23
Verification Method: manual

## PRECONDITIONS

1. SSH or console access to the Horizon host
2. Docker CLI available on the host
3. Admin credentials available (`/etc/kolla/admin-openrc.sh`)
4. Dashboard is accessible (login page loads) -- if not, see RB-HORIZON-001 first
5. Knowledge of the specific authentication or session issue being reported

## PROCEDURE

Step 1: Identify the session/auth issue type
```bash
# Common symptoms:
# - Login form submits but returns to login page with no error
# - "CSRF verification failed" error on login
# - Users logged out unexpectedly (session timeout)
# - "Invalid credentials" when credentials are correct
# - Cookie-related browser errors
```
Expected: Symptom identified from the list above
If not: Check Horizon logs for the specific error: `docker logs horizon 2>&1 | tail -30`

Step 2: Check SESSION_ENGINE configuration
```bash
docker exec horizon python3 -c "
from openstack_dashboard import settings
print('SESSION_ENGINE:', settings.SESSION_ENGINE)
print('SESSION_TIMEOUT:', settings.SESSION_TIMEOUT)
print('SESSION_COOKIE_SECURE:', settings.SESSION_COOKIE_SECURE)
print('SESSION_COOKIE_HTTPONLY:', settings.SESSION_COOKIE_HTTPONLY)
"
```
Expected: SESSION_ENGINE shows `django.contrib.sessions.backends.cache` (memcached) or `django.contrib.sessions.backends.db`; SESSION_TIMEOUT shows a reasonable value (e.g., 3600)
If not: Adjust session settings via Kolla-Ansible config override (Step 7)

Step 3: Verify CSRF cookie configuration
```bash
docker exec horizon python3 -c "
from openstack_dashboard import settings
print('CSRF_COOKIE_SECURE:', settings.CSRF_COOKIE_SECURE)
print('CSRF_COOKIE_HTTPONLY:', getattr(settings, 'CSRF_COOKIE_HTTPONLY', 'not set'))
print('CSRF_COOKIE_DOMAIN:', getattr(settings, 'CSRF_COOKIE_DOMAIN', 'not set'))
"
```
Expected: `CSRF_COOKIE_SECURE` is `True` if using HTTPS, `False` if HTTP. `CSRF_COOKIE_DOMAIN` matches the dashboard hostname.
If not: Mismatch between protocol and CSRF_COOKIE_SECURE causes CSRF failures. Fix:
- HTTPS deployment: `CSRF_COOKIE_SECURE = True`
- HTTP deployment: `CSRF_COOKIE_SECURE = False`

Step 4: Check for browser cookie issues
```bash
# Verify the dashboard is setting cookies correctly
curl -sI -c /tmp/cookies.txt https://<vip>/auth/login/
cat /tmp/cookies.txt
```
Expected: Response includes `Set-Cookie` headers for `csrftoken` and `sessionid`
If not: Cookie domain or path mismatch. Check if a reverse proxy is stripping Set-Cookie headers.

Step 5: Check memcached session backend health
```bash
# Check memcached statistics
docker exec memcached sh -c 'echo "stats" | nc localhost 11211 | grep -E "curr_items|evictions|get_hits|get_misses"'
```
Expected: `curr_items` shows active sessions; `evictions` is 0 or very low; `get_hits` much higher than `get_misses`
If not: High evictions mean memcached needs more memory. Increase in globals.yml: `memcached_max_memory: 512`

Step 6: Clear stale sessions (force all users to re-authenticate)
```bash
# Flush memcached (clears all sessions)
docker exec memcached sh -c 'echo "flush_all" | nc localhost 11211'

# Restart Horizon to clear internal state
docker restart horizon
```
Expected: After flush, all users must log in again. New sessions should work correctly.
If not: The issue is not session-related. Check Keystone connectivity (Step 8).

Step 7: Adjust session configuration via Kolla-Ansible
```bash
# Create or update the Horizon config override
mkdir -p /etc/kolla/config/horizon/
cat > /etc/kolla/config/horizon/custom_local_settings << 'EOF'
SESSION_TIMEOUT = 3600
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
EOF

# Apply the configuration
kolla-ansible -i inventory reconfigure --tags horizon
```
Expected: Horizon restarts with updated session settings
If not: Check for syntax errors in custom_local_settings: `docker logs horizon --tail 20`

Step 8: Verify Keystone authentication from Horizon
```bash
# Test Keystone connectivity from inside the Horizon container
docker exec horizon curl -s http://keystone-internal:5000/v3/ | python3 -m json.tool

# Test token issuance
source /etc/kolla/admin-openrc.sh
openstack token issue
```
Expected: Keystone API responds with version information; token issuance succeeds
If not: Keystone service may be down. See RB-KEYSTONE-001 for Keystone troubleshooting.

## VERIFICATION

1. Login with valid credentials succeeds and redirects to the dashboard
2. Session persists for the configured timeout period without unexpected logouts
3. No CSRF errors when submitting forms in the dashboard
4. `docker exec memcached sh -c 'echo "stats" | nc localhost 11211 | grep curr_items'` shows active sessions after login

## ROLLBACK

1. Restore previous session configuration:
   ```bash
   rm /etc/kolla/config/horizon/custom_local_settings
   kolla-ansible -i inventory reconfigure --tags horizon
   ```
2. If memcached was flushed, users simply need to log in again (no data loss)
3. Verify that login and session behavior returns to the pre-change state

## RELATED RUNBOOKS

- RB-HORIZON-001: Dashboard Access Recovery -- when the dashboard itself is not loading
- RB-HORIZON-003: Panel and Plugin Configuration -- when authentication works but panels fail
- RB-KEYSTONE-001: Token Issuance and Authentication -- when the issue is at the Keystone token level
- RB-KEYSTONE-003: RBAC Policy Troubleshooting -- when users can log in but lack expected permissions
