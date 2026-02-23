# End-to-End Deployment Verification Procedure

**Requirement:** VERIF-06
**NASA SE Phase:** Phase D -- System Assembly, Integration and Test, Launch (SIR Gate)
**Chipset:** openstack-nasa-se
**Version:** 1.0.0
**Prepared for:** OpenStack single-node deployment via Kolla-Ansible

---

## Overview

This procedure verifies the complete OpenStack deployment lifecycle from a fresh host system
through hardware inventory, crew-driven deployment, service verification, crew handoff to
operations, and final documentation accuracy check.

VERIF-06 requires a single verification artifact that proves the entire deployment pipeline
works end-to-end. This document connects all prior work -- skills, crews, chipset, evaluation
gates, and documentation -- into one verifiable sequence.

### Gate References

| Config | Purpose |
|--------|---------|
| `configs/evaluation/pre-deploy-gates.yaml` | PRE-001 through PRE-004 -- host readiness |
| `configs/evaluation/post-deploy-gates.yaml` | POST-001 through POST-009 -- service verification |
| `configs/crews/deployment-crew.yaml` | 12-role deployment crew configuration |
| `configs/crews/operations-crew.yaml` | 8-role operations crew configuration |
| `configs/crews/crew-handoff.yaml` | Deployment-to-operations transition procedure |

---

## Pre-Conditions

All four pre-deployment gates must pass (action: block) before this procedure begins.
These gates correspond to the NASA SE Phase C CDR gate -- the last check before fabrication.

### PRE-001: Hardware Inventory

Minimum requirements for single-node OpenStack:

| Resource | Minimum | Rationale |
|----------|---------|-----------|
| CPU cores | 4 | Hypervisor overhead plus service containers |
| RAM | 16 GB | OpenStack service containers require substantial memory |
| Disk | 100 GB | OS, container images, and Cinder volumes |
| Virtualization | VT-x / AMD-V | Nova requires hardware-assisted virtualization |

Gate config: `configs/evaluation/pre-deploy-gates.yaml` -- `id: PRE-001`

### PRE-002: Network Connectivity

| Check | Required |
|-------|---------|
| Management interface up | Yes |
| Default route exists | Yes |
| DNS resolves external hostnames | Yes |
| Internet access (container image pulls) | Yes |

Gate config: `configs/evaluation/pre-deploy-gates.yaml` -- `id: PRE-002`

### PRE-003: Resource Sufficiency

| Check | Minimum |
|-------|---------|
| Free RAM | 8 GB |
| Free disk | 50 GB |
| Port conflicts (5000, 8774, 9696, 8776, 9292, 6080, 8004, 80, 443) | None |
| Docker installed and running | Yes |

Gate config: `configs/evaluation/pre-deploy-gates.yaml` -- `id: PRE-003`

### PRE-004: OS Compatibility

| Check | Requirement |
|-------|------------|
| OS distribution | CentOS Stream 9 / Ubuntu 22.04 / Rocky Linux 9 |
| Kernel | 4.18+ |
| Python 3 | Present |
| Ansible | Present |
| Docker | Present |
| Git | Present |

Gate config: `configs/evaluation/pre-deploy-gates.yaml` -- `id: PRE-004`

---

## Verification Steps

### Stage 1 -- Fresh System Baseline

**NASA SE Reference:** Pre-integration baseline (Phase D entry)
**Purpose:** Establish a known-good starting state before any deployment activity. This creates
the before-snapshot for comparison after deployment.

**Checks:**

1. Record system identification:
   - Hostname
   - Management IP address
   - Disk configuration (`lsblk`)
   - RAM total (`free -g`)
   - CPU count and model
   - Kernel version (`uname -r`)

2. Verify no OpenStack services are running:
   - No Kolla containers present (`docker ps | grep -E 'keystone|nova|neutron|glance|cinder|horizon'`)
   - No OpenStack processes bound to service ports (5000, 8774, 9696, 8776, 9292)
   - No `/etc/kolla/` directory or directory is empty

