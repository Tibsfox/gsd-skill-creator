# v1.49.828 — Batch Chip: scribe/netlist-renderer Family ProcessContext

**Released:** 2026-05-27

## What shipped

3 src/ files wired with ProcessContext chokepoint. All 3 use `spawn` (first batch where the chokepoint's `'spawn'` op-tag is exercised at family scale) and the internal-helper pattern (#10433) with hoisted check (#10427):

- `src/scribe/netlist-renderer/available.ts` — `probeCommand()` helper threaded; 2 callsites (yosys + netlistsvg version probes). ~10 LOC delta.
- `src/scribe/netlist-renderer/netlistsvg-driver.ts` — `spawnNetlistsvg()` helper threaded; 1 callsite. ~10 LOC delta.
- `src/scribe/netlist-renderer/yosys-driver.ts` — `spawnYosys()` helper threaded; 1 callsite. ~10 LOC delta.

Plus 1 audit-test edit: `src/security/process-context-audit.test.ts` removes 3 entries from `KNOWN_UNWIRED`; replaces inline forward-note with a 4-line completion comment.

## Why this ship

Second ship of v827-833 chain. Third consecutive batch-chip ship (v825 git/core 4-of-4 + v827 dogfood 3-of-3 + v828 scribe/netlist-renderer 3-of-3). First batch using `'spawn'` op-tag (prior batches used `'exec'`/`'exec-file'`). #10433 prediction band confirmed at the low end (~10 LOC per file for 1-callsite spawn-based helpers).

## Surface delta

- 3 src/ files modified (~30 LOC total)
- 1 audit-test edit (3 KNOWN_UNWIRED entries removed)
- 0 new test files
- 0 new lesson candidates promoted

## Manifest state

| Field | Before | After |
|---|---|---|
| KNOWN_UNWIRED Process | 25 | 22 |
| KNOWN_UNWIRED Egress | 11 | 11 |
| scribe/netlist-renderer family wired | 0 of 3 | 3 of 3 |
| Tests | 35,208+ | 35,208+ (+0 new) |

## Engine state

NASA degree at **1.178** (UNCHANGED — 46 consecutive ships at 1.178).
Counter-cadence count UNCHANGED at 6.
Wired calibratable thresholds: 5 of 6 (UNCHANGED).
Manifest entries: 22 (UNCHANGED — chip ship).
