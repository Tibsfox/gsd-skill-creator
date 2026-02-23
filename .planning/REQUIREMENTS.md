# Requirements: GSD Skill Creator — v1.33 GSD OpenStack Cloud Platform (NASA SE Edition)

**Defined:** 2026-02-22
**Core Value:** Skills, agents, and teams must match official Claude Code patterns — and the GSD ecosystem must provide spatial, visual, and operational tools that make complex system design tangible.
**Mission Package:** 6 pre-built documents in `.planning/research/` (~126K)

## v1.33 Requirements

Requirements for the OpenStack Cloud Platform milestone. Each maps to roadmap phases.

### Foundation (FOUND)

- [x] **FOUND-01**: Shared TypeScript interfaces defined for OpenStackService, Requirement, Runbook, NASASEPhase, and CommunicationLoop types with Zod schemas
- [x] **FOUND-02**: NASA SE Methodology skill maps all 7 SE phases to cloud operations equivalents with cross-references to SP-6105 and NPR 7123.1
- [x] **FOUND-03**: Communication loop schemas define all 9 loops (command, execution, specialist, user, observation, health, budget, cloud-ops, doc-sync) with priority levels
- [x] **FOUND-04**: Filesystem contracts established for skills/, docs/, configs/, .chipset/, and .planning/bus/ directories

### Core OpenStack Skills (SKILL)

- [ ] **SKILL-01**: Each of 8 core OpenStack skills (keystone, nova, neutron, cinder, glance, swift, heat, horizon) loads through the 6-stage skill pipeline and encapsulates deploy/configure/operate/troubleshoot knowledge
- [ ] **SKILL-02**: Kolla-Ansible deployment skill encapsulates bootstrap, deploy, reconfigure, and upgrade procedures
- [ ] **SKILL-03**: 6 operations skills (monitoring, backup, security, networking-debug, capacity, kolla-ansible-ops) each handle a specific ops domain with integration points
- [ ] **SKILL-04**: 3 documentation skills (ops-manual-writer, runbook-generator, doc-verifier) follow NASA doc standards and verification methods
- [ ] **SKILL-05**: NASA SE methodology skill provides process mapping, phase gate criteria, and document templates for all cloud operations phases
- [ ] **SKILL-06**: Every OpenStack skill contains troubleshooting sections for common failure modes
- [ ] **SKILL-07**: No individual skill exceeds 8K tokens when loaded; combined active skills ≤ 30K tokens

### Agent Crews (CREW)

- [ ] **CREW-01**: Deployment crew configuration activates all 12 roles (FLIGHT, PLAN, EXEC×3, CRAFT-network, CRAFT-security, CRAFT-storage, VERIFY, INTEG, SCOUT, CAPCOM, BUDGET, TOPO) at Squadron profile
- [ ] **CREW-02**: Operations crew configuration activates all 8 roles (FLIGHT, SURGEON, EXEC, CRAFT-monitoring, VERIFY, CAPCOM, LOG, GUARD) for day-2 operations
- [ ] **CREW-03**: Documentation crew configuration activates all 8 roles (FLIGHT, PLAN, EXEC×2, CRAFT-techwriter, VERIFY, ANALYST, RETRO, PAO) for parallel documentation production
- [ ] **CREW-04**: Scout (3 roles), Patrol (7 roles), and Squadron (all roles) activation profiles function correctly with role subset hierarchy
- [ ] **CREW-05**: Each EXEC agent receives the correct domain-specific skill loadout
- [ ] **CREW-06**: CRAFT agents trigger on domain keywords (e.g., "neutron" → craft-network, "RBAC" → craft-security)
- [ ] **CREW-07**: CAPCOM is the sole human interface — no other agent sends messages to human directly
- [ ] **CREW-08**: Crew handoff works: deployment crew completes → operations crew activates with full system context

### Communication & Chipset (COMM)

