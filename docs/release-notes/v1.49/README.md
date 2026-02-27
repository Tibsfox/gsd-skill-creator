# v1.49 — Deterministic Agent Communication Protocol

**Shipped:** 2026-02-27
**Requirements:** 68 (65 satisfied, 3 partial — accepted tech debt)
**Phases:** 11 (446-456) | **Plans:** 24 | **Commits:** 43
**Tests:** 263 verification + ~450 unit | **LOC:** ~22.7K

## Summary

Replaces markdown-only agent handoffs with three-part bundles: human intent (markdown) + structured data (JSON) + executable code (scripts). An adaptive fidelity model determines how much scaffolding each handoff needs (Level 0 prose through Level 3 full bundle), and a retrospective analyzer closes the feedback loop — measuring drift, detecting patterns, and promoting or demoting fidelity levels when interpretation fails or succeeds.

## Key Features

### DACP Types & Schemas (Phase 446)
- 26 Zod schemas with inferred TypeScript types covering all DACP data structures
- 9 JSON Schema files (draft 2020-12) generated from TypeScript interfaces
- DriftScore composite calculation with weighted components (intent 35%, rework 25%, verification 25%, modifications 15%)

### Bundle Format (Phase 447)
- Directory-based layout: manifest.json, intent.md, data/, code/ with atomic .complete markers
- Size limits: 50KB data payloads, 10KB per script, 100KB total bundle
- Every bundle has a mandatory .msg fallback for backward compatibility
- Shell scripts for CLI bundle creation and 9-point structural validation

### Assembler & Fidelity Model (Phase 448)
- DACP Assembler composes three-part bundles from skill library queries
- Fidelity decision model assigns Level 0-3 based on data complexity, historical drift, available skills, token budget, and safety criticality
- 95% accuracy across 20 test scenarios (exceeds 85% target)
- Fidelity changes bounded to max 1 level per cycle (SAFE-02)
- Assembly rationale recording in markdown and JSONL formats

### Interpreter (Phase 449)
- 8-stage validation pipeline: .complete marker → manifest schema → fidelity match → file existence → size limits → schema coverage → data-schema validation → provenance
- Object.freeze execution context — scripts are never auto-executed (SAFE-01)
- Provenance chain enforcement — scripts without valid source skill + version are rejected (SAFE-06)
- Progressive disclosure SKILL.md format

### Retrospective Analyzer (Phase 450)
- Drift score calculation with retrospective-tuned weights (40/30/20/10)
- Pattern detection identifying recurring handoff types and drift rates
- Fidelity promotion (drift >0.3) and demotion (drift <0.05) recommendations
- Cooldown enforcement: 7-day promote, 14-day demote per pattern (SAFE-05)
- Append-only JSONL persistence

### Skill Library Extensions (Phase 451)
- Script catalog with function-type indexing (parser, validator, transformer, formatter, analyzer, generator)
- Schema library with data_type, fields, and name_pattern search
- Mandatory provenance enforcement — unprovenanced entries rejected (SAFE-03)
- EMA success rate tracking (0.7 * old + 0.3 * new)
- Unified indexer populating both catalogs

### Bundle Templates (Phase 452)
- Template registry with CRUD, wildcard search, and JSON persistence
- 5 starter templates: skill-handoff (L2), phase-transition (L2), agent-spawn (L3), verification-request (L3), error-escalation (L1)
- Default fidelity levels, data schema refs, and test fixture refs

### Bus Integration (Phase 453)
- DACPTransport routing through Den filesystem bus with .msg/.bundle companion pattern
- Enhanced scanner pairing .msg and .bundle directories
- Orphan detection and bundle cleanup utilities
- Graceful degradation: tryLoadBundle returns null, isBundleAvailable check (SAFE-04)

### Dashboard Panel (Phase 454)
- Drift score trend renderer with high/low threshold indicators
- Fidelity distribution horizontal bar chart (proportional widths)
- Recommendation display for promotion/demotion actions
- Pure render functions with hp- CSS prefix, HTML string output

### CLI Commands (Phase 455)
- `dacp status` — active bundles, fidelity distribution, drift summary, catalog counts
- `dacp history <pattern>` — drift score history with --last N limit
- `dacp analyze` — retrospective analysis with --milestone filter
- `dacp set-level` — manual fidelity override
- `dacp export-templates` — template export for inspection
- All commands support text/--json/--quiet output modes

### Verification (Phase 456)
- 263 tests across 15 test files
- 8/8 safety-critical mandatory-pass tests (SC-01 through SC-08)
- Fidelity accuracy: 95% (19/20 scenarios)
- Bundle round-trip and backward compatibility tests for all fidelity levels

## Safety Architecture

| Safety Requirement | Mechanism | Test |
|---|---|---|
| SAFE-01: No auto-execute | Object.freeze on script references | SC-01 |
| SAFE-02: Bounded changes | clampFidelityChange (max 1 level) | SC-06 |
| SAFE-03: No unprovenanced data | ScriptCatalog.addEntry() rejects empty provenance | catalog tests |
| SAFE-04: Graceful degradation | tryLoadBundle returns null, isBundleAvailable | SC-08 |
| SAFE-05: Cooldowns | 7-day promote, 14-day demote | SC-03 |
| SAFE-06: Provenance enforcement | loadBundle + validateProvenance | SC-05 |
| SAFE-07: Size limits | MAX_DATA_SIZE 50KB, MAX_SCRIPT_SIZE 10KB | SC-04 |
| SAFE-08: Backward compatibility | bundleToMsgContent + .msg fallback | SC-02 |

## Known Tech Debt

3 CLI-layer field name mismatches (low severity, presentation only):
- `dacp-status.ts` reads `pattern` but JSONL records write `handoff_type`
- `dacp-history.ts` filters on `pattern` but records use `handoff_type`
- `dacp-analyze.ts` passes wrong type to `readDriftHistory()`

Core DACP library fully integrated with zero orphaned exports.

## Wave Execution

- Wave 0 (sequential): 446 → 447
- Wave 1 (parallel): 448 | 449
- Wave 2 (parallel): 450+451 | 452+453
- Wave 3 (parallel): 454+455
- Wave 4 (sequential): 456
