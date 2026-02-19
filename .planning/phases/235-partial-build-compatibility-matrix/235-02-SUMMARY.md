---
phase: 235-partial-build-compatibility-matrix
plan: 02
subsystem: specs
tags: [degradation, standalone-mode, compatibility, dag, dependency-analysis]

# Dependency graph
requires:
  - phase: 235-01
    provides: "48-edge compatibility matrix with 3-state degradation tables and known-issues cross-reference"
  - phase: 231-01
    provides: "16 internal DAG nodes with implementation status"
  - phase: 231-02
    provides: "48 typed edges with concrete interfaces"
provides:
  - "Per-component degradation specs with technical behavior, user-visible signal, resolution action for all 48 edges"
  - "Per-component standalone mode specs with minimum viable behavior and viability ratings for all 16 internal nodes"
affects: [235-03, implementation-milestones, future-milestone-planning]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "3-column degradation detail (technical behavior / user-visible signal / resolution action)"
    - "Standalone viability rating (HIGH/MEDIUM/LOW/NONE) derived from hard-blocks outgoing edge count"
    - "Severity deterministic from edge type (hard-blocks = BROKEN, soft-enhances = DEGRADED)"

key-files:
  created:
    - ".planning/specs/partial-build-compatibility-matrix/degradation-specs.md"
    - ".planning/specs/partial-build-compatibility-matrix/standalone-modes.md"
  modified: []

key-decisions:
  - "Severity is deterministic from edge type: hard-blocks = BROKEN, soft-enhances = DEGRADED, superseded = MINIMAL-IMPACT"
  - "No MEDIUM standalone viability in current ecosystem -- sharp divide between self-sufficient (HIGH) and heavily dependent (NONE/LOW)"
  - "gsd-os rates LOW (not NONE) because Tauri/xterm.js/PTY infrastructure provides functional terminal even without dependencies"
  - "lcp rates LOW because hard-blocks edges point to external infrastructure prerequisites (human process), not software components"

patterns-established:
  - "Degradation specs grouped by source component for developer-centric lookup"
  - "Standalone modes include probe protocol relationship for detection tier guidance"

requirements-completed: [COMPAT-02, COMPAT-07]

# Metrics
duration: 9min
completed: 2026-02-19
---

# Phase 235 Plan 02: Degradation Specs and Standalone Modes Summary

**Per-component graceful degradation specifications (48 edges, 3-column detail) and standalone mode documentation (16 nodes, viability ratings) expanding the compatibility matrix into implementer-ready reference**

## Performance

- **Duration:** 9 min
- **Started:** 2026-02-19T19:16:25Z
- **Completed:** 2026-02-19T19:25:36Z
- **Tasks:** 2
- **Files created:** 2

## Accomplishments
- Degradation specs for all 16 internal DAG nodes covering all 48 edges with technical behavior, user-visible signal, and resolution action
- Standalone mode specs for all 16 nodes with minimum viable behavior, peer-loss tables, and viability ratings
- Severity distribution: 28 BROKEN (hard-blocks), 17 DEGRADED (soft-enhances), 3 MINIMAL-IMPACT (superseded)
- Viability distribution: 4 HIGH (Core + planning-docs), 2 LOW (gsd-os, lcp), 9 NONE (Middleware/Educational), 1 N/A (wetty-tmux)

## Task Commits

Each task was committed atomically:

1. **Task 1: Write per-component graceful degradation specifications** - `652634a` (docs)
2. **Task 2: Write per-component standalone mode specifications** - `30f29e0` (docs)

## Files Created
- `.planning/specs/partial-build-compatibility-matrix/degradation-specs.md` - Per-component degradation scenarios with 3-column detail for all 48 edges
- `.planning/specs/partial-build-compatibility-matrix/standalone-modes.md` - Per-component standalone behavior with viability ratings for all 16 internal nodes

## Decisions Made
- Severity is deterministic from edge type: every hard-blocks edge produces BROKEN severity, every soft-enhances edge produces DEGRADED severity. No exceptions found in the current ecosystem.
- No components rate MEDIUM viability -- the ecosystem has a sharp divide between self-sufficient components (Core layer, all HIGH) and heavily dependent components (Middleware/Platform/Educational, LOW or NONE). This reflects the 58% hard-blocks rate.
- gsd-os rates LOW rather than NONE because the raw Tauri/xterm.js/PTY desktop shell infrastructure provides a functional (if basic) terminal application even without design system, chipset, or skill-creator.
- lcp rates LOW rather than NONE because its hard-blocks dependencies are external infrastructure prerequisites (bootstrap guide + CentOS setup), not software components. The `infra/` scripts themselves are self-contained bash.
- Wetty-tmux superseded edges (#21, #38) receive MINIMAL-IMPACT severity -- the only instances where soft-enhances does not produce DEGRADED.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None -- no external service configuration required.

## Next Phase Readiness
- All Phase 235 plans complete (01: compatibility matrix, 02: degradation specs + standalone modes, 03: capability probe protocol)
- v1.25 milestone ready for completion
- Degradation specs and standalone modes reference the compatibility matrix entries and probe protocol for a cohesive specification set

## Self-Check: PASSED

- [x] degradation-specs.md exists
- [x] standalone-modes.md exists
- [x] 235-02-SUMMARY.md exists
- [x] Commit 652634a exists (Task 1)
- [x] Commit 30f29e0 exists (Task 2)

---
*Phase: 235-partial-build-compatibility-matrix*
*Completed: 2026-02-19*
