> Following v1.49.827 — _Batch Chip: dogfood Family ProcessContext_, v1.49.828 batch-chips the scribe/netlist-renderer family of ProcessContext callers: `available.ts` + `netlistsvg-driver.ts` + `yosys-driver.ts`. Third batch-chip ship in the v827-833 chain. KNOWN_UNWIRED Process 25 → 22 (-3).

# v1.49.828 — Batch Chip: scribe/netlist-renderer Family ProcessContext (available + netlistsvg-driver + yosys-driver)

**Shipped:** 2026-05-27

Second ship of the v827-833 chain. Third consecutive batch-chip ship (after v825 git/core + v827 dogfood). First batch where all 3 files use `spawn` (vs prior batches' `execFile`/`exec`) — validates the chokepoint's `'spawn'` op-tag at family scale. All 3 files use the internal-helper pattern (#10433) with hoisted check (#10427) because the surrounding Promise-constructors all have try/catches that swallow spawn errors into structured rejection.

## What shipped

- **MODIFIED** `src/scribe/netlist-renderer/available.ts`:
  - Add imports + `PROCESS_SOURCE = 'scribe/netlist-renderer/available'`.
  - `isAvailable(yosysBin?, netlistsvgBin?, ctx?)` — public; threads ctx through 2 parallel `probeCommand` calls (yosys + netlistsvg).
  - `probeCommand(bin, args, ctx?)` — internal helper; hoists `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'spawn', bin, args)` BEFORE the Promise constructor (which swallows spawn errors into resolve(false)).
  - LOC delta: ~10.
- **MODIFIED** `src/scribe/netlist-renderer/netlistsvg-driver.ts`:
  - Add imports + `PROCESS_SOURCE = 'scribe/netlist-renderer/netlistsvg-driver'`.
  - `runNetlistsvg(jsonNetlist, opts?, ctx?)` — public; threads ctx through `spawnNetlistsvg`.
  - `spawnNetlistsvg(bin, inputJson, outputSvg, ctx?)` — internal helper; hoists check BEFORE the Promise (whose inner try/catch wraps spawn errors into `NetlistRenderError`).
  - LOC delta: ~10.
- **MODIFIED** `src/scribe/netlist-renderer/yosys-driver.ts`:
  - Add imports + `PROCESS_SOURCE = 'scribe/netlist-renderer/yosys-driver'`.
  - `runYosys(verilogSource, opts?, ctx?)` — public; threads ctx through `spawnYosys`.
  - `spawnYosys(bin, script, ctx?)` — internal helper; hoists check BEFORE the Promise (whose inner try/catch wraps spawn errors into `NetlistRenderError`).
  - LOC delta: ~10.
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed 3 entries from `KNOWN_UNWIRED`: `available.ts`, `netlistsvg-driver.ts`, `yosys-driver.ts`.
  - Replaced inline forward-note with a 4-line completion comment marking the scribe/netlist-renderer family as fully wired.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v827 → v828.

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/scribe/` (existing) | 252 | pass (25 test files; 1 skipped) |
| `src/security/process-context-audit.test.ts` | 2047 | pass (3 entries removed from KNOWN_UNWIRED; audit accepts the wires) |
| **Total tests run for verification** | 2,299 | All pass; 0 new |
| **LOC delta src/** | ~30 | 3 files modified (~10 LOC each — homogeneous structure) |

No new test files; audit-test is the structural verification.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **46 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED).
Open lesson candidate backlog: **0** (UNCHANGED).
Wired calibratable thresholds: **5 of 6** (UNCHANGED).
KNOWN_UNWIRED Process: **25 → 22** (-3 net).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## #10433 forward-test result (3rd application; first `'spawn'` op-tag batch)

| File | Helper | Op tag | Callsites | Predicted (#10433) | Actual | Match? |
|---|---|---|---|---|---|---|
| available.ts | `probeCommand` | `spawn` | 2 (yosys + netlistsvg) | ~14-18 LOC | ~10 LOC | low end |
| netlistsvg-driver.ts | `spawnNetlistsvg` | `spawn` | 1 | ~10-14 LOC | ~10 LOC | within band |
| yosys-driver.ts | `spawnYosys` | `spawn` | 1 | ~10-14 LOC | ~10 LOC | within band |
| Total | — | `spawn` | 4 | ~34-46 LOC | ~30 LOC | low end |

Files with a single internal helper + 1-2 callsites + hoisted check (#10427) cluster at ~10 LOC. The #10433 prediction band's lower end is calibrated by this ship to ~8-12 LOC for 1-callsite helper-present files.

## What this ship is not

- Not a NASA degree advance.
- Not a codification.
- Not a new audit-test introduction.
- Not a full closure of all ProcessContext KNOWN_UNWIRED (22 entries remain after this ship; next chip candidates: terminal 2 entries, mesh 2 entries, intel/analyzer 2 entries, plus ~16 singletons).

## Verification

- `npm run build` → clean.
- `npx vitest run src/security/process-context-audit.test.ts` → 2,047 PASS / 0 fail.
- `npx vitest run src/scribe` → 25 files / 252 PASS / 20 skipped / 0 fail.
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling).

## Forward path post-v828 (chain continues)

1. **v829** — T1.3 application-boundary wire (instantiate ObservationBridge at app boundary).
2. **v830-832** — T1.3 Option C (RosettaEngine confidence-bound fallback; 2-3 ships).
3. **v833** — Codify ship for onPredictions pattern.

After chain closes (~v833), NASA 1.179 remains the strong-default per v826 handoff (now **46 consecutive ships at 1.178**).