3. Record git traceability:
   - Current git commit hash (`git rev-parse --short HEAD`)
   - Repository remote URL
   - Branch name

**Expected Result:** Clean system with no prior OpenStack artifacts.

**Pass Criteria:** All system state recorded; no OpenStack containers or processes found;
git commit hash captured.

---

### Stage 2 -- Pre-Deploy Gate Execution

**NASA SE Reference:** Phase C CDR Gate equivalent -- last check before fabrication begins
**Purpose:** Run the formal pre-deployment evaluation gates. All four gates must pass before
the deployment crew activates.

**Execution:** Run each gate in sequence. All use `action: block` -- a single failure halts
the procedure.

| Gate | Name | Check | Pass Criteria |
|------|------|-------|--------------|
| PRE-001 | hardware_inventory | CPU, RAM, disk, virtualization | >= 4 cores, >= 16 GB RAM, >= 100 GB disk, VT-x/AMD-V present |
| PRE-002 | network_connectivity | Interface, route, DNS, internet | All four checks pass |
| PRE-003 | resource_sufficiency | Free RAM, disk, ports, Docker | >= 8 GB free RAM, >= 50 GB free disk, no port conflicts, Docker running |
| PRE-004 | os_compatibility | OS version, required packages | Supported OS, Python 3, Ansible, Docker, Git present |

**Record for each gate:**
- Status: pass / fail
- Actual values observed (e.g., "CPU: 8 cores, expected >= 4: PASS")
- Timestamp
- Duration

**Gate config:** `configs/evaluation/pre-deploy-gates.yaml`

**Failure action:** If any gate fails, halt. Do not proceed to Stage 3. Follow failure
handling procedure (see Failure Handling section).

---

### Stage 3 -- Deployment Crew Activation

**NASA SE Reference:** Phase D integration crew assembly
**Purpose:** Verify the deployment crew configuration is valid and all crew positions are
defined before issuing the deployment directive.

**Crew Profile:** Squadron (all 12 role types, all 14 positions)

**Deployment crew positions per `configs/crews/deployment-crew.yaml`:**

| Tier | Role | Position ID | Domain | Lifecycle |
|------|------|------------|--------|-----------|
| 1 | FLIGHT | flight | mission control | persistent |
| 2 | PLAN | plan | decomposition | task |
| 2 | EXEC | exec-keystone | identity | task |
| 2 | EXEC | exec-compute | compute | task |
| 2 | EXEC | exec-network-storage | network-storage | task |
| 2 | VERIFY | verify | independent validation | task |
| 2 | INTEG | integ | cross-service interfaces | task |
| 2 | CAPCOM | capcom | human interface | persistent |
| 2 | TOPO | topo | topology management | persistent |
| 3 | CRAFT | craft-network | SDN specialist | on-demand |
| 3 | CRAFT | craft-security | RBAC/TLS specialist | on-demand |
| 3 | CRAFT | craft-storage | Cinder/Swift specialist | on-demand |
| 3 | SCOUT | scout | hardware survey | task |
| 3 | BUDGET | budget | token tracking | persistent |

**Activation sequence:**

1. FLIGHT issues deployment directive via command loop
2. PLAN decomposes deployment into phases, referencing `openstack-kolla-ansible` skill
3. SCOUT surveys system state -- records hardware baseline before first service deploy
4. EXEC agents execute deployment in their assigned domains (identity / compute / network-storage)
5. SCOUT surveys system state after each service deployment (before/after comparison)
6. VERIFY validates each service independently from EXEC (no shared implementation context)
7. INTEG monitors cross-service interfaces: Nova-Neutron, Nova-Cinder, Keystone-all
8. CAPCOM remains the sole human communication channel throughout

**Verify:** `configs/crews/deployment-crew.yaml` exists and is valid YAML.

