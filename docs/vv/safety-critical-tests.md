# Safety-Critical Test Procedures -- GSD OpenStack Cloud Platform

**Reference:** VERIF-05, SP-6105 SS 5.3, NPR 7123.1 Process 7
**Status:** Specification
**NASA SE Phase:** Phase D (Integration and Test)
**Total tests:** 22 mandatory-pass safety-critical tests

---

## Overview

This document provides step-by-step test procedures for all 22 safety-critical (SC) tests
defined in the project test plan (`.planning/research/02-test-plan.md`). Every SC test must
pass before deployment proceeds. A single BLOCK result halts the deployment pipeline.

**Failure action:** BLOCK -- any SC test failure halts all further deployment activities.
The failing test must be diagnosed, corrected, and re-run before deployment may continue.

**Verification methods (TAID per SP-6105 SS 5.3):**
- **T (Test):** Execute command, observe result, compare to expected
- **A (Analysis):** Read configuration or data, compute result, compare to specification
- **I (Inspection):** Review documentation or code for required elements without executing
- **D (Demonstration):** Walk through end-to-end scenario, observe system behavior

**Test execution order:** Run tests in the order listed. Credential and security tests (SC-001
through SC-009) are foundational -- if these fail, subsequent tests may produce misleading
results. A BLOCK at SC-001 requires resolution before SC-002 begins.

---

## Credential and Data Security

### SC-001: Credentials Excluded from Git

**Requirement:** All credentials (passwords, tokens, private keys) must not appear in git history
**Component:** All skills, all configuration files
**Verification Method:** T (Test) -- scan git history for credential patterns

**Preconditions:**
- Git repository initialized and at least one commit exists
- `git` command available in PATH

**Procedure:**

1. Scan git history for committed configuration, environment, and key files:
   ```bash
   git log --all --diff-filter=A -- '*.conf' '*.env' '*.key' '*.pem' '*.crt' '*.p12'
   ```
   Expected: Output lists file additions. Note all files found for Step 2.

2. For each file found in Step 1, inspect its content at first-commit revision for credentials:
   ```bash
   git show <commit-hash>:<filepath> | grep -iE "password|token|secret|private_key|api_key|auth_key"
   ```
   Expected: No matches. Any output containing actual credential values (not placeholder text
   like `CHANGE_ME` or `<YOUR_PASSWORD_HERE>`) is a failure.

3. Scan the full diff history for credential pattern introductions:
   ```bash
   git log --all --oneline -p -- '*.conf' '*.env' | grep -iE "^\+.*(password|token|secret|private_key).*=.+[A-Za-z0-9]{8,}"
   ```
   Expected: No output. Matches indicate committed credential values.

4. Check for accidentally committed local configuration directories:
   ```bash
   git log --all --diff-filter=A -- 'local/*'
   ```
   Expected: No output. Local directory contents must never have been committed.

**Pass Criteria:** Steps 1-4 produce no evidence of real credential values in git history.
Placeholder strings (`CHANGE_ME`, `example.com`, `<password>`) are acceptable.

**Fail Action:** BLOCK -- Use `git filter-branch` or `git filter-repo` to remove credential
from history before proceeding. Rotate the exposed credential immediately.

**Rollback:** N/A -- This test is read-only. No system state is modified.

---

### SC-002: Local-Only Directory Isolation

**Requirement:** The `local/` directory containing real credentials and configurations is
excluded from version control and cannot be committed
**Component:** Infrastructure -- `.gitignore`, repository configuration
**Verification Method:** I (Inspection) + T (Test)

**Preconditions:**
- `.gitignore` file exists at repository root
- `local/` directory may or may not exist on disk

**Procedure:**

1. Verify `local/` is in `.gitignore`:
   ```bash
   grep "^local/" .gitignore
   ```
   Expected: `local/`
   If not found: Check for alternative patterns (`local`, `/local/`, `local/**`).

2. Confirm git status does not show any `local/` contents:
   ```bash
   git status --porcelain | grep "^.* local/"
   ```
   Expected: No output. If local/ directory contains files, none should appear in git status.

3. Attempt to stage a test file in local/ and verify git refuses:
   ```bash
   mkdir -p local/test-isolation
   echo "test" > local/test-isolation/credential.conf
   git add local/test-isolation/credential.conf 2>&1
   ```
   Expected: Warning message indicating file is ignored (not staged).
   ```
   The following paths are ignored by one of your .gitignore files:
   local/test-isolation/credential.conf
   ```

4. Confirm git add -f is not in any automation scripts:
   ```bash
   grep -r "git add -f" scripts/ Makefile 2>/dev/null
   ```
   Expected: No output. Force-adding would bypass the gitignore protection.

5. Verify `local/` directory is documented as the credentials location:
   ```bash
   grep -r "local/" docs/sysadmin-guide/ README.md 2>/dev/null | grep -i "credential\|password\|config"
   ```
   Expected: At least one reference confirming operators know to use `local/` for real credentials.

**Pass Criteria:** `.gitignore` excludes `local/`, git status confirms exclusion works, and
forced-add is not present in automation.

**Fail Action:** BLOCK -- Add `local/` to `.gitignore`. Verify any already-committed content
from `local/` is removed via git history rewrite.

**Rollback:** Remove `local/test-isolation/` created in Step 3:
```bash
rm -rf local/test-isolation
```

---

### SC-020: No Credential Logging

**Requirement:** Service logs must not contain passwords, tokens, or certificate private keys
at any verbosity level
**Component:** All OpenStack skills (Keystone, Nova, Neutron, Cinder, Glance, Swift)
**Verification Method:** T (Test) -- grep log files at multiple verbosity levels

**Preconditions:**
- OpenStack services deployed and running
- Log files accessible at standard Kolla-Ansible log locations
- Test credentials used for deployment are known

**Procedure:**

1. Identify log file locations for each service:
   ```bash
   find /var/log/kolla/ -name "*.log" 2>/dev/null || ls /var/log/keystone/ /var/log/nova/ /var/log/neutron/ 2>/dev/null
   ```
   Expected: List of log files per service.

