# GSD OpenStack Cloud Platform (NASA SE Edition) — Test Plan

**Total Tests:** 148 | **Safety-Critical:** 22 | **Target Coverage:** 95%+

---

## Test Categories

| Category | Count | Priority | Failure Action |
|----------|-------|----------|---------------|
| Safety-critical | 22 | Mandatory | BLOCK |
| Core functionality | 52 | Required | BLOCK |
| Integration | 38 | Required | BLOCK |
| Documentation verification | 24 | Required | BLOCK |
| Edge cases | 12 | Best-effort | LOG |

---

## Safety-Critical Tests (Mandatory Pass)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| SC-001 | Credentials excluded from git | `git log --all --diff-filter=A -- '*.conf' '*.env'` contains no passwords, tokens, or private keys | All skills |
| SC-002 | Local-only directory isolation | `local/` directory is in `.gitignore`; `git status` never shows local config files | Infrastructure |
| SC-003 | No external binding without HITL | Default Kolla-Ansible config binds only to management network; no service listens on external interface | Deployment crew |
| SC-004 | CAPCOM approval for external exposure | Attempting to bind to external network triggers CAPCOM → human confirmation loop; proceeds only on explicit "yes" | Communication framework |
| SC-005 | Destructive ops have rollback | Every procedure tagged `destructive: true` has a non-empty `rollback` section | Runbook library |
| SC-006 | Keystone token expiration configured | Token lifetime ≤ 3600s; fernet key rotation schedule documented | openstack-keystone skill |
| SC-007 | TLS certificates validated | All service endpoints use TLS; certificate chain validates; expiry > 30 days | openstack-security skill |
| SC-008 | RBAC policies enforce least privilege | Default project member cannot perform admin operations; verified via policy test | openstack-keystone skill |
| SC-009 | Security groups default deny | New security group has no ingress rules; verified on fresh project creation | openstack-neutron skill |
| SC-010 | Backup procedures produce restorable data | Backup created; system modified; restore executed; pre-modification state confirmed | openstack-backup skill |
| SC-011 | Hardware requirements checked before deploy | SCOUT agent blocks deployment when RAM < 16GB or disk < 100GB | Deployment crew |
| SC-012 | Budget agent halts on token exhaustion | BUDGET detects >90% token consumption; sends warning to FLIGHT; blocks new EXEC at 95% | Communication framework |
| SC-013 | VERIFY agent independent from EXEC | VERIFY cannot read EXEC's implementation context; receives only artifacts | Agent configuration |
| SC-014 | Staging layer scans community content | External skill/chipset submitted → staging layer quarantine → scan → release or reject | Chipset definition |
| SC-015 | Network isolation between tenants | Instance in Project A cannot reach instance in Project B without explicit router configuration | openstack-neutron skill |
| SC-016 | Volume encryption at rest | Cinder volumes created with encryption type; data unreadable without key | openstack-cinder skill |
| SC-017 | Audit logging enabled | All Keystone auth events logged; log rotation configured; logs cannot be modified by service accounts | openstack-security skill |
| SC-018 | Doc-verified flag accurate | Procedure marked "verified" actually passes automated verification against running system | doc-verifier skill |
| SC-019 | HALT signal propagation | HALT issued by any agent → all agents cease within 1 communication cycle; no partial operations | Communication framework |
| SC-020 | No credential logging | Service logs do not contain passwords, tokens, or certificate private keys in any verbosity level | All OpenStack skills |
| SC-021 | Rollback tested for deployment | Full deployment can be rolled back to pre-deployment state without data loss on host system | openstack-kolla-ansible skill |
| SC-022 | Doc accuracy on safety procedures | Every safety-critical runbook produces the documented expected result when executed step-by-step | Runbook library |

---

## Core Functionality Tests