**Pass Criteria:** Crew config present; all 14 positions defined; CAPCOM designated as sole
`human_interface: true` agent; human_interface isolation rule present.

---

### Stage 4 -- Kolla-Ansible Deployment

**NASA SE Reference:** Phase D fabrication -- building the system
**Purpose:** Execute the four-phase Kolla-Ansible deployment sequence and record the result
of each phase.

**Deployment sequence:**

| Phase | Command | Purpose | Record |
|-------|---------|---------|--------|
| 1. Bootstrap | `kolla-ansible bootstrap-servers` | Install dependencies on target hosts | Exit status, duration |
| 2. Pre-checks | `kolla-ansible prechecks` | Final validation before deploy | Exit status, duration, any warnings |
| 3. Deploy | `kolla-ansible deploy` | Deploy all OpenStack services | Exit status, duration |
| 4. Post-deploy | `kolla-ansible post-deploy` | Source credentials, finalize config | Exit status, duration |

**For each command, record:**
- Exit status (0 = success, non-zero = failure)
- Wall-clock duration in seconds
- Last 20 lines of stdout for traceability
- Any error output to stderr

**Skip condition:** If OpenStack is not deployed on this system (development/CI context),
record Stage 4 as `status: skip` with note: "OpenStack not deployed -- stage skipped.
Deploy using kolla-ansible before running post-deploy gates."

**Pass Criteria:** All four commands exit with status 0; credentials file generated
at `/etc/kolla/admin-openrc.sh` or equivalent; at least one Kolla container running
(`docker ps | grep kolla`).

---

### Stage 5 -- Post-Deploy Gate Execution

**NASA SE Reference:** Phase D SIR Gate -- System Integration Review proving the deployed
system works as an integrated whole
**Purpose:** Run the formal post-deployment evaluation gates. Gates execute in dependency
order. Blocking gates must pass before crew handoff can proceed.

**Execution order per `configs/evaluation/post-deploy-gates.yaml`:**

**Group 1 -- Foundation (must pass first):**

| Gate | Name | Command | Action | Blocks Handoff |
|------|------|---------|--------|---------------|
| POST-001 | keystone_auth | `openstack token issue -f json` | block | YES |

POST-001 must pass before any Group 2 gate executes. Keystone is the auth foundation for
all other services. If POST-001 fails, all dependent gates automatically receive
`status: skip`.

**Group 2 -- Service Checks (parallel after POST-001):**

| Gate | Name | Command | Action | Blocks Handoff |
|------|------|---------|--------|---------------|
| POST-002 | nova_compute | `openstack hypervisor list -f json` | block | YES |
| POST-003 | neutron_network | `openstack network agent list -f json` | block | YES |
| POST-004 | glance_images | `openstack image list -f json` | warn | No |
| POST-005 | cinder_storage | `openstack volume service list -f json` | warn | No |
| POST-006 | horizon_dashboard | `curl -s -o /dev/null -w '%{http_code}' http://localhost/auth/login/` | warn | No |
| POST-007 | service_catalog_complete | `openstack catalog list -f json` | block | YES |

**Group 3 -- Integration Tests (after all service checks):**

| Gate | Name | Command | Action | Blocks Handoff |
|------|------|---------|--------|---------------|
| POST-008 | end_to_end_vm_lifecycle | Create network+flavor, list images, cleanup | warn | No |
| POST-009 | doc_verification | Doc-verifier drift detection | warn | No |

**Blocking gates for crew handoff:** POST-001, POST-002, POST-003, POST-007

**Record for each gate:**
- Status: pass / fail / warn / skip
- Actual values vs expected
- `depends_on_status` for gates with dependencies
- Timestamp and duration

**Gate config:** `configs/evaluation/post-deploy-gates.yaml`

**Skip condition:** If Stage 4 was skipped (OpenStack not deployed), all post-deploy gates
receive `status: skip`.

**Pass Criteria:** POST-001, POST-002, POST-003, POST-007 all pass; remaining gates
pass or warn; no skip unless Stage 4 was skipped.