2. Scan all service logs for password patterns:
   ```bash
   grep -r -iE "password\s*=\s*.{4,}|passwd\s*=\s*.{4,}" /var/log/kolla/ 2>/dev/null | grep -v "password=\*\*\*\|password=XXXXXX\|password=None"
   ```
   Expected: No output. Masked passwords (`***`, `XXXXXX`) are acceptable; actual values are not.

3. Scan for token patterns in logs:
   ```bash
   grep -r -E "gAAAA[A-Za-z0-9_-]{20,}" /var/log/kolla/ 2>/dev/null
   ```
   Expected: No output. Fernet tokens begin with `gAAAA`.

4. Scan for private key material in logs:
   ```bash
   grep -r "BEGIN PRIVATE KEY\|BEGIN RSA PRIVATE KEY\|BEGIN EC PRIVATE KEY" /var/log/kolla/ 2>/dev/null
   ```
   Expected: No output.

5. Enable DEBUG logging for one service temporarily and verify still no credentials:
   ```bash
   # Check current log level
   grep "log_level\|debug" /etc/kolla/keystone/keystone.conf
   # If not already in DEBUG, note current level; do NOT change (this test uses existing logs)
   # Review the last 1000 lines of Keystone log at whatever verbosity it runs
   tail -1000 /var/log/kolla/keystone/keystone.log | grep -iE "password|token|secret"
   ```
   Expected: No credential values. System identifiers (`token_id`, `project_id` references) are
   acceptable; actual token values are not.

**Pass Criteria:** No service log contains actual credential values, token strings, or private
key material. Masked representations are acceptable.

**Fail Action:** BLOCK -- Identify which service is logging credentials. Review that service's
logging configuration and filter out sensitive data. This may require a service configuration
update and restart.

**Rollback:** N/A -- Test is read-only.

---

## Network and Access Security

### SC-003: No External Binding Without HITL

**Requirement:** Default Kolla-Ansible configuration binds services only to management network.
No service listens on external interface without human-in-the-loop (HITL) approval.
**Component:** Deployment crew -- Kolla-Ansible configuration
**Verification Method:** A (Analysis) + T (Test)

**Preconditions:**
- Kolla-Ansible `globals.yml` accessible
- Network interfaces identified (management vs. external)

**Procedure:**

1. Inspect `globals.yml` for network address configuration:
   ```bash
   grep -E "kolla_internal_vip_address|kolla_external_vip_address|network_interface|api_interface" /etc/kolla/globals.yml
   ```
   Expected: `kolla_internal_vip_address` is set to a management network IP. If
   `kolla_external_vip_address` is set, it must have an associated CAPCOM approval record.

2. Verify external interface is not the API interface:
   ```bash
   grep "api_interface" /etc/kolla/globals.yml
   ```
   Expected: `api_interface` points to the management-only network interface, not to an
   interface with external network access.

3. Check which ports are listening and on which interfaces:
   ```bash
   ss -tlnp | grep -E ":5000|:8774|:9696|:8776|:9292" | awk '{print $4}'
   ```
   Expected: All listening addresses are on management network IPs (e.g., `10.0.0.10:5000`).
   No service should listen on `0.0.0.0` unless explicitly approved.

4. Verify no external binding exists without documented CAPCOM approval:
   ```bash
   ss -tlnp | grep "0.0.0.0:" | grep -E ":5000|:8774|:9696|:8776|:9292"
   ```
   Expected: No output. If any service listens on `0.0.0.0`, verify CAPCOM approval
   document exists at `.planning/decisions/external-binding-approval.md`.

**Pass Criteria:** All OpenStack API ports bind to management network only, or any external
binding has documented CAPCOM HITL approval.

**Fail Action:** BLOCK -- Reconfigure `globals.yml` to bind only to management network.
Re-run Kolla-Ansible reconfigure: `kolla-ansible reconfigure -i inventory/hosts`.

**Rollback:** Restore original `globals.yml`. Re-run reconfigure.

---

### SC-004: CAPCOM Approval for External Exposure

**Requirement:** Attempting to bind any service to external network triggers CAPCOM confirmation
loop. Deployment proceeds only on explicit human "yes" approval.
**Component:** Communication framework -- CAPCOM role, crew configuration
**Verification Method:** I (Inspection) + D (Demonstration)

**Preconditions:**
- `config/crews/deployment-crew.yaml` accessible
- CAPCOM role properly configured as sole human interface

**Procedure:**

1. Verify CAPCOM is defined as sole human interface:
   ```bash
   grep -A 5 "human_interface:" config/crews/deployment-crew.yaml
   ```
   Expected:
   ```yaml
   human_interface:
     sole_agent: capcom
     rule: "No agent other than CAPCOM may send messages directly to the human operator"
   ```

2. Verify no other agent has `human_interface: true`:
   ```bash
   grep "human_interface: true" config/crews/deployment-crew.yaml
   ```
   Expected: Exactly one line matching `capcom` position.

3. Verify CAPCOM position definition includes human interface flag:
   ```bash
   grep -A 15 "id: capcom" config/crews/deployment-crew.yaml | grep "human_interface"
   ```
   Expected: `    human_interface: true`

4. Inspect runbook or automation script for external binding to confirm CAPCOM gate exists:
   ```bash
   grep -r "external\|kolla_external_vip" scripts/ docs/ configs/ 2>/dev/null | grep -i "capcom\|approval\|confirm\|hitl"
   ```
   Expected: At least one reference linking external binding to CAPCOM approval workflow.

5. Demonstration -- trace the approval flow in documentation:
   Verify that `docs/operations-manual/` or crew configuration documents describe the message
   flow: EXEC proposes external binding → PLAN routes to CAPCOM → CAPCOM presents to human →
   human responds → CAPCOM relays decision → EXEC proceeds or halts.

**Pass Criteria:** CAPCOM is the sole human interface in crew config, no other agent can
reach the human, and the external binding approval workflow is documented.

**Fail Action:** BLOCK -- Crew configuration is not safe for deployment. Correct CAPCOM
isolation before proceeding.

**Rollback:** N/A -- Inspection only, no system state modified.

---

### SC-009: Security Groups Default Deny

**Requirement:** New security group has no ingress rules -- default deny posture
**Component:** openstack-neutron skill
**Verification Method:** T (Test)

**Preconditions:**
- OpenStack deployed with Neutron
- Keystone credentials available (sourced from `local/openrc`)

**Procedure:**

