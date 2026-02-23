---
phase: 314-operations-skills
plan: 02
subsystem: skills
tags: [openstack, networking-debug, capacity, kolla-ansible-ops, operations, SDN, troubleshooting]

# Dependency graph
requires:
  - phase: 312-foundation
    provides: "NASA SE methodology skill, filesystem contracts, SKILL.md format pattern"
  - phase: 313-core-skills
    provides: "Core OpenStack service skills (neutron, nova, cinder) referenced by integration points"
provides:
  - "openstack-networking-debug skill for SDN troubleshooting and packet tracing"
  - "openstack-capacity skill for resource planning, quota management, and scaling"
  - "openstack-kolla-ansible-ops skill for day-2 infrastructure lifecycle operations"
affects: [316-deployment-ops-crews, 320-operations-manual, 321-runbook-library]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Operations skill pattern: Introduction + Deploy + Configure + Operate + Troubleshoot + Integration Points + NASA SE Cross-References"
    - "Troubleshooting entries follow 'symptom -> diagnostic steps -> resolution' structure"
    - "Integration Points link skills bidirectionally with role descriptions"

key-files:
  created:
    - skills/openstack/networking-debug/SKILL.md
    - skills/openstack/capacity/SKILL.md
    - skills/openstack/kolla-ansible-ops/SKILL.md
  modified: []

key-decisions:
  - "Networking-debug skill prioritizes step-by-step diagnostic procedures with exact commands over conceptual explanations"
  - "Capacity skill includes project quota templates (small/medium/large) as reusable operational profiles"
  - "Kolla-ansible-ops explicitly distinguished from kolla-ansible deployment skill with clear scope boundary"

patterns-established:
  - "Operations skills follow same 7-section structure as core skills but with heavier Operate and Troubleshoot sections"
  - "Each troubleshooting entry has numbered resolution steps with exact commands"

requirements-completed: [SKILL-03]

# Metrics
duration: 7min
completed: 2026-02-23
---

# Phase 314 Plan 02: Operational Domain Skills Summary

**Networking-debug, capacity, and kolla-ansible-ops skills covering SDN troubleshooting with OVS/OVN diagnostics, resource planning with quota templates, and day-2 Kolla-Ansible lifecycle operations**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-23T02:10:30Z
- **Completed:** 2026-02-23T02:17:44Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Networking-debug skill with 6 systematic diagnostic workflows (connectivity, DHCP, floating IP, security groups, MTU, DNS) and 6 troubleshooting entries
- Capacity planning skill with allocation ratio guidance per workload type, project quota templates, flavor sizing matrix, and weekly/monthly/quarterly review procedures
- Kolla-ansible-ops skill with complete day-2 procedures: reconfigure, minor/major upgrade, container management, maintenance mode, password rotation, certificate renewal

## Task Commits

Each task was committed atomically:

1. **Task 1: Create networking-debug operations skill** - `74e3b6c` (feat)
2. **Task 2: Create capacity planning operations skill** - `763e685` (feat)
3. **Task 3: Create kolla-ansible-ops operations skill** - `be54532` (feat)

## Files Created/Modified
- `skills/openstack/networking-debug/SKILL.md` - SDN troubleshooting: OVS/OVN debugging, packet tracing, flow analysis, namespace inspection
- `skills/openstack/capacity/SKILL.md` - Resource planning: allocation ratios, quota management, flavor sizing, utilization analysis, growth forecasting
- `skills/openstack/kolla-ansible-ops/SKILL.md` - Day-2 Kolla-Ansible operations: reconfigure, upgrade, container management, maintenance mode

## Decisions Made
- Networking-debug prioritizes hands-on diagnostic procedures with exact commands over conceptual explanations, following a "run this, see that, means this" structure throughout
- Capacity skill includes concrete project quota templates (small/medium/large profiles) as reusable operational patterns rather than abstract guidance
- Kolla-ansible-ops explicitly documents the boundary with the kolla-ansible deployment skill: deployment is one-time, ops is ongoing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All 3 operational domain skills complete (networking-debug, capacity, kolla-ansible-ops)
- Combined with 314-01 skills (monitoring, backup, security), Phase 314 provides complete operations skill coverage
- Skills ready for consumption by Phase 316 (Deployment & Operations Crews) and Phase 320 (Operations Manual)
- Integration points cross-reference both core skills (Phase 313) and other ops skills within Phase 314

## Self-Check: PASSED

- [x] skills/openstack/networking-debug/SKILL.md -- FOUND
- [x] skills/openstack/capacity/SKILL.md -- FOUND
- [x] skills/openstack/kolla-ansible-ops/SKILL.md -- FOUND
- [x] Commit 74e3b6c -- FOUND
- [x] Commit 763e685 -- FOUND
- [x] Commit be54532 -- FOUND

---
*Phase: 314-operations-skills*
*Completed: 2026-02-23*
