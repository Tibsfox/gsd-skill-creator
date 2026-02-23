RUNBOOK: RB-KEYSTONE-002 -- Service Catalog Endpoint Repair
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source file /etc/kolla/admin-openrc.sh available
  3. Keystone API is operational (tokens can be issued -- verify with RB-KEYSTONE-001 if not)
  4. Knowledge of expected endpoint URLs for all deployed services

PROCEDURE
  Step 1: List all registered services
    $ source /etc/kolla/admin-openrc.sh
    $ openstack service list -f table
    Expected: Table showing services (identity, compute, network, image, etc.)
              with their Type and Description
    If not: Keystone may not be operational. See RB-KEYSTONE-001

  Step 2: List all endpoints and compare against expected configuration
    $ openstack endpoint list --long -f table
    Expected: Three endpoints per service (public, internal, admin) per region
              Each with correct URL, interface type, and region
    If not: Note which services have missing or incorrect endpoints

  Step 3: Identify missing or incorrect endpoints
    $ openstack endpoint list --service compute -f table
    $ openstack endpoint list --service network -f table
    $ openstack endpoint list --service image -f table
    $ openstack endpoint list --service volume -f table
    $ openstack endpoint list --service volumev3 -f table
    $ openstack endpoint list --service object-store -f table
    $ openstack endpoint list --service orchestration -f table
    $ openstack endpoint list --service dashboard -f table
    Expected: Each command returns public, internal, and admin endpoints
    If not: Record which service/interface combinations are missing

  Step 4: Remove incorrect endpoints (if URLs are wrong)
    $ openstack endpoint delete <endpoint-id>
    Expected: No output (successful deletion)
    If not: Check that the endpoint ID is correct with
            $ openstack endpoint show <endpoint-id>

  Step 5: Recreate missing endpoints
    Example for compute service:
    $ openstack endpoint create --region RegionOne \
        compute public http://controller:8774/v2.1
    $ openstack endpoint create --region RegionOne \
        compute internal http://controller:8774/v2.1
    $ openstack endpoint create --region RegionOne \
        compute admin http://controller:8774/v2.1
    Expected: Each command returns the created endpoint details
    If not: Verify the service exists (Step 1) and the URL is reachable

  Step 6: Verify endpoint connectivity
    $ openstack compute service list
    $ openstack network agent list
    $ openstack image list
    $ openstack volume service list
    Expected: Each command returns results without "Could not find service" errors
    If not: Check endpoint URLs resolve to running services.
            Verify with: $ curl -s http://controller:8774/ | python3 -m json.tool

  Step 7: Verify region consistency
    $ openstack endpoint list -c "Service Name" -c "Region" -f table | sort
    Expected: All endpoints belong to the same region (typically RegionOne)
    If not: Delete endpoints with wrong region and recreate with correct region name

VERIFICATION
  1. All services discoverable through catalog:
     $ openstack catalog list
     Expected: Every deployed service appears with correct endpoints
  2. Cross-service API calls succeed:
     $ openstack server list
     Expected: Returns instance list (not "Could not find service" error)
  3. Endpoint URLs are reachable:
     $ openstack endpoint list -c URL -f value | while read url; do
         curl -s -o /dev/null -w "%{http_code} $url\n" "$url" 2>/dev/null
       done
     Expected: All endpoints return HTTP 200 or 300-series responses

ROLLBACK
  1. Restore catalog from backup if available:
     $ mysql -u root -p keystone < keystone_catalog_backup.sql
  2. If no backup, regenerate endpoints via Kolla-Ansible:
     $ kolla-ansible -i inventory deploy --tags keystone
     $ kolla-ansible -i inventory post-deploy
  3. Verify rollback:
     $ openstack endpoint list --long

RELATED RUNBOOKS
  - RB-KEYSTONE-001: Token Issuance Failure -- If authentication fails before catalog check
  - RB-KEYSTONE-003: RBAC Policy Troubleshooting -- If catalog is correct but access denied
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If compute endpoints are misconfigured
  - RB-NOVA-002: Scheduler and Placement Troubleshooting -- If placement endpoint is wrong