1. Source credentials:
   ```bash
   source local/openrc
   ```

2. Create a fresh security group for testing:
   ```bash
   openstack security group create sc-009-test-group --description "SC-009 test -- default deny verification"
   ```
   Expected: Security group created with ID output.

3. List rules for the new security group:
   ```bash
   openstack security group rule list sc-009-test-group
   ```
   Expected: Zero ingress rules. (Neutron may add default egress rules; these are acceptable.)
   The output should show no rules with `Direction: ingress`.

4. Verify via direct API query (belt-and-suspenders):
   ```bash
   openstack security group show sc-009-test-group -f json | python3 -c "import sys, json; sg=json.load(sys.stdin); rules=[r for r in sg['security_group_rules'] if r['direction']=='ingress']; print(f'Ingress rules: {len(rules)}'); sys.exit(0 if len(rules)==0 else 1)"
   ```
   Expected: `Ingress rules: 0` and exit code 0.

5. Delete the test security group:
   ```bash
   openstack security group delete sc-009-test-group
   ```

**Pass Criteria:** Newly created security group has zero ingress rules.

**Fail Action:** BLOCK -- Neutron default security group policy is adding ingress rules.
Review Neutron configuration for default security group rules. Remove unwanted defaults.

**Rollback:** If test security group was not cleaned up in Step 5:
```bash
openstack security group delete sc-009-test-group
```

---

### SC-015: Network Isolation Between Tenants

**Requirement:** Instance in Project A cannot reach instance in Project B without explicit
router configuration between their networks
**Component:** openstack-neutron skill
**Verification Method:** D (Demonstration)

**Preconditions:**
- Two test projects exist (or can be created): `sc015-project-a`, `sc015-project-b`
- Each project has a network with instances, or test network isolation can be verified
  via network configuration inspection

**Procedure:**

1. Create two isolated test networks:
   ```bash
   openstack network create sc015-net-a --provider-network-type local
   openstack network create sc015-net-b --provider-network-type local
   openstack subnet create sc015-subnet-a --network sc015-net-a --subnet-range 192.168.201.0/24
   openstack subnet create sc015-subnet-b --network sc015-net-b --subnet-range 192.168.202.0/24
   ```

2. Verify no router connects the two networks:
   ```bash
   openstack router list | grep sc015
   ```
   Expected: No output (no routers with sc015 prefix).

3. Verify the networks are not connected via shared provider network:
   ```bash
   openstack network show sc015-net-a -f value -c shared
   openstack network show sc015-net-b -f value -c shared
   ```
   Expected: `False` for both. Shared networks allow cross-tenant access.

4. Inspect the network's router-interface connections:
   ```bash
   openstack router list --long | grep -E "sc015-net-a|sc015-net-b"
   ```
   Expected: No output -- neither network is attached to any router.

5. Confirm Neutron security group default deny applies:
   Without a router connecting the two networks, any instance in sc015-net-a cannot
   route to sc015-net-b regardless of security group settings.

6. Clean up test resources:
   ```bash
   openstack subnet delete sc015-subnet-a sc015-subnet-b
   openstack network delete sc015-net-a sc015-net-b
   ```

**Pass Criteria:** Tenant networks are isolated by default. Cross-tenant access requires
explicit router configuration, which is not present by default.

**Fail Action:** BLOCK -- Neutron networking does not enforce tenant isolation. Review
`ml2_conf.ini`, OVN/OVS configuration, and network namespace setup.

**Rollback:** Run Step 6 cleanup commands if test resources were not deleted.

---

## Authentication and Authorization

### SC-006: Keystone Token Expiration Configured

**Requirement:** Token lifetime is configured to 3600 seconds or less. Fernet key rotation
is scheduled and documented.
**Component:** openstack-keystone skill
**Verification Method:** A (Analysis)

**Preconditions:**
- Keystone deployed and running
- `keystone.conf` accessible (in Kolla-Ansible: `/etc/kolla/keystone/keystone.conf`)

**Procedure:**

1. Read the Fernet token configuration:
   ```bash
   grep -A 5 "\[fernet_tokens\]" /etc/kolla/keystone/keystone.conf
   ```
   Expected: Section exists with `token_expiration` set.

2. Extract and evaluate the token expiration value:
   ```bash
   TOKEN_EXP=$(grep "token_expiration" /etc/kolla/keystone/keystone.conf | grep -v "#" | awk -F'=' '{print $2}' | tr -d ' ')
   echo "Token expiration: ${TOKEN_EXP} seconds"
   [ "${TOKEN_EXP}" -le 3600 ] && echo "PASS: Within security limit" || echo "FAIL: Exceeds 3600s limit"
   ```
   Expected: Value of 3600 or less. Common secure values: 3600 (1 hour), 1800 (30 minutes).

3. Verify Fernet key rotation is documented:
   ```bash
   grep -r "fernet.*rotat\|key.*rotat" docs/operations-manual/ docs/runbooks/ 2>/dev/null | head -5
   ```
   Expected: At least one document describes the Fernet key rotation procedure.

4. Verify key rotation is operational (keys exist):
   ```bash
   ls /etc/keystone/fernet-keys/ 2>/dev/null || ls /etc/kolla/keystone/fernet-keys/ 2>/dev/null
   ```
   Expected: Multiple key files present (minimum 2: a primary key and at least one staged key).

**Pass Criteria:** `token_expiration` is 3600 seconds or less, and Fernet key rotation
procedure is documented.

**Fail Action:** BLOCK -- Set `token_expiration = 3600` in `keystone.conf`. Apply via
Kolla-Ansible reconfigure.

**Rollback:** N/A -- Analysis only, no system state modified.

---

### SC-007: TLS Certificates Validated

**Requirement:** All service endpoints use TLS. Certificate chain validates. Certificate
expiry is more than 30 days away.
**Component:** openstack-security skill
**Verification Method:** T (Test) + A (Analysis)

**Preconditions:**
- TLS configured (Kolla-Ansible `enable_haproxy_memcached: no`, `kolla_enable_tls_internal: yes`)
- OpenSSL available in PATH

**Procedure:**

1. Verify TLS is enabled in Kolla-Ansible globals:
   ```bash
   grep "kolla_enable_tls\|enable_tls\|tls" /etc/kolla/globals.yml | grep -v "#"
   ```
   Expected: TLS configuration entries present.