### OpenStack Skills (24 tests)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| CF-SK-001 | Keystone skill loads through 6-stage pipeline | Score → Resolve → ModelFilter → CacheOrder → Budget → Load completes; skill available in context | openstack-keystone |
| CF-SK-002 | Keystone skill encapsulates deploy knowledge | Skill contains deploy procedure that, when followed, produces working Keystone service | openstack-keystone |
| CF-SK-003 | Keystone skill encapsulates operations knowledge | Skill contains procedures for user management, project creation, RBAC configuration | openstack-keystone |
| CF-SK-004 | Nova skill loads and deploys | Skill loads; deploy procedure produces working Nova scheduler + compute | openstack-nova |
| CF-SK-005 | Nova skill handles instance lifecycle | Create, start, stop, reboot, resize, delete, snapshot operations documented and functional | openstack-nova |
| CF-SK-006 | Neutron skill loads and configures SDN | Skill loads; deploy produces Neutron with OVS/OVN; network creation works | openstack-neutron |
| CF-SK-007 | Neutron skill handles network operations | Create network, subnet, router, security group, floating IP — all documented and functional | openstack-neutron |
| CF-SK-008 | Cinder skill loads and manages storage | Skill loads; volume create, attach, detach, snapshot, delete all work | openstack-cinder |
| CF-SK-009 | Glance skill loads and manages images | Skill loads; image upload, list, property management all work | openstack-glance |
| CF-SK-010 | Swift skill loads and manages objects | Skill loads; container create, object upload, download, delete all work | openstack-swift |
| CF-SK-011 | Heat skill loads and manages stacks | Skill loads; HOT template create, update, delete stack all work | openstack-heat |
| CF-SK-012 | Horizon skill loads and deploys dashboard | Skill loads; Horizon accessible via browser; all panels functional | openstack-horizon |
| CF-SK-013 | Kolla-Ansible skill manages deployment engine | Skill encapsulates bootstrap, deploy, reconfigure, upgrade procedures | openstack-kolla-ansible |
| CF-SK-014 | Monitoring skill configures observability | Prometheus scrape targets configured; Grafana dashboards deployed; alerts fire on test condition | openstack-monitoring |
| CF-SK-015 | Backup skill produces recovery procedures | Backup procedure creates restorable artifact; restore procedure verified | openstack-backup |
| CF-SK-016 | Security skill hardens deployment | TLS configured, RBAC enforced, unnecessary ports closed, audit logging enabled | openstack-security |
| CF-SK-017 | Networking-debug skill provides diagnostics | Packet trace, flow analysis, port status check procedures all produce actionable output | openstack-networking-debug |
| CF-SK-018 | Capacity skill manages resources | Quota check, resource usage report, capacity projection procedures functional | openstack-capacity |
| CF-SK-019 | NASA SE methodology skill maps phases | All 7 SE phases mapped to cloud ops equivalents; cross-references to SP-6105 accurate | nasa-se-methodology |
| CF-SK-020 | Ops-manual-writer produces formatted procedures | Procedure template generates NASA-format operations documents | ops-manual-writer |
| CF-SK-021 | Runbook-generator produces indexed entries | Generated runbooks have task index + symptom index; standard format per entry | runbook-generator |
| CF-SK-022 | Doc-verifier validates against running system | Verifier detects intentionally introduced documentation drift; reports discrepancy | doc-verifier |
| CF-SK-023 | All skills have troubleshooting sections | Every OpenStack skill contains troubleshooting guidance for common failure modes | All OpenStack skills |
| CF-SK-024 | Skills load within token budget | No individual skill exceeds 8K tokens when loaded; combined active skills ≤ 30K | All skills |

