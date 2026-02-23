RUNBOOK: RB-KEYSTONE-003 -- RBAC Policy Troubleshooting
SE Phase Reference: NPR 7123.1 SS 3.2 Process 9
Last Verified Against: 2024.2 (Dalmatian), 2026-02-23
Verification Method: manual

PRECONDITIONS
  1. Admin access to the OpenStack controller node with admin role
  2. Source file /etc/kolla/admin-openrc.sh available
  3. Keystone API is operational and tokens can be issued
  4. Knowledge of the user, project, and operation that triggered the 403 error

PROCEDURE
  Step 1: Identify the failing user, project, and operation
    $ source /etc/kolla/admin-openrc.sh
    $ openstack user show <username> -f table
    Expected: User details including domain, enabled status, and ID
    If not: User does not exist. Create with:
            $ openstack user create --domain default --password-prompt <username>

  Step 2: Verify role assignments for the user
    $ openstack role assignment list --user <username> --project <project> --names -f table
    Expected: At least one role assignment (member, admin, or reader)
    If not: Role assignment is missing. Add the appropriate role:
            $ openstack role add --project <project> --user <username> member

  Step 3: Check effective role assignments including group membership
    $ openstack role assignment list --effective --user <username> --names -f table
    Expected: Shows all roles including those inherited through group membership
    If not: No effective roles means neither direct nor group-based assignment exists

  Step 4: Check project scoping
    $ openstack token issue --os-project-name <project> --os-username <username> \
        --os-password <password> --os-user-domain-name default \
        --os-project-domain-name default -f table
    Expected: Token issued with project_id matching the target project
    If not: Scoping error. Verify project exists and user has access:
            $ openstack project show <project>

  Step 5: Review policy files for the affected service
    For Keystone:
    $ docker exec keystone_api cat /etc/keystone/policy.yaml 2>/dev/null || echo "No custom policy"
    For Nova:
    $ docker exec nova_api cat /etc/nova/policy.yaml 2>/dev/null || echo "No custom policy"
    For Neutron:
    $ docker exec neutron_server cat /etc/neutron/policy.yaml 2>/dev/null || echo "No custom policy"
    Expected: Policy file shows rules for the denied operation
    If not: Default policies apply; the issue is likely role assignment, not policy

  Step 6: Validate policy file syntax
    $ docker exec keystone_api python3 -c \
        "import yaml; yaml.safe_load(open('/etc/keystone/policy.yaml'))"
    Expected: No output (valid YAML)
    If not: YAML syntax error. Fix the policy file and restart the service

  Step 7: Enable debug logging to trace policy evaluation
    $ docker exec keystone_api grep -i "^debug" /etc/keystone/keystone.conf
    If debug is false:
    $ docker exec keystone_api sed -i 's/^debug = .*/debug = true/' /etc/keystone/keystone.conf
    $ docker restart keystone_api
    Reproduce the failing operation, then check logs:
    $ docker logs keystone_api 2>&1 | grep -i "policy\|rbac\|enforce\|403"
    Expected: Log shows which policy rule denied the request
    If not: The 403 may not originate from Keystone; check the target service logs

  Step 8: Test with correct scope
    $ openstack --os-auth-url http://keystone:5000/v3 \
        --os-username <username> --os-password <password> \
        --os-project-name <project> --os-user-domain-name default \
        --os-project-domain-name default <failing-command>
    Expected: Command succeeds with explicit scoping
    If not: Policy rule genuinely blocks this operation for this role

VERIFICATION
  1. User can perform the originally denied operation:
     $ openstack --os-username <username> --os-project-name <project> <command>
     Expected: Operation succeeds (HTTP 200/201)
  2. Other users with same role can perform the operation:
     $ openstack role assignment list --role <role> --project <project> --names
     Test with another user holding the same role
  3. Disable debug logging after troubleshooting:
     $ docker exec keystone_api sed -i 's/^debug = true/debug = false/' /etc/keystone/keystone.conf
     $ docker restart keystone_api

ROLLBACK
  1. Restore previous policy file from git or backup:
     $ docker cp ./policy.yaml.bak keystone_api:/etc/keystone/policy.yaml
     $ docker restart keystone_api
  2. If role assignment was changed, revert:
     $ openstack role remove --project <project> --user <username> <role>
  3. Verify rollback:
     $ openstack role assignment list --user <username> --project <project> --names

RELATED RUNBOOKS
  - RB-KEYSTONE-001: Token Issuance Failure -- If auth fails before policy evaluation
  - RB-KEYSTONE-002: Service Catalog Endpoint Repair -- If user reaches wrong endpoint
  - RB-NOVA-001: Instance Launch Failure Diagnosis -- If RBAC blocks compute operations
