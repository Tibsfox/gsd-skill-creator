---
phase: 235-partial-build-compatibility-matrix
plan: 03
subsystem: specs
tags: [capability-detection, probe-protocol, filesystem-presence, json-schema, degradation]

# Dependency graph
requires:
  - phase: 231-ecosystem-dependency-map
    provides: "20-node DAG with status scheme and source directory evidence"
provides:
  - "3-tier capability detection hierarchy (filesystem-presence, configuration-presence, structured probe)"
  - "JSON response schema for structured readiness detection"
  - "Per-component marker paths for all 16 internal DAG nodes"
  - "4 example probe responses demonstrating maturity state transitions across layers"
affects: [IMPL-03, eventdispatcher-subscriber-registration]

# Tech tracking
tech-stack:
  added: []
  patterns: [3-tier-detection-hierarchy, cumulative-tier-composition, probe-response-schema]

key-files:
  created:
    - ".planning/specs/partial-build-compatibility-matrix/capability-probe-protocol.md"
  modified: []

key-decisions:
  - "Tiers are cumulative (3 includes 2 includes 1), not alternatives -- always start at Tier 1"
  - "amiga-workbench included as 16th internal node (plan template had agc-learning which is not a DAG node)"
  - "Probe implementation via EventDispatcher subscriber registration (no separate probe mechanism)"
  - "Distinction between aspirational and absent: aspirational is known + planned, absent is not present in build"

patterns-established:
  - "Marker path convention: derive from actual source directories in node-inventory.md"
  - "Combined state table: Tier 1 + Tier 2 results map to absent/present/scaffolded/active"
  - "Probe responses carry embedded tier1/tier2 results for audit trail"

requirements-completed: [COMPAT-03, COMPAT-04]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 235 Plan 03: Capability Probe Protocol Summary

**3-tier detection hierarchy (filesystem/config/structured-probe) with JSON schema and per-component marker paths for all 16 internal DAG nodes**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T19:02:47Z
- **Completed:** 2026-02-19T19:06:35Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- Defined 3-tier capability detection hierarchy with cumulative composition rules
- Documented filesystem-presence marker paths for all 16 internal DAG nodes (9 with markers, 4 aspirational with no marker yet, 1 permanently deferred, 2 with design-philosophy-level markers)
- Specified JSON probe response schema with component, version, maturity, capabilities, and interfaces fields
- Wrote 4 example probe responses (skill-creator/Core, chipset/Middleware, gsd-os/Platform, bbs-pack/Educational) showing maturity state transitions from absent through implemented
- Created combined Tier 1 + Tier 2 state table mapping to effective component states
- Documented current v1.25 ecosystem state through Tier 1/2 lens for all 16 components

## Task Commits

Each task was committed atomically:

1. **Task 1: Define 3-tier capability detection hierarchy with JSON schema** - `f0d25ee` (docs)

## Files Created/Modified
- `.planning/specs/partial-build-compatibility-matrix/capability-probe-protocol.md` - Complete capability probe protocol specification (701 lines)

## Decisions Made
- **Cumulative tier design:** Tiers compose upward (3 subsumes 2 subsumes 1), not as alternatives. Consumers always start at Tier 1 and optionally escalate.
- **Node correction:** Plan template listed `agc-learning` as a node but the authoritative node-inventory.md has no such node. The AGC simulator is part of `gsd-isa`. Replaced with `amiga-workbench` which was the missing 16th internal node.
- **Probe via EventDispatcher:** Recommended implementing Tier 3 probes as part of EventDispatcher subscriber registration rather than a separate mechanism, leveraging existing subscriber protocol from Phase 232.
- **Aspirational vs absent distinction:** Aspirational components are known to the ecosystem with a vision document; absent means not present in this build. Both produce identical probe responses today but differ in UI treatment.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected node list: replaced agc-learning with amiga-workbench**
- **Found during:** Task 1 (marker path table construction)
- **Issue:** Plan template listed `agc-learning` with marker `src/agc/` as one of the 16 internal nodes. The authoritative node-inventory.md has no `agc-learning` node -- the AGC simulator lives under the `gsd-isa` node. The plan also omitted `amiga-workbench` which IS an internal DAG node.
- **Fix:** Replaced `agc-learning` row with `amiga-workbench` (marker path: `desktop/src/wm/`). Noted that `src/agc/` is the AGC educational ISA, separate from the GSD workflow ISA.
- **Files modified:** capability-probe-protocol.md
- **Verification:** Final document lists exactly 16 internal nodes matching node-inventory.md
- **Committed in:** f0d25ee (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Essential correctness fix -- using a non-existent node ID would have made the spec inconsistent with the authoritative DAG.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 235 is now complete (all 3 plans done): known-issues cross-reference, degradation specs + standalone modes, and capability probe protocol
- v1.25 milestone has all 5 phases complete (231-235), ready for milestone completion
- IMPL-03 (future milestone) can implement the probe protocol from this spec alone

## Self-Check: PASSED

- capability-probe-protocol.md: FOUND
- 235-03-SUMMARY.md: FOUND
- Commit f0d25ee: FOUND

---
*Phase: 235-partial-build-compatibility-matrix*
*Completed: 2026-02-19*