- [ ] **COMM-01**: All 9 communication loops operational with priority-based bus arbitration
- [ ] **COMM-02**: Command loop delivers FLIGHT directives to all Tier 2-3 roles within 1 cycle
- [ ] **COMM-03**: Execution loop completes full PLAN→EXEC→VERIFY cycle
- [ ] **COMM-04**: Specialist loop routes domain requests to correct CRAFT agents
- [ ] **COMM-05**: Health loop reports cloud status from SURGEON to FLIGHT
- [ ] **COMM-06**: Cloud Ops loop polls OpenStack API endpoints and detects status changes
- [ ] **COMM-07**: Doc Sync loop detects configuration drift between running system and documentation
- [ ] **COMM-08**: HALT signal propagates to all agents within 1 communication cycle; no partial operations
- [ ] **COMM-09**: Complete ASIC chipset.yaml validates against schema, references only existing skills and agents, and configures the entire OpenStack operational environment
- [ ] **COMM-10**: Chipset evaluation gates (pre-deploy and post-deploy) execute and produce pass/fail results
- [ ] **COMM-11**: Budget agent tracks token consumption and warns at 90%, blocks new EXEC at 95%

### Documentation Pack (DOCS)

- [ ] **DOCS-01**: Systems Administrator's Guide has 7 chapters mapping to NASA SE phases (Pre-Phase A through Phase F) with cross-references to SP-6105 and NPR 7123.1
- [ ] **DOCS-02**: Each sysadmin guide chapter contains narrative, procedures, and cross-references that are accurate against the deployed system
- [ ] **DOCS-03**: Operations Manual contains per-service procedures for all 8 OpenStack services following NASA procedure format
- [ ] **DOCS-04**: All operations manual procedures are verified against the running system
- [ ] **DOCS-05**: Runbook Library contains ≥40 entries with task-indexed and symptom-indexed access
- [ ] **DOCS-06**: Every runbook follows the standard format (preconditions, procedure, verification, rollback, references)
- [ ] **DOCS-07**: Reference Library has 3-tier structure (summary ~6K always-loaded, active ~20K on-demand, reference ~40K deep dives)
- [ ] **DOCS-08**: NASA SE cross-references point to correct SP-6105 and NPR 7123.1 sections
- [ ] **DOCS-09**: OpenStack documentation references point to correct and current pages
- [ ] **DOCS-10**: Cross-cloud translation tables (OpenStack → AWS/GCP/Azure) are verified against current vendor documentation
- [ ] **DOCS-11**: Quick reference card (service names, ports, log locations, CLI commands) matches the running system

### Verification & Compliance (VERIF)

- [ ] **VERIF-01**: Requirements Verification Matrix maps every requirement to verification method (test/analysis/inspection/demonstration) and test procedure
- [ ] **VERIF-02**: Compliance matrix follows NPR 7123.1 Appendix H format with every tailoring decision documented and justified
- [ ] **VERIF-03**: VERIFY agent operates independently from EXEC — cannot read EXEC's implementation context
- [ ] **VERIF-04**: Doc-verifier detects intentionally introduced documentation drift and reports discrepancy
- [ ] **VERIF-05**: All 22 safety-critical tests pass (credentials excluded from git, local-only isolation, no external binding without HITL, destructive ops have rollback, etc.)
- [ ] **VERIF-06**: End-to-end deployment verified: fresh system → hardware inventory → deploy → verify → operations handoff → all docs verified
- [ ] **VERIF-07**: End-to-end user scenario verified: authenticate → create project → configure network → launch instance → attach storage → access via floating IP

### Integration & Dashboard (INTEG)

- [ ] **INTEG-01**: GSD-OS dashboard panel displays cloud operations status (service health, alerts) alongside mission telemetry
- [ ] **INTEG-02**: Documentation console renders sysadmin guide, ops manual, and runbooks within GSD-OS
- [ ] **INTEG-03**: Staging layer handles intake for OpenStack configurations and community chipset variants
- [ ] **INTEG-04**: skill-creator observation pipeline captures deployment patterns and identifies promotion candidates
- [ ] **INTEG-05**: Git history documents every deployment decision with configuration change rationale
- [ ] **INTEG-06**: Knowledge tier loading meets performance targets: summary <2s, active <5s
- [ ] **INTEG-07**: Lessons learned document captures mission retrospective in NASA LLIS format with ≥3 actionable improvements

## v2 Requirements

Deferred to future releases. Tracked but not in current roadmap.

### Multi-Node & HA

- **MULTI-01**: Multi-node HA deployment across multiple physical hosts
- **MULTI-02**: Ceph integration for distributed storage
- **MULTI-03**: Advanced networking (BGP, VXLAN multi-site)

