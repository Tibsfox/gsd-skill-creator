RUNBOOK: RB-KEYSTONE-001 -- Token Issuance Failure Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: both

PRECONDITIONS
  1. Admin access to the OpenStack controller node with sudo privileges
  2. Source file /etc/kolla/admin-openrc.sh available (or equivalent credentials)
  3. Keystone API container (keystone_api) is running (if not, restart first)
  4. Network connectivity to MariaDB and memcached services

PROCEDURE
  Step 1: Source admin credentials and attempt token issuance
    $ source /etc/kolla/admin-openrc.sh
    $ openstack token issue
    Expected: Table with token ID, expires timestamp, project_id, and user_id
    If not: Note the error message and continue to Step 2

  Step 2: Check Keystone container status
    $ docker ps --filter "name=keystone" --format "table {{.Names}}\t{{.Status}}"
    Expected: keystone_api and keystone_fernet both show "Up"
    If not: Restart containers: docker restart keystone_api keystone_fernet
            Wait 15 seconds, retry Step 1. If still failing, continue to Step 3

  Step 3: Check Fernet key status
    $ docker exec keystone_api ls -la /etc/kolla/keystone/fernet-keys/
    Expected: At least 3 key files (0, 1, and one higher-numbered primary key)
             with recent modification timestamps
    If not: Keys may be expired or missing. Rotate keys:
            $ kolla-ansible -i inventory keystone_fernet_rotate
            Retry Step 1. If still failing, continue to Step 4

  Step 4: Verify NTP synchronization across nodes
    $ chronyc sources
    Expected: At least one source marked with * (synchronized) and offset < 500ms
    $ chronyc tracking
    Expected: "System time" offset less than 0.5 seconds
    If not: Clock skew detected. Sync immediately:
            $ chronyc makestep
            Verify: $ date -u (compare across all nodes, must match within 1 second)
            Retry Step 1. If still failing, continue to Step 5

  Step 5: Check memcached connectivity
    $ docker ps --filter "name=memcached" --format "table {{.Names}}\t{{.Status}}"
    Expected: memcached container shows "Up"
    $ docker exec memcached memcstat --servers=localhost
    Expected: Connection statistics showing pid, uptime, curr_items
    If not: Restart memcached: $ docker restart memcached
            Wait 10 seconds, retry Step 1. If still failing, continue to Step 6

  Step 6: Verify MariaDB connectivity
    $ docker exec mariadb mysql -u root -p -e "SELECT 1"
    Expected: Returns "1" without error
    $ docker exec mariadb mysql -u keystone -p -e "USE keystone; SELECT COUNT(*) FROM project;"
    Expected: Returns a count (at least 1 for the admin project)
    If not: MariaDB may be down or credentials invalid.
            See database recovery: restart MariaDB container and verify
            $ docker restart mariadb
            Wait 30 seconds, retry Step 1
            If still failing: escalate to database administrator

  Step 7: Check Keystone API logs for specific errors
    $ docker logs keystone_api 2>&1 | tail -100 | grep -i "error\|fatal\|exception"
    Expected: No critical errors in recent logs
    If not: Review error messages for root cause indicators:
            - "Could not find token" -> Fernet key mismatch (repeat Step 3)
            - "Clock skew" -> NTP issue (repeat Step 4)
            - "OperationalError" -> Database issue (repeat Step 6)
            - "Unauthorized" -> Credential mismatch in admin-openrc.sh

VERIFICATION
  1. Token issuance succeeds:
     $ openstack token issue -f value -c id
     Expected: Returns a token string (no errors)
  2. Token can authenticate to other services:
     $ openstack service list
     Expected: Returns service catalog entries
  3. Check Keystone API response time:
     $ time openstack token issue > /dev/null 2>&1
     Expected: Completes in under 5 seconds

ROLLBACK
  1. Restore previous Fernet key repository from backup:
     $ docker cp ./fernet-keys-backup/ keystone_api:/etc/kolla/keystone/fernet-keys/
     $ docker restart keystone_api
  2. If admin-openrc.sh was modified, regenerate:
     $ kolla-ansible -i inventory post-deploy
  3. Verify rollback succeeded:
     $ openstack token issue

RELATED RUNBOOKS
  - RB-KEYSTONE-005: Fernet Key Rotation -- Use for scheduled or emergency key rotation
  - RB-KEYSTONE-002: Service Catalog Endpoint Repair -- If tokens work but services are unreachable
  - RB-KEYSTONE-004: TLS Certificate Renewal -- If token failure is caused by expired TLS certificates
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If auth failure cascades to compute
