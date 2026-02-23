---
phase: 313-core-openstack-skills
plan: 01
subsystem: skills
tags: [openstack, keystone, nova, glance, identity, compute, images, kolla-ansible, skill-pipeline]

# Dependency graph
requires:
  - phase: 312-foundation-types-nasa-se
    provides: NASA SE methodology skill pattern, shared TypeScript types, filesystem contracts
provides:
  - Keystone identity service skill (openstack-keystone)
  - Nova compute service skill (openstack-nova)
  - Glance image service skill (openstack-glance)
affects: [313-02, 313-03, 314, 316, 319, 320, 321]

# Tech tracking
tech-stack:
  added: []
  patterns: [OpenStack SKILL.md authoring pattern with 7 required sections]

key-files:
  created:
    - skills/openstack/keystone/SKILL.md
    - skills/openstack/nova/SKILL.md
    - skills/openstack/glance/SKILL.md
  modified: []

key-decisions:
  - "Keystone skill covers federation basics (SAML/OIDC) as reference section rather than full walkthrough -- appropriate for single-node scope"
  - "All 3 skills use Introduction as inline body text rather than a separate ## Introduction heading -- matches nasa-se methodology skill pattern"
  - "Troubleshoot sections use numbered ### headings with symptom-first structure and diagnosis tables for quick operator reference"

patterns-established:
  - "OpenStack skill structure: YAML frontmatter (name, description, triggers) + 7 body sections (Intro, Deploy, Configure, Operate, Troubleshoot, Integration Points, NASA SE Cross-References)"
  - "Troubleshoot entries follow: Symptoms -> Diagnosis (commands) -> Root causes table (Cause | Diagnosis | Fix) -> Resolution"
  - "Integration Points as table format: Service | Integration | Mechanism"
  - "NASA SE Cross-References as table format: SE Phase | Activity | Reference"

requirements-completed: [SKILL-01, SKILL-06, SKILL-07]

# Metrics
duration: 6min
completed: 2026-02-23
---

# Phase 313 Plan 01: Core OpenStack Skills (Keystone, Nova, Glance) Summary

**3 foundational OpenStack service skills (identity, compute, images) with deploy/configure/operate/troubleshoot guidance, 17 troubleshooting entries, and NASA SE cross-references**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-23T02:00:28Z
- **Completed:** 2026-02-23T02:06:14Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Keystone identity service skill with 6 troubleshooting entries covering 401 errors, endpoint mismatch, token validation, DB failures, federation, and RBAC denials
- Nova compute service skill with 6 troubleshooting entries covering BUILD/ERROR states, live migration, scheduler failures, console access, service down, and cell mapping
- Glance image service skill with 5 troubleshooting entries covering upload failures, download issues, format errors, stuck states, and metadata problems
- Established the OpenStack SKILL.md authoring pattern (7 sections) that all remaining service skills will follow

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Keystone identity service skill** - `1a3af88` (feat)
2. **Task 2: Create Nova compute service skill** - `4efb6c8` (feat)
3. **Task 3: Create Glance image service skill** - `a066fa6` (feat)

## Files Created/Modified
- `skills/openstack/keystone/SKILL.md` - Identity service: authentication, tokens, RBAC, service catalog, Fernet rotation (15.7KB)
- `skills/openstack/nova/SKILL.md` - Compute service: instance lifecycle, scheduling, live migration, cell mapping (14.4KB)
- `skills/openstack/glance/SKILL.md` - Image service: upload/download, format conversion, backend storage, caching (13.3KB)

## Decisions Made
- Keystone skill covers federation basics (SAML/OIDC) as a reference section rather than a full deployment walkthrough, appropriate for the single-node scope of this project
- All 3 skills use Introduction as inline body text before the first ## heading, matching the pattern established by the nasa-se methodology skill
- Troubleshoot sections use numbered ### headings with a symptom-first structure and cause/diagnosis/fix tables for quick operator reference

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- 3 of 9 OpenStack skills complete (keystone, nova, glance)
- Skill authoring pattern established and ready for Plans 02 (neutron, cinder, swift) and 03 (heat, horizon, kolla-ansible)
- Nova and Glance skills reference Keystone for authentication, establishing the cross-reference pattern
- All skills under 16KB, well within the 8K token / 32KB file size budget

## Self-Check: PASSED

- All 3 SKILL.md files exist at expected paths
- All 3 task commits verified in git history (1a3af88, 4efb6c8, a066fa6)
- SUMMARY.md created at .planning/phases/313-core-openstack-skills/313-01-SUMMARY.md

---
*Phase: 313-core-openstack-skills*
*Completed: 2026-02-23*