### Agent & Crew Configuration (16 tests)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| CF-AG-001 | Deployment crew activates at Squadron | All 12 roles instantiate; each receives correct skill loadout | Deployment crew |
| CF-AG-002 | Operations crew activates | All 8 roles instantiate; SURGEON begins health monitoring | Operations crew |
| CF-AG-003 | Documentation crew activates | All 8 roles instantiate; CRAFT-techwriter receives NASA SE skill | Documentation crew |
| CF-AG-004 | Scout profile activates (3 roles) | FLIGHT + EXEC + VERIFY only; other roles dormant | Activation profiles |
| CF-AG-005 | Patrol profile activates (7 roles) | Correct 7 roles active; remaining dormant | Activation profiles |
| CF-AG-006 | EXEC agents receive correct domain skills | exec-keystone has keystone skill; exec-compute has nova + glance; exec-network-storage has neutron + cinder | Deployment crew |
| CF-AG-007 | CRAFT agents trigger on domain keywords | "neutron" triggers craft-network; "RBAC" triggers craft-security; "volume" triggers craft-storage | Agent triggers |
| CF-AG-008 | TOPO manages topology transitions | Deployment starts leader-worker; shifts to map-reduce for parallel service deploy; returns for integration | Topology management |
| CF-AG-009 | CAPCOM is sole human interface | No agent other than CAPCOM sends messages to human; CAPCOM correctly relays HITL decisions | Communication |
| CF-AG-010 | RETRO captures phase retrospectives | After each wave completion, RETRO produces structured retrospective entry | Documentation crew |
| CF-AG-011 | PAO generates mission narrative | PAO produces human-readable changelog after each significant milestone | Documentation crew |
| CF-AG-012 | ANALYST identifies skill promotion candidates | After 3 deployment cycles, ANALYST reports ≥ 1 pattern worth promoting to skill | Observation |
| CF-AG-013 | GUARD monitors security events | GUARD receives OpenStack security events; flags anomalies to SURGEON | Operations crew |
| CF-AG-014 | LOG maintains audit trail | Every agent action logged with timestamp, agent role, action, result | Support division |
| CF-AG-015 | CLOCK tracks milestone timing | Phase durations recorded; estimates updated based on actuals | Support division |
| CF-AG-016 | Crew handoff works (deploy → ops) | Deployment crew completes → Operations crew activates with full system context | Crew transition |

### Chipset & Communication (12 tests)

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| CF-CH-001 | Chipset YAML validates against schema | chipset.yaml passes YAML schema validation with no errors | Chipset definition |
| CF-CH-002 | All skills referenced in chipset exist | Every skill name in chipset.yaml resolves to an actual SKILL.md file | Chipset definition |
| CF-CH-003 | All agents referenced have valid roles | Every agent in chipset.yaml maps to a defined role in crew manifest | Chipset definition |
| CF-CH-004 | Evaluation gates execute | Pre-deploy gates (hardware inventory, network, resources) run and produce pass/fail | Chipset definition |
| CF-CH-005 | Post-deploy gates execute | Service-specific health checks (keystone auth, nova compute, neutron network) run | Chipset definition |
| CF-CH-006 | Command loop delivers directives | FLIGHT sends directive → all Tier 2-3 roles receive within 1 cycle | Communication |
| CF-CH-007 | Execution loop completes cycle | PLAN produces spec → EXEC builds → VERIFY validates → result returns to PLAN | Communication |
| CF-CH-008 | Specialist loop activates CRAFT | TOPO routes domain request → correct CRAFT agent activates → result returns | Communication |
| CF-CH-009 | Health loop reports cloud status | SURGEON polls OpenStack APIs → health status propagated to FLIGHT | Communication |
| CF-CH-010 | Budget loop tracks consumption | BUDGET receives token counts from all agents → aggregates → warns at threshold | Communication |
| CF-CH-011 | Cloud Ops loop monitors services | OpenStack API endpoints polled → status changes detected → reported to SURGEON | Communication |
| CF-CH-012 | Doc Sync loop detects drift | Configuration change introduced → doc-verifier detects mismatch → triggers update | Communication |

---

## Integration Tests

