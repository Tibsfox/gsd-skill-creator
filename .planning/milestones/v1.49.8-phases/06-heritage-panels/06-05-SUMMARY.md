---
phase: 06-heritage-panels
plan: 05
subsystem: panels
tags: [unison, content-addressed, hash-identity, abilities, algebraic-effects, frontier-panel, tdd]
dependency_graph:
  requires: [panel-interface, rosetta-core-types]
  provides: [unison-panel]
  affects: [panel-registry, cross-panel-translation, calibration-engine-mapping, concept-registry-parallel]
tech_stack:
  added: []
  patterns: [content-addressed-code, hash-identity, algebraic-effects, ability-handler]
key_files:
  created:
    - .college/panels/unison-panel.ts
    - .college/panels/unison-panel.test.ts
  modified: []
decisions:
  - Hash values are illustrative (not real hashes) to teach the concept
  - Ability declaration maps to Calibration Engine observe/compare/adjust/record
  - Concept Registry parallel made explicit in pedagogicalNotes
metrics:
  duration: 2 min
  completed: "2026-03-01"
  tests_added: 15
  files_created: 2
  files_modified: 0
---

# Phase 6 Plan 5: Unison Panel Summary

Content-addressed code with hash-based identity, abilities (algebraic effects), and codebase-as-database demonstrating the Rosetta Core concept identity principle as a working language

## What Was Built

UnisonPanel extending PanelInterface with panelId 'unison'. The frontier panel demonstrates that a function's identity can be its content hash -- not its name -- and that side effects can be made visible in type signatures. This directly parallels the Rosetta Core's concept identity model.

## Key Implementation Details

- Hash identity: coolingCurve and exponentialDecay have same hash (#k2f8a3b1x9)
- Ability declaration: `ability Calibrate where observe/compare/adjust/record`
- Handler pattern: `handle cookAndCalibrate recipe with` for effect isolation
- Codebase-as-database: typed ASTs in SQLite, not text files
- Watch expressions: `> coolingCurve 30.0 212.0 72.0 0.05`
- Concept Registry parallel: hash-based identity = canonical concept identity
- Type annotation: `coolingCurve : Float -> Float -> Float -> Float -> Float`

## Test Coverage

15 tests: PC-17 (hash identity), PC-18 (ability declaration), INT-21 (Calibration mapping), INT-22 (Concept Registry parallel), content-addressing, codebase-as-database, handler pattern, watch expressions, exponential decay, contract, distinctive feature, token bounds.

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

- `1891052b` feat(06-05): implement Unison panel with content-addressed code and abilities