### Extended Services

- **EXT-01**: Bare-metal provisioning via Ironic
- **EXT-02**: Container orchestration via Magnum/Zun
- **EXT-03**: Shared storage via Manila
- **EXT-04**: DNS as a service via Designate
- **EXT-05**: Billing/metering via CloudKitty
- **EXT-06**: Federation with external identity providers

### Educational Extensions

- **EDU-01**: Cross-cloud translation exercises (AWS/GCP free tier)
- **EDU-02**: Cloud ops curriculum Module 5 and 6 content delivery

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-node HA deployment | Requires additional hardware; v2.0 milestone |
| Ceph distributed storage | Separate milestone; single-node uses LVM |
| Advanced networking (BGP, VXLAN) | Multi-site scope; single-node sufficient for v1 |
| Bare-metal provisioning (Ironic) | v3.0 scope |
| Container orchestration (Magnum/Zun) | v3.0 scope |
| Cross-cloud hands-on exercises | Requires AWS/GCP free tier accounts; educational v2.0 |
| Remote MCP server hosting | v1.31 established stdio-only for local; remote deferred |
| Real-time multi-user cloud ops | Network layer, auth, presence needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 312 | Complete |
| FOUND-02 | Phase 312 | Complete |
| FOUND-03 | Phase 312 | Complete |
| FOUND-04 | Phase 312 | Complete |
| SKILL-01 | Phase 313 | Pending |
| SKILL-02 | Phase 313 | Pending |
| SKILL-03 | Phase 314 | Pending |
| SKILL-04 | Phase 315 | Pending |
| SKILL-05 | Phase 315 | Pending |
| SKILL-06 | Phase 313 | Pending |
| SKILL-07 | Phase 313 | Pending |
| CREW-01 | Phase 316 | Pending |
| CREW-02 | Phase 316 | Pending |
| CREW-03 | Phase 317 | Pending |
| CREW-04 | Phase 316 | Pending |
| CREW-05 | Phase 316 | Pending |
| CREW-06 | Phase 316 | Pending |
| CREW-07 | Phase 316 | Pending |
| CREW-08 | Phase 316 | Pending |
| COMM-01 | Phase 317 | Pending |
| COMM-02 | Phase 317 | Pending |
| COMM-03 | Phase 317 | Pending |
| COMM-04 | Phase 317 | Pending |
| COMM-05 | Phase 317 | Pending |
| COMM-06 | Phase 317 | Pending |
| COMM-07 | Phase 317 | Pending |
| COMM-08 | Phase 317 | Pending |
| COMM-09 | Phase 318 | Pending |
| COMM-10 | Phase 318 | Pending |
| COMM-11 | Phase 317 | Pending |
| DOCS-01 | Phase 319 | Pending |
| DOCS-02 | Phase 319 | Pending |
| DOCS-03 | Phase 320 | Pending |
| DOCS-04 | Phase 320 | Pending |
| DOCS-05 | Phase 321 | Pending |
| DOCS-06 | Phase 321 | Pending |
| DOCS-07 | Phase 321 | Pending |
| DOCS-08 | Phase 319 | Pending |
| DOCS-09 | Phase 320 | Pending |
| DOCS-10 | Phase 321 | Pending |
| DOCS-11 | Phase 321 | Pending |
| VERIF-01 | Phase 322 | Pending |
| VERIF-02 | Phase 322 | Pending |
| VERIF-03 | Phase 322 | Pending |
| VERIF-04 | Phase 322 | Pending |
| VERIF-05 | Phase 322 | Pending |
| VERIF-06 | Phase 324 | Pending |
| VERIF-07 | Phase 324 | Pending |
| INTEG-01 | Phase 323 | Pending |
| INTEG-02 | Phase 323 | Pending |
| INTEG-03 | Phase 323 | Pending |
| INTEG-04 | Phase 323 | Pending |
| INTEG-05 | Phase 323 | Pending |
| INTEG-06 | Phase 323 | Pending |
| INTEG-07 | Phase 325 | Pending |

**Coverage:**
- v1.33 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

---
*Requirements defined: 2026-02-22*
*Last updated: 2026-02-22 — traceability populated by roadmapper*
