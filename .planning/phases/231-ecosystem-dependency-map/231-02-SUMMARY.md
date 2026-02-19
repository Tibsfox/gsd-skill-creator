---
phase: 231-ecosystem-dependency-map
plan: 02
subsystem: documentation
tags: [dag, dependency-map, edge-inventory, cycle-analysis, topological-sort, ecosystem-analysis]

# Dependency graph
requires:
  - phase: 231-01
    provides: 20-node DAG inventory with implementation status annotations
provides:
  - Complete 48-edge typed dependency graph with concrete interfaces per edge
  - Cycle analysis confirming acyclic graph property (0 cycles found)
  - Topological sort with 6 depth levels for build sequencing
  - Edges grouped by source (dependency declarations) and target (criticality ranking)
affects: [231-03 mermaid diagram and YAML, 232 silicon layer integration, 235 partial-build compatibility]

# Tech tracking
tech-stack:
  added: []
  patterns: [3-type edge classification (hard-blocks/soft-enhances/shares-infrastructure), manual topological sort for small graphs, cycle detection by investigating mutual references]

key-files:
  created:
    - .planning/specs/ecosystem-dependency-map/edge-inventory.md
  modified: []

key-decisions:
  - "Hard-blocks proportion (58%) is higher than research predicted -- reflects genuinely deep dependency chains in vision documents"
  - "No shares-infrastructure edges found -- all cross-references are directional dependencies, not shared conventions"
  - "Edges #1 and #2 (chipset -> skill-creator) kept as separate edges for distinct interfaces (skills section vs agent composition)"
  - "amiga-leverage -> skill-creator classified as soft-enhances (design philosophy references, not hard dependency)"
  - "wetty-tmux edges (#21, #38) classified as soft-enhances -- architecture superseded by native PTY"

patterns-established:
  - "3-type edge classification with deterministic test criteria for each type"
  - "Every edge requires at least one concrete interface (file path, schema, event, API, protocol)"
  - "Cycle detection via investigating known mutual references, then topological sort verification"

requirements-completed: [DEPMAP-01, DEPMAP-02, DEPMAP-09]

# Metrics
duration: 5min
completed: 2026-02-19
---

# Phase 231 Plan 02: Edge Inventory Summary

**48 typed directed edges with concrete interfaces per edge, 6-level topological sort confirming DAG property, and skill-creator identified as most-depended-on node (9 incoming edges)**

## Performance

- **Duration:** 5 min 6s
- **Started:** 2026-02-19T14:42:02Z
- **Completed:** 2026-02-19T14:47:08Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- Extracted 48 directed edges from deep reading of all 16 vision documents (9 with explicit Depends-on headers + 7 with implicit dependencies from body text)
- Classified every edge: 28 hard-blocks (58%), 19 soft-enhances (40%), 0 shares-infrastructure (0%)
- Attached concrete interfaces to all 48 edges (file paths like `.chipset/chipset.yaml`, schemas like `EventEnvelope`, pipelines like `SessionObserver`, protocols like filesystem message bus)
- Investigated 5 potential cycles (GSD-OS/BBS, chipset/planning-docs, skill-creator/amiga-leverage, staging/dashboard-console, info-design/planning-docs) -- all confirmed unidirectional
- Verified DAG property via 6-level manual topological sort with zero contradictions
- Identified skill-creator as most depended-on node (9 incoming edges, 7 hard-blocks) and gsd-os as most dependent node (8 outgoing edges)

## Task Commits

Each task was committed atomically:

1. **Task 1: Extract explicit and implicit dependency edges with concrete interfaces** - `79a0f4b` (docs)

## Files Created/Modified
- `.planning/specs/ecosystem-dependency-map/edge-inventory.md` - Complete edge table with 48 typed edges, edges grouped by source and target, cycle analysis (0 cycles), topological sort (6 levels), and summary statistics

## Decisions Made
- **Hard-blocks proportion:** 58% of edges are hard-blocks, higher than the research estimate that "most edges should be soft-enhances." This reflects the architectural reality: vision documents declare genuinely blocking dependencies (e.g., BBS pack cannot function without GSD-OS as host platform, silicon cannot exist without chipset.yaml).
- **No shares-infrastructure edges:** Every cross-reference between nodes is a directional dependency, not a shared convention. Even the closest candidates (planning-docs/info-design sharing the dashboard canvas) resolve to unidirectional soft-enhances.
- **Separate edges for distinct interfaces:** chipset -> skill-creator appears as edges #1 and #2 because the chipset.yaml skills section and the agent composition feature are separate integration surfaces with different interface types.
- **Implicit dependency classification:** amiga-leverage -> skill-creator is soft-enhances (amiga-leverage references the promotion pipeline as design inspiration, not a hard requirement). chipset -> planning-docs is soft-enhances (chipset envisions a dashboard panel but functions without it).
- **Permanently-deferred node treatment:** wetty-tmux edges (#21, #38) are soft-enhances because both GSD-OS and dashboard-console referenced Wetty as a dependency but subsequently adopted native PTY, making the dependency historical/architectural rather than blocking.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Edge inventory is complete and verified as acyclic DAG
- Combined with node inventory from Plan 01, the full ecosystem dependency graph is ready for visualization (Mermaid diagram) and machine-readable export (YAML) in Plan 03
- Topological sort levels provide direct input for build sequencing recommendations
- Critical nodes identified (skill-creator, chipset, amiga-leverage) for Plan 03 critical path analysis

---
*Phase: 231-ecosystem-dependency-map*
*Completed: 2026-02-19*