| Test ID | Interface Between | Expected Behavior | Component |
|---------|-------------------|-------------------|-----------|
| IT-001 | Keystone → Nova | Nova authenticates against Keystone; token validates; service catalog provides endpoints | Service integration |
| IT-002 | Keystone → Neutron | Neutron authenticates against Keystone; RBAC policies enforce | Service integration |
| IT-003 | Keystone → Cinder | Cinder authenticates against Keystone; volume operations respect project scope | Service integration |
| IT-004 | Nova → Glance | Nova retrieves image from Glance for instance launch; image metadata correct | Service integration |
| IT-005 | Nova → Neutron | Instance launch creates Neutron port; network attached; DHCP provides address | Service integration |
| IT-006 | Nova → Cinder | Volume attach/detach works for running instance; data persists across detach/attach | Service integration |
| IT-007 | Neutron → external network | Floating IP allocated; instance reachable from management network via floating IP | Service integration |
| IT-008 | Heat → all services | Heat stack creates: network + subnet + instance + volume; all resources functional | Service integration |
| IT-009 | Horizon → all services | Dashboard displays compute, network, storage, identity panels; actions execute correctly | Service integration |
| IT-010 | Deployment crew → OpenStack | Full deployment sequence: SCOUT surveys → PLAN decomposes → EXEC deploys → VERIFY confirms | Mission integration |
| IT-011 | Operations crew → running cloud | SURGEON detects simulated failure → reports to FLIGHT → EXEC executes runbook → VERIFY confirms recovery | Mission integration |
| IT-012 | Documentation crew → running system | Doc-verifier scans ops manual → confirms all procedures match running config → reports status | Mission integration |
| IT-013 | Dashboard → cloud + mission | GSD-OS displays both mission telemetry and OpenStack service status simultaneously | UI integration |
| IT-014 | Chipset → skill loading | Chipset activation loads correct skills for current phase; domain skills trigger on keywords | Config integration |
| IT-015 | Staging layer → community content | External chipset variant submitted → scanned → quarantined → reviewed → released or rejected | Security integration |
| IT-016 | Git → configuration management | Config change → commit with rationale → push → deployment uses new config → docs updated | Process integration |
| IT-017 | End-to-end deployment | Fresh system → hardware inventory → deploy → verify → operations handoff → all docs verified | Full system |
| IT-018 | End-to-end user scenario | Authenticate → create project → configure network → launch instance → attach storage → access via floating IP | Full system |
| IT-019 | Skill-creator observation | Deployment patterns observed → at least 1 pattern detected → candidate for skill promotion | Ecosystem integration |
| IT-020 | NASA SE phase transitions | Each SE phase gate (MCR→SRR→PDR→CDR→SIR→ORR→FRR) has entrance/success criteria evaluated | Process integration |
| IT-021 | Cross-crew communication | Deployment crew FLIGHT hands off to Operations crew FLIGHT; context preserved | Crew integration |
| IT-022 | Doc crew parallel operation | Documentation crew operates simultaneously with deployment crew; no resource conflict | Crew integration |
| IT-023 | Runbook execution accuracy | 10 randomly selected runbooks executed against running system; all produce documented results | Doc verification |
| IT-024 | V&V matrix completeness | Every requirement in sysadmin guide has ≥1 verification entry in RVM | Process integration |
| IT-025 | Compliance matrix coverage | Every tailoring decision documented in compliance matrix with rationale | Process integration |
| IT-026 | Reference library links valid | All Tier 3 links resolve (archived via Internet Archive); no dead links | Doc verification |
| IT-027 | Knowledge tier loading | Summary tier loads in <2s; active tier loads on demand in <5s; reference tier accessible | Performance |
| IT-028 | Monitoring → alerting → runbook | Alert fires → references specific runbook → runbook resolves the alert condition | Ops integration |
| IT-029 | Backup → disaster → recovery | Full backup created → simulated disaster (service corruption) → recovery from backup → system healthy | Ops integration |
| IT-030 | Upgrade procedure | Minor OpenStack release upgrade via Kolla-Ansible reconfigure → all services healthy → no data loss | Ops integration |
| IT-031 | Multi-tenant isolation | Two projects with overlapping network CIDRs → instances isolated → no cross-tenant traffic | Network integration |
| IT-032 | Token cache TTL exploitation | Wave 0 artifacts cached → Wave 1 agents load from cache within 5-min window | Performance |
| IT-033 | Chipset profile switching | Scout → Patrol → Squadron activation transitions cleanly; roles appear/disappear correctly | Config integration |
| IT-034 | HALT propagation under load | During active deployment, HALT signal → all agents stop within specification | Safety integration |
| IT-035 | Git history tells complete story | Non-technical reader can follow commit log and understand every deployment decision | Process integration |
| IT-036 | Documentation console rendering | All sysadmin guide chapters, ops manual procedures, and runbooks render correctly in GSD-OS | UI integration |
| IT-037 | Cross-cloud translation accuracy | OpenStack concept → AWS/GCP/Azure equivalent mappings verified against current vendor documentation | Educational |
| IT-038 | Curriculum module integration | Cloud ops curriculum Module 5 references match deployed system; Module 6 references match ops procedures | Educational |

---

## Documentation Verification Tests