2. Check certificate expiry for Keystone endpoint:
   ```bash
   openssl s_client -connect 10.0.0.10:5000 -servername 10.0.0.10 </dev/null 2>/dev/null | openssl x509 -noout -dates
   ```
   Expected: `notAfter` date is more than 30 days in the future.

3. Validate certificate chain:
   ```bash
   openssl s_client -connect 10.0.0.10:5000 -CAfile /etc/kolla/certificates/ca/root.crt </dev/null 2>/dev/null | grep "Verify return code:"
   ```
   Expected: `Verify return code: 0 (ok)`

4. Check all API service endpoints:
   ```bash
   for PORT in 5000 8774 9696 8776 9292; do
     RESULT=$(openssl s_client -connect 10.0.0.10:${PORT} </dev/null 2>/dev/null | openssl x509 -noout -checkend 2592000 2>/dev/null)
     echo "Port ${PORT}: ${RESULT}"
   done
   ```
   Expected: All ports report certificate valid for 30+ days (2592000 seconds).
   If TLS not enabled on a port, document the exception with rationale.

**Pass Criteria:** All API endpoints use TLS, certificates chain validates to root CA, and
all certificates have more than 30 days remaining validity.

**Fail Action:** BLOCK -- Renew expiring certificates. Fix chain validation if broken.
Re-run Kolla-Ansible certificates: `kolla-ansible certificates`.

**Rollback:** N/A -- Test is read-only.

---

### SC-008: RBAC Policies Enforce Least Privilege

**Requirement:** Default project member cannot perform admin operations. Verified via
policy test.
**Component:** openstack-keystone skill
**Verification Method:** T (Test)

**Preconditions:**
- Test user created with `member` role in a test project
- `openrc` for the test member user available
- Admin credentials available

**Procedure:**

1. Create test member user and project:
   ```bash
   source local/openrc  # Admin credentials
   openstack project create sc008-test-project
   openstack user create sc008-test-user --password SC008TestPass123 --project sc008-test-project
   openstack role add --project sc008-test-project --user sc008-test-user member
   ```

2. Source member credentials:
   ```bash
   export OS_AUTH_URL=http://10.0.0.10:5000/v3
   export OS_USERNAME=sc008-test-user
   export OS_PASSWORD=SC008TestPass123
   export OS_PROJECT_NAME=sc008-test-project
   export OS_USER_DOMAIN_NAME=Default
   export OS_PROJECT_DOMAIN_NAME=Default
   ```

3. Attempt admin-only operations as member (each should fail with 403 or permission error):
   ```bash
   openstack user list 2>&1 | head -3  # Admin only
   openstack project list --long 2>&1 | head -3  # Admin only (--long shows all projects)
   openstack role assignment list --system 2>&1 | head -3  # Admin only
   ```
   Expected: Each command returns HTTP 403 Forbidden or "You are not authorized" error.

4. Verify member CAN perform member-level operations:
   ```bash
   openstack server list 2>&1 | head -3  # Should succeed (empty list is fine)
   openstack network list 2>&1 | head -3  # Should succeed
   ```
   Expected: Commands succeed (return results or empty list, no permission error).

5. Clean up test resources (using admin credentials):
   ```bash
   unset OS_USERNAME OS_PASSWORD OS_PROJECT_NAME  # Clear member credentials
   source local/openrc  # Restore admin
   openstack user delete sc008-test-user
   openstack project delete sc008-test-project
   ```

**Pass Criteria:** Member role cannot list all users, access other projects, or manage
system-level role assignments. Member role CAN list own project resources.

**Fail Action:** BLOCK -- RBAC policy is too permissive. Review `policy.yaml` for Keystone.
Restrict member scope.

**Rollback:** Run Step 5 cleanup. If cleanup fails (admin credentials unavailable), manually
delete `sc008-test-user` and `sc008-test-project` via Keystone API.

---

### SC-017: Audit Logging Enabled

**Requirement:** All Keystone authentication events are logged. Log rotation is configured.
Logs cannot be modified by service accounts.
**Component:** openstack-security skill
**Verification Method:** T (Test) + I (Inspection)

**Preconditions:**
- Keystone running
- Log rotation configuration accessible

**Procedure:**

1. Verify audit logging enabled in Keystone configuration:
   ```bash
   grep -E "log_level|audit|notification|enable_access_log" /etc/kolla/keystone/keystone.conf | grep -v "#"
   ```
   Expected: Audit-related configuration present and enabled.

2. Perform a test authentication and verify it appears in the log:
   ```bash
   source local/openrc
   openstack token issue > /dev/null
   sleep 2
   tail -20 /var/log/kolla/keystone/keystone.log | grep -i "POST\|auth\|token"
   ```
   Expected: Log entry for the authentication event with timestamp, source IP, user, result.

3. Verify log rotation configuration:
   ```bash
   cat /etc/logrotate.d/kolla 2>/dev/null || ls /etc/logrotate.d/ | grep -i "kolla\|openstack"
   ```
   Expected: Logrotate configuration exists for Kolla service logs.

4. Verify log files are not writable by service accounts:
   ```bash
   ls -la /var/log/kolla/keystone/ | head -5
   ```
   Expected: Log files owned by root or a dedicated logging user. Group and other write
   bits not set (`---` in group/other write position).

**Pass Criteria:** Authentication events appear in logs within 5 seconds of occurrence.
Log rotation configured. Log files not writable by service accounts.

**Fail Action:** BLOCK -- Enable audit logging in Keystone configuration. Configure logrotate.
Fix file permissions on log directory.

**Rollback:** N/A -- Test is read-only (except for the token issue in Step 2, which is
a standard read operation).

---

## Operational Safety

### SC-005: Destructive Operations Have Rollback

**Requirement:** Every procedure tagged `destructive: true` in the runbook library has a
non-empty `rollback` section.
**Component:** Runbook library
**Verification Method:** I (Inspection)

**Preconditions:**
- Runbook library accessible at `docs/runbooks/`
- Runbooks follow standard format (defined in `skills/methodology/runbook-generator/SKILL.md`)

**Procedure:**