---

### Stage 6 -- Operations Handoff

**NASA SE Reference:** Phase D-to-E transition -- from fabrication to operations
**Purpose:** Transfer complete system knowledge from the deployment crew to the operations
crew. Context loss at handoff means the operations team starts blind.

**Handoff procedure per `configs/crews/crew-handoff.yaml` (transition: deployment-to-operations):**

**9-step procedure:**

| Step | Action | Agent | Gate Type |
|------|--------|-------|-----------|
| 1 | VERIFY runs final health check on all deployed services | verify | blocking |
| 2 | FLIGHT collects context from all deployment agents | flight | blocking |
| 3 | CAPCOM notifies human: "Deployment complete. Transitioning to operations crew." | capcom | informational |
| 4 | Context bundle written to `.planning/bus/command/handoff-context.json` | flight | blocking |
| 5 | Deployment crew positions deactivated (except CAPCOM during transition) | flight | blocking |
| 6 | Operations crew activated at patrol profile | flight | blocking |
| 7 | Operations FLIGHT reads handoff context and distributes to crew | flight | blocking |
| 8 | SURGEON begins initial health monitoring baseline | surgeon | informational |
| 9 | CAPCOM confirms: "Operations crew active. All systems nominal." | capcom | informational |

**Context bundle must contain** (per `crew-handoff.yaml` `context_preservation`):**

| Context Item | Source Agent | Format |
|-------------|-------------|--------|
| deployed_services | verify | yaml |
| configuration_snapshot | exec-keystone | file_references |
| network_topology | exec-network-storage | yaml |
| verification_results | verify | markdown |
| deployment_decisions | flight | log |

**Operations crew positions per `configs/crews/operations-crew.yaml`:**

| Role | Position | Domain | Key Difference from Deployment |
|------|----------|--------|-------------------------------|
| FLIGHT | flight | day-2 orchestration | Same tier, ops-focused skills |
| SURGEON | surgeon | health monitoring | New: polls all service endpoints every 60s |
| EXEC | exec | maintenance tasks | Single EXEC (ops sequential vs deploy parallel) |
| VERIFY | verify | procedure validation | Independent from EXEC |
| CAPCOM | capcom | human interface | Persists across transition (continuity) |
| CRAFT | craft-monitoring | Prometheus/Grafana | Replaces craft-network/security/storage |
| LOG | log | audit trail | New: records all EXEC/VERIFY/SURGEON actions |
| GUARD | guard | security monitoring | Replaces craft-security (ongoing vs deployment) |

**SURGEON health monitoring:** After activation, SURGEON begins monitoring:
- Keystone `/v3/auth/tokens` -- every 60 seconds
- Nova `/v2.1/os-hypervisors` -- every 60 seconds
- Neutron `/v2.0/networks` -- every 60 seconds
- Cinder `/v3/volumes` -- every 60 seconds
- Glance `/v2/images` -- every 60 seconds

**CAPCOM continuity:** CAPCOM persists across the transition. The human operator
experiences a seamless handoff -- their communication channel never drops.

**Verify:** `configs/crews/crew-handoff.yaml` exists; `configs/crews/operations-crew.yaml`
exists; handoff-context.json written; SURGEON confirmed active.

**Pass Criteria:** All 9 handoff steps complete; 5 context items transferred; operations
FLIGHT confirms context received; SURGEON health monitoring active; CAPCOM confirms
handoff complete to human operator.

---

### Stage 7 -- Documentation Verification

**NASA SE Reference:** Phase D closeout -- verifying "as-built" matches documentation
**Purpose:** Run doc-verifier drift detection against the running system. Ensures all
documentation delivered during the project reflects the actual deployed configuration.

**Documents to verify:**