| Test ID | Verifies | Expected Behavior | Component |
|---------|----------|-------------------|-----------|
| DV-001 | SysAdmin Guide Pre-Phase A accuracy | ConOps describes actual system architecture; stakeholder needs match implementation | Sysadmin guide |
| DV-002 | SysAdmin Guide Phase A accuracy | Trade studies reflect actual decisions made; alternatives documented accurately | Sysadmin guide |
| DV-003 | SysAdmin Guide Phase B accuracy | Design specs match deployed configuration; interface definitions match actual APIs | Sysadmin guide |
| DV-004 | SysAdmin Guide Phase C accuracy | Build procedures produce working system when followed step-by-step | Sysadmin guide |
| DV-005 | SysAdmin Guide Phase D accuracy | Test procedures execute successfully; results match documented expectations | Sysadmin guide |
| DV-006 | SysAdmin Guide Phase E accuracy | Operations procedures match running system behavior | Sysadmin guide |
| DV-007 | SysAdmin Guide Phase F accuracy | Closeout procedures safely decommission services without data loss | Sysadmin guide |
| DV-008 | Ops Manual Keystone procedures | All Keystone procedures produce documented results against running system | Ops manual |
| DV-009 | Ops Manual Nova procedures | All Nova procedures produce documented results against running system | Ops manual |
| DV-010 | Ops Manual Neutron procedures | All Neutron procedures produce documented results against running system | Ops manual |
| DV-011 | Ops Manual Cinder procedures | All Cinder procedures produce documented results against running system | Ops manual |
| DV-012 | Ops Manual Glance procedures | All Glance procedures produce documented results against running system | Ops manual |
| DV-013 | Ops Manual Swift procedures | All Swift procedures produce documented results against running system | Ops manual |
| DV-014 | Ops Manual Heat procedures | All Heat procedures produce documented results against running system | Ops manual |
| DV-015 | Ops Manual Horizon procedures | All Horizon procedures produce documented results against running system | Ops manual |
| DV-016 | Runbook task index completeness | Every operational task category has at least one runbook entry | Runbook library |
| DV-017 | Runbook symptom index completeness | Every common failure mode has at least one runbook entry | Runbook library |
| DV-018 | Runbook format compliance | Every runbook follows standard format (preconditions, procedure, verification, rollback, references) | Runbook library |
| DV-019 | NASA SE cross-references valid | Every SP-6105 and NPR 7123.1 reference in docs points to correct section | Reference library |
| DV-020 | OpenStack doc references valid | Every OpenStack documentation reference points to correct and current page | Reference library |
| DV-021 | Quick reference card accuracy | Service names, ports, log locations, CLI commands all match running system | Reference library |
| DV-022 | Cross-cloud table accuracy | OpenStack → AWS/GCP/Azure mappings verified against current vendor documentation | Reference library |
| DV-023 | Compliance matrix completeness | Every NPR 7123.1 requirement has a tailoring entry with rationale | Compliance matrix |
| DV-024 | Lessons learned captures mission retrospective | Document exists, covers deployment, operations, documentation phases, identifies ≥3 actionable improvements | Lessons learned |

---

## Verification Matrix

| Success Criterion (from Vision) | Test ID(s) | Status |
|---|---|---|
| 1. User with 32GB RAM deploys working cloud | SC-011, IT-017, IT-018, DV-004 | PENDING |
| 2. Full Squadron profile exercised | CF-AG-001, CF-AG-002, CF-AG-003 | PENDING |
| 3. Every OpenStack service has a GSD skill | CF-SK-001 through CF-SK-024 | PENDING |
| 4. All 9 communication loops operational | CF-CH-006 through CF-CH-012, SC-019 | PENDING |
| 5. SysAdmin Guide maps to NASA SE phases | DV-001 through DV-007, DV-019 | PENDING |
| 6. Every runbook verified against running system | SC-022, IT-023, DV-016 through DV-018 | PENDING |
| 7. Educational pack enables zero-to-competent | IT-038, DV-004, DV-006, IT-018 | PENDING |
| 8. Skill-creator captures deployment patterns | CF-AG-012, IT-019 | PENDING |
| 9. Documentation version-controlled with infrastructure | IT-016, CF-CH-012 | PENDING |
| 10. User can explain `openstack server create` | IT-037, IT-038 | PENDING |
| 11. Dashboard shows cloud + mission status | CF-CH-009, IT-013, IT-036 | PENDING |
| 12. Lessons learned document produced | DV-024, CF-AG-010 | PENDING |
