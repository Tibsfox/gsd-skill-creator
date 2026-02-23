---
phase: 320-operations-manual
plan: 01
subsystem: documentation
tags: [openstack, operations, keystone, nova, glance, identity, compute, images, nasa-se, procedures]

# Dependency graph
requires:
  - phase: 313-core-openstack-skills
    provides: Keystone, Nova, and Glance service skills with operate/troubleshoot content
  - phase: 315-documentation-methodology-skills
    provides: ops-manual-writer skill defining standard procedure format
provides:
  - 9 Keystone identity service procedures (OPS-KEYSTONE-001 through 009)
  - 10 Nova compute service procedures (OPS-NOVA-001 through 010)
  - "Foundational operations procedures for the two core OpenStack services every other component depends on"
affects: [320-02, 320-03, 322-vv-plan, 324-integration-verification]

# Tech tracking
tech-stack:
  added: []
  patterns: [ops-manual-writer NASA format with PURPOSE/PRECONDITIONS/SAFETY/PROCEDURE/VERIFICATION/ROLLBACK/REFERENCES, OPS-SERVICE-NNN ID convention, SE Phase E designation]

key-files:
  created:
    - docs/operations-manual/keystone-procedures.md
    - docs/operations-manual/nova-procedures.md
  modified: []

key-decisions:
  - "Each procedure file includes a table of contents for quick navigation across 9-10 procedures"
  - "Cross-references use OPS-SERVICE-NNN format to link between service procedure files"
  - "All procedures map to SE Phase E (Operations and Sustainment) with NPR 7123.1 and SP-6105 references"

patterns-established:
  - "Operations procedure format: OPS-SERVICE-NNN ID, 7 required sections, imperative mood, exact CLI commands with expected output"
  - "Cross-service references: Keystone auth procedures referenced from Nova where authentication is involved"

requirements-completed: [DOCS-03, DOCS-04, DOCS-09]

# Metrics
duration: 7min
completed: 2026-02-23
---

# Phase 320 Plan 01: Keystone and Nova Operations Procedures Summary

**19 operations procedures for Keystone identity (9: health check, config verification, backup/restore, minor/major upgrade, troubleshooting, security audit, token rotation, catalog management) and Nova compute (10: health check, config verification, backup/restore, minor/major upgrade, troubleshooting, security audit, live migration, flavor management, hypervisor maintenance) in NASA SE format**

## Performance

- **Duration:** 7 min
- **Started:** 2026-02-23T02:54:00Z
- **Completed:** 2026-02-23T03:01:00Z
- **Tasks:** 2 of 3 completed (Glance procedures pending -- created by another agent)
- **Files created:** 2

## Accomplishments

- 9 Keystone procedures covering daily health check (container and token verification), configuration verification (globals.yml, Fernet, TLS, RBAC), backup and restore (database, Fernet keys, policy files), minor and major upgrade procedures via Kolla-Ansible, troubleshooting common failures (401 errors, token validation, catalog mismatch, DB connection), security audit (RBAC review, token expiration, TLS validity, credential rotation), Fernet token rotation with zero-downtime steps, and catalog management (add/modify/remove endpoints)
- 10 Nova procedures covering daily health check (5 container types, hypervisor list, compute services), configuration verification (compute driver, scheduler filters, virt_type), backup and restore (database, instance definitions), minor and major upgrade (with cell mapping verification), troubleshooting common failures (stuck instances, migration failures, NoValidHost, console access), security audit (policy, console proxy, metadata service), live migration (pre-checks, execution, failure handling), flavor management (create/modify/delete with access restrictions), and hypervisor maintenance (disable scheduling, migrate instances, re-enable)
- All procedures use imperative mood with exact `openstack` CLI and `docker exec` commands, expected output examples, and failure branches
- NASA SE format consistently applied: SE Phase E designation, SP-6105 and NPR 7123.1 references, verification sections with specific commands

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Keystone identity service procedures** - `3ec3dcc` (docs)
2. **Task 2: Create Nova compute service procedures** - `a8adcd1` (feat, bulk commit with other rate-limited agent work)

**Note:** Task 3 (Glance procedures) was not completed by this agent -- glance-procedures.md is being created by another agent.

## Files Created/Modified

- `docs/operations-manual/keystone-procedures.md` - 9 Keystone identity service procedures (OPS-KEYSTONE-001 through 009, 1406 lines)
- `docs/operations-manual/nova-procedures.md` - 10 Nova compute service procedures (OPS-NOVA-001 through 010, 1653 lines)

## Decisions Made

- Structured each procedure file with a table of contents listing all procedure IDs and titles for quick operator navigation
- Used cross-references between Keystone and Nova procedures (e.g., OPS-NOVA upgrade references OPS-KEYSTONE for auth verification)
- All procedures tagged with SE Phase E (Operations and Sustainment) and include both SP-6105 and NPR 7123.1 section references

## Deviations from Plan

**Partial completion:** Task 3 (Glance image service procedures) was not completed by this agent due to rate limiting. The glance-procedures.md file is being created by another agent. Tasks 1 and 2 (Keystone and Nova) were completed in full.

## Issues Encountered

Rate limit interrupted the agent before Task 3 could be completed and before SUMMARY.md could be written. Nova procedures were committed in a bulk commit (`a8adcd1`) along with other rate-limited agent work. Keystone procedures were committed atomically in `3ec3dcc`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Keystone and Nova operations procedures are complete and ready for doc-verifier compatibility checks (Phase 322)
- Glance procedures pending completion by another agent
- Cross-references to OPS-NEUTRON, OPS-CINDER, and OPS-SWIFT procedures will be resolved when Plans 02 and 03 complete
- Combined with Plans 02 and 03, all 8 OpenStack services will have operations procedures

---
*Phase: 320-operations-manual*
*Completed: 2026-02-23*