| Document | Check | Pass Criteria |
|----------|-------|--------------|
| Sysadmin Guide | Service endpoint URLs match running Keystone catalog | No endpoint drift |
| Sysadmin Guide | Configuration values match kolla-ansible globals.yml | No config drift |
| Ops Manual | Procedure steps reference correct service versions | No version drift |
| Runbooks | Preconditions match actual system state | All preconditions valid |
| Quick Reference | Ports, service names, log locations accurate | No factual errors |

**Drift detection procedure:**

1. Load Keystone service catalog: `openstack catalog list -f json`
2. Compare documented endpoints (in sysadmin guide) against catalog -- record any mismatch
3. Load kolla-ansible configuration: `cat /etc/kolla/globals.yml`
4. Compare documented config values against running config -- record any drift
5. Check service versions in ops manual against `docker ps` container image tags
6. Validate runbook preconditions against current system state
7. Spot-check quick reference card -- ports, log paths, service names

**Drift findings format:**
```yaml
drift_finding:
  document: "docs/sysadmin-guide/chapter-X.md"
  location: "Section Y, line Z"
  expected: "documented value"
  actual: "running system value"
  severity: warn  # warn | block
```

**Doc-sync loop trigger** (if drift found):
- Trigger VERIFY-docs drift check
- EXEC-docs applies updates
- See `.planning/bus/doc-sync/loop.yaml` for trigger chain

**Pass Criteria:** Zero blocking drift findings; any warning-level drift findings logged
and queued for doc-sync loop; documentation covers current service configuration without
gaps.

---

## Expected Results Table

| Stage | Name | Pass Criteria | Status |
|-------|------|--------------|--------|
| 1 | Fresh System Baseline | System state recorded; no OpenStack present; git hash captured | [result] |
| 2 | Pre-Deploy Gate Execution | PRE-001, PRE-002, PRE-003, PRE-004 all pass | [result] |
| 3 | Deployment Crew Activation | Crew config valid; 14 positions defined; CAPCOM isolation confirmed | [result] |
| 4 | Kolla-Ansible Deployment | All 4 phases exit 0; credentials generated; containers running | [result] |
| 5 | Post-Deploy Gate Execution | POST-001, 002, 003, 007 pass; others pass or warn | [result] |
| 6 | Operations Handoff | 9-step procedure complete; context transferred; SURGEON active | [result] |
| 7 | Documentation Verification | No blocking drift; warnings queued for doc-sync | [result] |

**Overall Verdict:** PASS when all stages pass (or skip with documented reason).

---

## Git History Requirements

**Requirement:** INTEG-05 -- all deployment decisions committed with configuration change rationale.

Every deployment action must produce a git commit traceable to the system change it represents.

### Required Commit Artifacts

| Event | Commit Content | Commit Message Pattern |
|-------|---------------|----------------------|
| Pre-deploy gate results | `pre-deploy-results.yaml` | `chore(verification): record pre-deploy gate results` |
| kolla-ansible globals.yml change | Updated globals.yml | `feat(config): configure [service] -- [rationale]` |
| Deployment completion | Post-deploy results | `chore(verification): record post-deploy gate results` |
| Handoff context | `handoff-context.json` | `chore(handoff): transfer context to operations crew` |
| Documentation drift findings | Drift report | `docs(verification): record doc drift findings` |
| Verification results | `e2e-deployment-results.yaml` | `chore(verification): record e2e verification outcome` |

### Traceability Chain

```
git commit hash (Stage 1)
    --> pre-deploy-results.yaml
        --> post-deploy-results.yaml
            --> handoff-context.json
                --> e2e-deployment-results.yaml
```

Every result file references the git commit hash at time of execution, creating a complete
audit trail from initial system state through operations handoff.

---

## Failure Handling

### Pre-Deploy Gate Failure (Stage 2)

**If PRE-001 fails (hardware):**
- Upgrade hardware to meet minimums: 4 CPU cores, 16 GB RAM, 100 GB disk, VT-x/AMD-V
- Re-run the hardware inventory gate in isolation before re-running Stage 2
- Gate config: `configs/evaluation/pre-deploy-gates.yaml` remediation field