1. Find all runbooks tagged as destructive:
   ```bash
   grep -rl "destructive.*true\|destructive: true" docs/runbooks/
   ```
   Expected: List of runbook files. If list is empty, verify runbooks use the correct tag format.

2. For each destructive runbook, verify rollback section exists and is non-empty:
   ```bash
   for runbook in $(grep -rl "destructive.*true" docs/runbooks/); do
     ROLLBACK=$(grep -A 20 "^## Rollback\|^### Rollback\|^ROLLBACK" "${runbook}" | grep -v "^##\|^###\|^ROLLBACK" | grep -v "^$" | head -3)
     if [ -z "${ROLLBACK}" ]; then
       echo "FAIL: ${runbook} has no rollback content"
     else
       echo "PASS: ${runbook} has rollback"
     fi
   done
   ```
   Expected: All runbooks print "PASS". Any "FAIL" entry must be resolved before deploying.

3. Spot-check three rollback sections for quality:
   - Select three runbooks from the destructive list
   - Open each and verify the Rollback section contains actual commands, not placeholder text
   - Expected: Rollback steps include executable commands with expected results

**Pass Criteria:** 100% of destructive runbooks have non-empty rollback sections with
at least one executable step.

**Fail Action:** BLOCK -- Add rollback procedures to all runbooks missing them before
any destructive operation is authorized.

**Rollback:** N/A -- Inspection only.

---

### SC-010: Backup Procedures Produce Restorable Data

**Requirement:** Backup procedure creates restorable data. System can be restored from backup.
**Component:** openstack-backup skill
**Verification Method:** D (Demonstration)

**Preconditions:**
- Backup procedure documented in `docs/runbooks/backup/`
- A test instance or volume exists for backup testing
- Sufficient storage for backup artifact

**Procedure:**

1. Create a test resource with known content:
   ```bash
   source local/openrc
   openstack volume create --size 1 sc010-test-volume
   # Note the volume ID for tracking
   ```

2. Execute the documented backup procedure from the runbook (follow it step-by-step):
   ```bash
   # Follow RB-BACKUP-001 or equivalent backup runbook exactly
   # Record: backup artifact location, timestamp, size
   ```
   Expected: Backup artifact created at documented location.

3. Modify the test resource to create a difference to detect after restore:
   ```bash
   # Attach volume, write a known string, detach
   # (or create a volume snapshot comparison)
   openstack volume snapshot create --volume sc010-test-volume sc010-pre-modify
   ```

4. Execute the documented restore procedure:
   ```bash
   # Follow the documented restore procedure exactly
   # Restore from backup artifact created in Step 2
   ```
   Expected: Restore procedure completes without error. Volume returns to pre-modification state.

5. Verify restore integrity:
   ```bash
   openstack volume show sc010-test-volume -f value -c status
   ```
   Expected: `available` (or `in-use` if attached). Compare snapshots to confirm pre-modification
   state was restored.

6. Clean up test resources:
   ```bash
   openstack volume snapshot delete sc010-pre-modify
   openstack volume delete sc010-test-volume
   ```

**Pass Criteria:** Backup artifact is created, restore procedure executes without error,
and restored resource matches pre-modification state.

**Fail Action:** BLOCK -- Document which step of the backup or restore procedure failed.
Fix the backup/restore procedure before authorizing any destructive operations.

**Rollback:** Run Step 6 cleanup.

---

### SC-011: Hardware Requirements Checked Before Deploy

**Requirement:** SCOUT agent blocks deployment when hardware does not meet minimums:
RAM < 16 GB or disk < 100 GB available.
**Component:** Deployment crew -- SCOUT role
**Verification Method:** A (Analysis) + I (Inspection)

**Preconditions:**
- Deployment crew configuration accessible
- SCOUT role defined with hardware check procedure

**Procedure:**

1. Verify SCOUT is defined in deployment crew:
   ```bash
   grep -A 10 "id: scout" config/crews/deployment-crew.yaml
   ```
   Expected: SCOUT role present with `openstack-kolla-ansible` skill and hardware inventory
   in recommended skills.

2. Inspect pre-deploy gates configuration:
   ```bash
   cat configs/gates/pre-deploy-gates.yaml 2>/dev/null || grep -r "pre-deploy\|hardware.*check\|memory.*check\|disk.*check" configs/ docs/ 2>/dev/null | head -10
   ```
   Expected: Hardware check gate defined with RAM >= 16GB and disk >= 100GB thresholds.

3. Verify the hardware check command produces expected output format:
   ```bash
   free -g | awk '/Mem:/{print "RAM:", $2, "GB"}'
   df -BG / | awk 'NR==2{print "Disk:", $4, "available"}'
   ```
   Expected: Output shows current RAM and disk. Confirm values exceed minimums.

4. Verify SCOUT's block behavior is documented:
   ```bash
   grep -r "block\|halt\|abort\|minimum" docs/operations-manual/ configs/ 2>/dev/null | grep -i "RAM\|memory\|disk\|GB" | head -5
   ```
   Expected: Documentation describes SCOUT blocking deployment on insufficient resources.

**Pass Criteria:** SCOUT role defined with hardware inventory skills, pre-deploy gates
define minimum thresholds (16GB RAM, 100GB disk), and SCOUT blocking behavior is documented.

**Fail Action:** BLOCK -- Define hardware check gates. Verify SCOUT's skill loadout includes
hardware inventory capability.

**Rollback:** N/A -- Inspection only.

---

### SC-021: Rollback Tested for Deployment

**Requirement:** Full deployment can be rolled back to pre-deployment state without data
loss on the host system.
**Component:** openstack-kolla-ansible skill
**Verification Method:** D (Demonstration)

**Preconditions:**
- Kolla-Ansible deployment has been performed
- Rollback procedure documented in `docs/runbooks/deployment/`
- Host system state documented (disk usage, running services) before deployment

**Procedure:**

