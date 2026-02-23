---
phase: 321-runbook-library-reference-library
plan: 01
subsystem: documentation
tags: [openstack, runbooks, keystone, nova, identity, compute, nasa-se, troubleshooting, incident-response]

# Dependency graph
requires:
  - phase: 313-core-openstack-skills
    provides: Keystone and Nova service skills with deploy/configure/operate/troubleshoot knowledge
  - phase: 315-documentation-methodology-skills
    provides: Runbook-generator skill with standard format template
provides:
  - 5 Keystone identity service runbooks (RB-KEYSTONE-001 through 005)
  - 6 Nova compute service runbooks (RB-NOVA-001 through 006)
  - Cross-service references between Keystone and Nova runbooks
affects: [321-02, 321-03, 321-04, 322, 324]

# Tech tracking
tech-stack:
  added: []
  patterns: [runbook-generator-format, dual-procedure-sections, cross-service-references]

key-files:
  created:
    - docs/runbooks/RB-KEYSTONE-001.md
    - docs/runbooks/RB-KEYSTONE-002.md
    - docs/runbooks/RB-KEYSTONE-003.md
    - docs/runbooks/RB-KEYSTONE-004.md
    - docs/runbooks/RB-KEYSTONE-005.md
    - docs/runbooks/RB-NOVA-001.md
    - docs/runbooks/RB-NOVA-002.md
    - docs/runbooks/RB-NOVA-003.md
    - docs/runbooks/RB-NOVA-004.md
    - docs/runbooks/RB-NOVA-005.md
    - docs/runbooks/RB-NOVA-006.md
  modified: []

key-decisions:
  - "Used both scheduled and emergency rotation procedures in RB-KEYSTONE-005 (dual PROCEDURE sections)"
  - "Cross-referenced Keystone runbooks from Nova runbooks where auth failures cascade to compute"

patterns-established:
  - "Dual PROCEDURE sections for runbooks with distinct operational modes (scheduled vs emergency)"
  - "Consistent cross-service RELATED RUNBOOKS linking between Keystone auth and Nova compute"

requirements-completed: [DOCS-05, DOCS-06]

# Metrics
duration: 5min
completed: 2026-02-23
---

# Phase 321 Plan 01: Keystone and Nova Runbooks Summary

**11 runbooks covering Keystone identity (token, catalog, RBAC, TLS, Fernet) and Nova compute (launch failure, scheduling, hypervisor, migration, resources, host recovery) with exact CLI commands, expected output, failure branches, and cross-service references**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-23T02:54:24Z
- **Completed:** 2026-02-23T02:59:39Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- 5 Keystone runbooks covering the highest-frequency identity service failures: token issuance, catalog repair, RBAC troubleshooting, TLS renewal, and Fernet rotation
- 6 Nova runbooks covering the full compute failure spectrum: launch diagnosis, scheduler/placement, hypervisor recovery, live migration, resource exhaustion, and host failure recovery
- Every runbook follows the runbook-generator standard format with PRECONDITIONS, PROCEDURE, VERIFICATION, ROLLBACK, and RELATED RUNBOOKS sections
- Cross-service references link Keystone auth failures to their compute impact (RB-NOVA-001 references RB-KEYSTONE-001)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Keystone identity service runbooks (5 entries)** - `d63b1ba` (docs)
2. **Task 2: Create Nova compute service runbooks (6 entries)** - `c56c68e` (docs)

## Files Created/Modified
- `docs/runbooks/RB-KEYSTONE-001.md` - Token issuance failure troubleshooting (Fernet keys, NTP, memcached, DB)
- `docs/runbooks/RB-KEYSTONE-002.md` - Service catalog endpoint repair (missing/wrong endpoints)
- `docs/runbooks/RB-KEYSTONE-003.md` - RBAC policy troubleshooting (policy.yaml, role assignments, scoping)
- `docs/runbooks/RB-KEYSTONE-004.md` - TLS certificate renewal (expiry check, chain validation, deployment)
- `docs/runbooks/RB-KEYSTONE-005.md` - Fernet key rotation (scheduled + emergency procedures)
- `docs/runbooks/RB-NOVA-001.md` - Instance launch failure diagnosis (full diagnostic chain across services)
- `docs/runbooks/RB-NOVA-002.md` - Scheduler and placement troubleshooting (filters, aggregates, AZs)
- `docs/runbooks/RB-NOVA-003.md` - Hypervisor connectivity recovery (libvirt, KVM, resource reporting)
- `docs/runbooks/RB-NOVA-004.md` - Live migration procedure (pre-checks, execution, troubleshooting)
- `docs/runbooks/RB-NOVA-005.md` - Compute resource exhaustion response (allocation ratios, quotas)
- `docs/runbooks/RB-NOVA-006.md` - Compute service recovery after host failure (fencing, evacuation, cleanup)

## Decisions Made
- RB-KEYSTONE-005 uses dual PROCEDURE sections (scheduled rotation and emergency rotation) because the two scenarios have fundamentally different steps and urgency levels
- Cross-references follow the cascade pattern: Nova runbooks reference Keystone runbooks where authentication failures propagate to compute, and vice versa

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 11 Keystone and Nova runbooks ready for indexing in plan 321-04 (task and symptom indexes)
- Cross-references to RB-NEUTRON-001, RB-GLANCE-001, and RB-CINDER-* are forward references to be created in plans 321-02 and 321-03
- All runbooks follow the standard format for doc-verifier compatibility (Phase 322)

---
*Phase: 321-runbook-library-reference-library*
*Completed: 2026-02-23*
