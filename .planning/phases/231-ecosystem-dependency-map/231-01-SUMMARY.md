---
phase: 231-ecosystem-dependency-map
plan: 01
subsystem: documentation
tags: [dag, dependency-map, node-inventory, ecosystem-analysis, mermaid, yaml]

# Dependency graph
requires:
  - phase: none
    provides: first plan in milestone
provides:
  - Complete 20-node DAG inventory (16 internal + 4 external) with verified implementation status
  - Layer classification (Core/Middleware/Platform/Educational/External) with rationale
  - Status evidence table cross-referencing MILESTONES.md, known-issues.md, and source directories
affects: [231-02 edge extraction, 231-03 mermaid diagram and YAML]

# Tech tracking
tech-stack:
  added: []
  patterns: [4-state status scheme (implemented/partial/aspirational/permanently-deferred), 5-tier layer classification]

key-files:
  created:
    - .planning/specs/ecosystem-dependency-map/node-inventory.md
  modified: []

key-decisions:
  - "Excluded ai_agentic_programming_report.md (industry survey, not ecosystem component)"
  - "Excluded dashboard-screenshot-description.md (point-in-time description of existing planning-docs node)"
  - "Classified amiga-leverage and info-design as Core (design philosophy, not components) because their principles govern the entire architecture"
  - "Classified wetty-tmux as permanently-deferred (architectural divergence to native PTY is intentional)"

patterns-established:
  - "4-state status scheme: implemented, partial, aspirational, permanently-deferred"
  - "5-tier layer model: Core, Middleware, Platform, Educational, External"
  - "Every status annotation requires cited evidence from milestones, known-issues, or source directories"

requirements-completed: [DEPMAP-07]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 231 Plan 01: Node Inventory Summary

**20-node DAG inventory with 4-state implementation status annotations, 5-tier layer classification, and evidence-backed status for every ecosystem vision document**

## Performance

- **Duration:** 3 min 25s
- **Started:** 2026-02-19T14:36:31Z
- **Completed:** 2026-02-19T14:39:56Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- Inventoried all 18 reference-docs files: 16 became DAG nodes, 2 excluded with documented rationale
- Added 4 external dependency nodes (bootstrap, centos-guide, minecraft-world, space-between) with boundary annotations
- Verified every implementation status against MILESTONES.md (28 milestones), known-issues.md (8 groups, 99 items), and actual source directories (src/, src-tauri/, desktop/, infra/)
- Produced comprehensive status evidence table with milestone citations, source directory listings, and test coverage references for each node

## Task Commits

Each task was committed atomically:

1. **Task 1: Build node inventory from vision documents** - `0697229` (docs)

## Files Created/Modified
- `.planning/specs/ecosystem-dependency-map/node-inventory.md` - Complete DAG node inventory with implementation status annotations, layer classifications, status evidence table, excluded document rationale, and summary statistics

## Decisions Made
- **Excluded 2 of 18 documents:** `ai_agentic_programming_report.md` is an industry survey, not an ecosystem vision. `dashboard-screenshot-description.md` describes the existing planning-docs node at a point in time, not a separate component.
- **Layer classification for design docs:** `amiga-leverage` and `info-design` are Core-tier because their architectural principles govern downstream layers, even though they have no dedicated codebase.
- **External node treatment:** Bootstrap, centos-guide, minecraft-world, and space-between included as full DAG nodes with "External" layer and "implemented" status to preserve completeness for edge extraction in Plan 02.
- **AGC vs GSD ISA distinction:** The `gsd-isa` node is classified as aspirational despite the AGC simulator existing in `src/agc/`, because AGC is a separate educational ISA serving the learning pack, not the GSD workflow ISA described in the vision document.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Node inventory is complete and ready for edge extraction in Plan 02
- All 20 nodes have verified status, layer classification, and evidence citations
- Plan 02 can reference node IDs directly from the inventory table

---
*Phase: 231-ecosystem-dependency-map*
*Completed: 2026-02-19*