1. Document the current deployed state:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}" | head -20
   df -h / /var/lib/docker
   openstack service list
   ```
   Record: Number of running containers, disk usage, service list.

2. Run a minor configuration change to create a rollback scenario:
   ```bash
   # Make a documented, reversible config change
   # Example: change a non-critical parameter in globals.yml
   # Record the original value before changing
   ```

3. Execute the documented rollback procedure:
   ```bash
   # Follow the Kolla-Ansible rollback runbook (RB-DEPLOY-ROLLBACK or equivalent)
   # kolla-ansible reconfigure --tags keystone -i inventory/hosts  # partial example
   ```
   Expected: Services return to pre-change configuration.

4. Verify rolled-back state matches pre-change documentation:
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}" | head -20
   df -h / /var/lib/docker
   openstack service list
   ```
   Expected: Container count, disk usage, and service list match the state recorded in Step 1.

5. Verify no data loss occurred:
   ```bash
   # Verify test volume from SC-010 (or equivalent persistent data) still exists
   openstack volume list 2>/dev/null | head -5
   ```
   Expected: Pre-existing data resources are intact.

**Pass Criteria:** Post-rollback system state matches pre-deployment state. No data loss.
All services healthy after rollback.

**Fail Action:** BLOCK -- Document which aspect of the rollback failed. The rollback
procedure must be fully functional before any major deployment is authorized.

**Rollback:** If rollback test itself fails, manually restore using the documented restore
procedure for the affected component.

---

## Agent and System Safety

### SC-012: Budget Agent Halts on Token Exhaustion

**Requirement:** BUDGET agent sends warning to FLIGHT at 90% token consumption. EXEC
is blocked from new tasks at 95% consumption.
**Component:** Communication framework -- BUDGET role
**Verification Method:** I (Inspection) + A (Analysis)

**Preconditions:**
- Deployment crew configuration accessible
- BUDGET role defined
- Budget monitoring loop configuration accessible

**Procedure:**

1. Verify BUDGET is defined in deployment crew:
   ```bash
   grep -A 15 "id: budget" config/crews/deployment-crew.yaml
   ```
   Expected: BUDGET present with `communication_loop: budget` and `lifecycle: persistent`.

2. Inspect budget loop schema for threshold configuration:
   ```bash
   grep -r "90\|95\|threshold\|exhaustion\|token.*budget\|budget.*warn" configs/ docs/ 2>/dev/null | head -10
   ```
   Expected: 90% warning threshold and 95% block threshold documented or configured.

3. Verify BUDGET's advisory flow to FLIGHT is documented:
   ```bash
   grep -r "BUDGET\|budget" docs/operations-manual/ 2>/dev/null | grep -i "warn\|block\|FLIGHT\|halt" | head -5
   ```
   Expected: Documentation describes the warning path from BUDGET to FLIGHT and the
   subsequent EXEC block at 95%.

4. Verify the budget communication loop message schema exists:
   ```bash
   cat configs/chipset.yaml 2>/dev/null | grep -A 20 "budget" | head -25
   ```
   Expected: Budget loop defined with warning and block message types.

**Pass Criteria:** BUDGET role defined with persistent lifecycle, 90% and 95% thresholds
documented, advisory path to FLIGHT specified.

**Fail Action:** BLOCK -- Define BUDGET role thresholds and document the budget monitoring
protocol before authorizing long-running deployments.

**Rollback:** N/A -- Inspection only.

---

### SC-013: VERIFY Agent Independent from EXEC

**Requirement:** VERIFY cannot read EXEC's implementation context. VERIFY receives
only artifacts (outputs), not EXEC's reasoning or intermediate decisions.
**Component:** Agent configuration -- deployment-crew.yaml, operations-crew.yaml
**Verification Method:** I (Inspection)

**Preconditions:**
- `config/crews/deployment-crew.yaml` accessible
- `config/crews/operations-crew.yaml` accessible

**Procedure:**

This test procedure is fully specified in `docs/vv/verify-agent-independence.md`. The
procedure below is a summary; the authoritative steps with full expected output are in that
document.

1. Verify VERIFY skill loadout in deployment crew contains only `doc-verifier`:
   ```bash
   grep -A 15 "id: verify" config/crews/deployment-crew.yaml | grep -E "skills:|  - "
   ```
   Expected: `doc-verifier` only. No OpenStack deployment skills.

2. Verify no EXEC agent in deployment crew carries `doc-verifier`:
   ```bash
   grep -A 20 "id: exec-keystone" config/crews/deployment-crew.yaml | grep "doc-verifier"
   grep -A 20 "id: exec-compute" config/crews/deployment-crew.yaml | grep "doc-verifier"
   grep -A 20 "id: exec-network-storage" config/crews/deployment-crew.yaml | grep "doc-verifier"
   ```
   Expected: No output from any command.

3. Verify VERIFY in operations crew carries only `doc-verifier`:
   ```bash
   grep -A 10 "id: verify" config/crews/operations-crew.yaml | grep -E "skills:|  - "
   ```
   Expected: `doc-verifier` only.

4. Verify operations EXEC does not carry `doc-verifier`:
   ```bash
   grep -A 20 "id: exec" config/crews/operations-crew.yaml | grep "doc-verifier"
   ```
   Expected: No output.

5. Verify VERIFY uses forked context in both crews:
   ```bash
   grep -A 5 "id: verify" config/crews/deployment-crew.yaml | grep "context:"
   grep -A 5 "id: verify" config/crews/operations-crew.yaml | grep "context:"
   ```
   Expected: `context: fork` in both.

**Pass Criteria:** All five steps produce expected output. See `docs/vv/verify-agent-independence.md`
for complete pass/fail criteria and the 5-point independence audit checklist.

**Fail Action:** BLOCK -- VERIFY independence requirement violated. Correct crew configuration.
See `docs/vv/verify-agent-independence.md` for remediation guidance.

**Rollback:** N/A -- Inspection only.

---

### SC-014: Staging Layer Scans Community Content

**Requirement:** External skill or chipset variant submitted to staging layer goes through
quarantine → scan → release or reject pipeline before becoming available.
**Component:** Chipset definition -- staging pipeline
**Verification Method:** D (Demonstration) + I (Inspection)

**Preconditions:**
- Staging pipeline configuration accessible
- A test skill or chipset variant available for submission

**Procedure:**

1. Inspect staging pipeline configuration:
   ```bash
   cat configs/staging-pipeline.yaml 2>/dev/null || grep -r "staging\|quarantine\|scan" configs/ docs/ 2>/dev/null | head -10
   ```
   Expected: Staging pipeline defined with quarantine, scan, and release/reject stages.