**If PRE-002 fails (network):**
- Configure network interfaces; verify default route; test DNS with `host -t A docs.openstack.org`
- Test internet access: `curl -s --connect-timeout 5 https://releases.openstack.org/`
- Re-run after network configuration is corrected

**If PRE-003 fails (resources):**
- Stop unnecessary services to free RAM; clear disk space; resolve port conflicts
- Verify Docker: `systemctl is-active docker`
- Re-run resource check before attempting deployment

**If PRE-004 fails (OS compatibility):**
- Install missing packages: `pip3 install ansible-core`, `apt install docker-ce git` (or yum equivalent)
- Supported OS: CentOS Stream 9, Ubuntu 22.04, Rocky Linux 9, Debian 12
- Re-run OS check before attempting deployment

**Re-test procedure:** Fix the failing condition, then re-run `bash scripts/e2e-deployment-verification.sh`
from Stage 2 (or use `--start-stage 2` flag).

---

### Deployment Failure (Stage 4)

**If bootstrap-servers fails:**
- Check SSH connectivity to all hosts in Kolla inventory
- Verify Ansible can reach hosts: `ansible -i ansible/inventory/multinode all -m ping`
- Check Python 3 availability on target hosts

**If prechecks fail:**
- Read precheck output carefully -- each failure has an explicit message
- Common issues: docker not running, insufficient disk, SELinux in enforcing mode
- Fix specific failing checks, then re-run prechecks

**If deploy fails:**
- Check container logs: `docker logs <container_name>`
- Review Kolla deployment log at `/var/log/kolla/`
- Run targeted re-deploy: `kolla-ansible deploy --tags <service>`

**Rollback procedure (if deploy is non-recoverable):**
1. `kolla-ansible destroy --yes-i-really-really-mean-it`
2. Clean Docker state: `docker system prune -f`
3. Remove kolla config: `rm -rf /etc/kolla/`
4. Return to Stage 1 -- fresh system baseline
5. Document root cause before attempting re-deployment

---

### Post-Deploy Gate Failure (Stage 5)

**If POST-001 fails (Keystone):**
- Check container: `docker ps | grep keystone`
- Check logs: `docker logs keystone_api`
- Verify endpoint: `openstack catalog show identity`
- Common issues: database connectivity, fernet key rotation, Apache configuration

**If POST-002 fails (Nova):**
- Check compute services: `openstack compute service list`
- Check libvirt connection in nova-compute container
- Verify compute node registration

**If POST-003 fails (Neutron):**
- Check agents: `openstack network agent list`
- Verify OVS bridge: `ovs-vsctl show`
- Check containers: `docker ps | grep neutron`

**If POST-007 fails (service catalog):**
- Missing catalog entries indicate incomplete deployment
- Re-run `kolla-ansible deploy` for the missing service
- Check: `openstack endpoint list`

For all blocking gate failures: do not proceed to Stage 6. Resolve the gate failure,
then re-run Stage 5 in isolation.

---

### Documentation Drift (Stage 7)

**Trigger doc-sync loop:**
```
.planning/bus/doc-sync/trigger.yaml
  --> VERIFY-docs checks drift findings
  --> EXEC-docs applies updates
  --> VERIFY-docs re-checks for closure
```

Drift findings are advisory (action: warn) -- they do not block operations handoff
but must be resolved before the next milestone gate.

---

## Appendix: Verification Script

The automated version of this procedure is at:

```
scripts/e2e-deployment-verification.sh
```

Key flags:
- `--dry-run` -- prints what would be checked without executing checks
- Results written to `configs/evaluation/e2e-deployment-results.yaml`

Run for development/CI validation:
```bash
bash scripts/e2e-deployment-verification.sh --dry-run
```

Run for production deployment verification:
```bash
bash scripts/e2e-deployment-verification.sh
```