2. Verify quarantine stage is enforced (content isolated before scanning):
   ```bash
   grep -r "quarantine" configs/ docs/ 2>/dev/null | grep -v "#" | head -5
   ```
   Expected: Quarantine stage documented before any content scan or release.

3. Verify scan stage checks for safety issues:
   ```bash
   grep -r "scan\|inspect\|validate" configs/staging-pipeline.yaml 2>/dev/null | head -10
   ```
   Expected: Scan stage defined to check for malicious content, path traversal, YAML injection.

4. Submit a test submission and trace through pipeline (demonstration):
   - Create a minimal test skill file at `staging/test-skill-sc014.md`
   - Submit to staging pipeline per documented procedure
   - Verify it enters quarantine (not immediately available in `.claude/commands/`)
   - Verify scan executes before release
   - Release or reject the test submission

**Pass Criteria:** External content cannot bypass quarantine. Scan executes before any
content becomes available. Pipeline reject path is functional.

**Fail Action:** BLOCK -- Community content safety gate is non-functional. No external
skills or chipset variants may be accepted until the staging pipeline is operational.

**Rollback:** Delete test skill from staging directory.

---

### SC-019: HALT Signal Propagation

**Requirement:** HALT issued by any agent causes all agents to cease operations within
1 communication cycle. No partial operations continue after HALT.
**Component:** Communication framework
**Verification Method:** D (Demonstration) + I (Inspection)

**Preconditions:**
- Crew configuration accessible
- Communication bus schema accessible
- Understanding of Priority 0 message type

**Procedure:**

1. Verify HALT is defined as Priority 0 in the communication framework:
   ```bash
   grep -r "Priority 0\|HALT\|halt_signal" configs/chipset.yaml configs/ docs/ 2>/dev/null | head -10
   ```
   Expected: HALT defined as Priority 0 (highest priority, interrupts all other messages).

2. Inspect communication bus for HALT propagation rules:
   ```bash
   grep -r "HALT\|all.*agents.*halt\|propagat" configs/ docs/ 2>/dev/null | grep -v "#" | head -10
   ```
   Expected: Rules state HALT reaches all agents within 1 communication cycle.

3. Verify no agent is excluded from HALT:
   ```bash
   grep -r "exclude.*HALT\|ignore.*HALT\|bypass.*HALT" configs/ docs/ 2>/dev/null
   ```
   Expected: No output. Every agent must respond to HALT.

4. Verify agent implementations acknowledge HALT:
   ```bash
   grep -r "HALT\|halt" config/crews/ 2>/dev/null | grep -v "#" | head -10
   ```
   Expected: HALT handling referenced in crew configuration or agent documentation.

5. Review HALT behavior documentation for partial operations:
   - Verify documentation states agents must not commit partial state after HALT
   - Verify rollback of in-progress operations is specified in HALT handling

**Pass Criteria:** HALT defined as Priority 0, propagates to all agents, no agent excluded,
partial operations are rolled back, and 1-cycle propagation requirement is documented.

**Fail Action:** BLOCK -- HALT propagation is not correctly specified. Deploy without HALT
guarantee creates risk of partial operations in production.

**Rollback:** N/A -- Inspection only.

---

## Documentation Safety

### SC-016: Volume Encryption at Rest

**Requirement:** Cinder volumes created with encryption type. Volume data is unreadable
without the encryption key.
**Component:** openstack-cinder skill
**Verification Method:** T (Test) + A (Analysis)

**Preconditions:**
- Cinder deployed with encryption support
- Barbican key manager running (for key management)
- Admin credentials available

**Procedure:**

1. Verify Cinder encryption type exists:
   ```bash
   source local/openrc
   openstack volume type list --long | grep -i "encrypt"
   ```
   Expected: At least one volume type with encryption configured.

2. Create a test encrypted volume:
   ```bash
   ENCRYPTED_TYPE=$(openstack volume type list --long | grep -i "encrypt" | awk '{print $4}' | head -1)
   openstack volume create --size 1 --type "${ENCRYPTED_TYPE}" sc016-encrypted-test
   ```
   Expected: Volume created with encrypted type.

3. Verify encryption metadata is set on the volume:
   ```bash
   openstack volume show sc016-encrypted-test -f json | python3 -c "import sys, json; v=json.load(sys.stdin); enc=v.get('encrypted',False); print('Encrypted:', enc); sys.exit(0 if enc else 1)"
   ```
   Expected: `Encrypted: True`

4. Verify encryption configuration in Cinder configuration:
   ```bash
   grep -r "encryption\|barbican\|key.*provider" /etc/kolla/cinder/ 2>/dev/null | grep -v "#" | head -5
   ```
   Expected: Encryption provider configured (Barbican or LUKS).

5. Clean up:
   ```bash
   openstack volume delete sc016-encrypted-test
   ```

**Pass Criteria:** Encrypted volume type exists, volumes can be created with encryption,
and encrypted flag is confirmed in volume metadata.

**Fail Action:** BLOCK -- Configure Cinder encryption type. Volumes without encryption
fail this safety requirement.

**Rollback:** Run Step 5 cleanup.

---

### SC-018: Doc-Verified Flag Accurate

**Requirement:** Procedures marked "doc-verified" actually pass automated verification
against the running system.
**Component:** doc-verifier skill
**Verification Method:** T (Test)

**Preconditions:**
- doc-verifier skill operational
- At least one procedure marked as "doc-verified" in the operations manual
- Running OpenStack system to verify against

**Procedure:**

1. Find all documents with "doc-verified" status:
   ```bash
   grep -rl "doc-verified\|VERIFIED\|LAST VERIFIED" docs/operations-manual/ docs/runbooks/ 2>/dev/null
   ```
   Expected: List of verified documents.

2. Run doc-verifier against the first verified document:
   ```bash
   doc-verifier verify "$(grep -rl 'LAST VERIFIED' docs/operations-manual/ | head -1)"
   ```
   Expected: `0 drift items. Document verified.` If drift is found, the "doc-verified"
   flag is inaccurate.

3. Run doc-verifier against all "doc-verified" procedures:
   ```bash
   VERIFIED_DOCS=$(grep -rl "LAST VERIFIED\|doc-verified" docs/operations-manual/ docs/runbooks/ 2>/dev/null)
   FAILURES=0
   for doc in ${VERIFIED_DOCS}; do
     RESULT=$(doc-verifier verify "${doc}" 2>&1)
     if echo "${RESULT}" | grep -q "CRITICAL\|FAIL"; then
       echo "FAIL: ${doc} is marked verified but has drift"
       FAILURES=$((FAILURES + 1))
     fi
   done
   echo "Total failures: ${FAILURES}"
   ```
   Expected: `Total failures: 0`

4. Verify the drift detection itself works (reference DRIFT-CONFIG-001 scenario):
   - Run baseline for a known-good document (expect 0 drift)
   - Introduce intentional drift per DRIFT-CONFIG-001 procedure
   - Confirm drift is detected (expect 1 drift report)
   - Restore baseline

   For full procedure, see `docs/vv/drift-detection-procedures.md`.

**Pass Criteria:** All "doc-verified" documents pass doc-verifier with 0 CRITICAL drift
items. The verifier demonstrates correct detection when drift is intentionally introduced.

**Fail Action:** BLOCK -- Remove "doc-verified" flag from any document that fails
verification. Update the document to match the running system and re-verify.

**Rollback:** If intentional drift was introduced in Step 4: `git checkout [modified-doc]`.

---

### SC-022: Doc Accuracy on Safety Procedures

**Requirement:** Every safety-critical runbook produces the documented expected result
when executed step-by-step.
**Component:** Runbook library
**Verification Method:** D (Demonstration)

**Preconditions:**
- Runbooks tagged as safety-critical accessible in `docs/runbooks/`
- Running OpenStack system for demonstration
- Test environment available (dedicated test project)

**Procedure:**

1. Identify all safety-critical runbooks:
   ```bash
   grep -rl "safety.critical\|safety_critical\|SAFETY" docs/runbooks/ 2>/dev/null
   ```
   Expected: List of runbooks. If none found, check runbook header format.

2. For each safety-critical runbook, execute Steps 1-3 (read-only steps only):
   ```bash
   # For each runbook, follow its procedure using read-only commands
   # Example for a Keystone runbook:
   openstack service list  # Expected: all services shown
   openstack endpoint list  # Expected: all endpoints shown
   # Compare output to documented expected results in the runbook
   ```

3. Record any discrepancy between documented expected output and actual output:
   - Format: `Runbook: [ID], Step: [N], Expected: [x], Actual: [y]`
   - Any discrepancy is a documentation accuracy failure.

4. For runbooks with destructive steps:
   - Verify preconditions section exists and is complete
   - Verify rollback section exists and has executable steps
   - Do NOT execute destructive steps during verification -- confirm structure only.

5. Report accuracy for all safety-critical runbooks:
   ```
   Safety-critical runbooks checked: [N]
   Accurate (steps produce documented results): [N]
   Inaccurate (discrepancies found): [N]
   ```
   Expected: 0 inaccurate runbooks.

**Pass Criteria:** 100% of safety-critical runbooks produce documented results when
executed step-by-step (read-only steps). All destructive runbooks have complete
precondition and rollback sections.

**Fail Action:** BLOCK -- Update inaccurate runbooks to match the running system. Re-verify
after update. Do not authorize safety procedures from unverified runbooks.

**Rollback:** N/A -- Read-only demonstration. Any test resources created must be documented
and removed as part of the demonstration cleanup.

---

## Summary Table

| Test ID | Name | Method | Status |
|---------|------|--------|--------|
| SC-001 | Credentials excluded from git | T | PENDING |
| SC-002 | Local-only directory isolation | I + T | PENDING |
| SC-003 | No external binding without HITL | A + T | PENDING |
| SC-004 | CAPCOM approval for external exposure | I + D | PENDING |
| SC-005 | Destructive ops have rollback | I | PENDING |
| SC-006 | Keystone token expiration configured | A | PENDING |
| SC-007 | TLS certificates validated | T + A | PENDING |
| SC-008 | RBAC policies enforce least privilege | T | PENDING |
| SC-009 | Security groups default deny | T | PENDING |
| SC-010 | Backup procedures produce restorable data | D | PENDING |
| SC-011 | Hardware requirements checked before deploy | A + I | PENDING |
| SC-012 | Budget agent halts on token exhaustion | I + A | PENDING |
| SC-013 | VERIFY agent independent from EXEC | I | PENDING |
| SC-014 | Staging layer scans community content | D + I | PENDING |
| SC-015 | Network isolation between tenants | D | PENDING |
| SC-016 | Volume encryption at rest | T + A | PENDING |
| SC-017 | Audit logging enabled | T + I | PENDING |
| SC-018 | Doc-verified flag accurate | T | PENDING |
| SC-019 | HALT signal propagation | D + I | PENDING |
| SC-020 | No credential logging | T | PENDING |
| SC-021 | Rollback tested for deployment | D | PENDING |
| SC-022 | Doc accuracy on safety procedures | D | PENDING |

**Total mandatory-pass tests:** 22

---

## Execution Notes

**Order matters.** Run tests in sequence SC-001 through SC-022. Credential and security
tests (SC-001 through SC-009) are foundational. If a credential test BLOCKs, resolve it
before continuing -- subsequent tests may use credentials or configuration that the early
tests are designed to verify.

**BLOCK is absolute.** A BLOCK result is not advisory. No further deployment activities
proceed until the BLOCK is resolved. Log the BLOCK result with:
- Timestamp of failure
- Test ID and name
- Observed behavior vs. expected behavior
- Evidence (command output, log excerpts)
- Resolution steps taken
- Re-test result (PASS required before continuing)

**Evidence preservation.** All test results must be recorded with timestamp and evidence.
For automated test steps, capture command output. For manual steps, photograph or transcribe
the result. Evidence is part of the V&V record required by NPR 7123.1 Process 7.

**Re-run requirement.** After any system change made to resolve a BLOCK, all previously-
passed SC tests in the affected component must be re-run. A fix that resolves SC-006 must
not break SC-007 or SC-008.

---

*Document maintained in `docs/vv/`. Re-run all tests after any deployment configuration change.*
*Cross-reference: `.planning/research/02-test-plan.md`, `docs/vv/verify-agent-independence.md` (SC-013), `docs/vv/drift-detection-procedures.md` (SC-018)*
