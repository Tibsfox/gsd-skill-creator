> Following the v824-826 chain close, v1.49.827 batch-chips the dogfood family of ProcessContext callers: `extraction/extractor.ts` + `pydmd/install/health-check.ts` + `pydmd/install/venv-manager.ts`. Second batch-chip ship after v825's `git/core` family closure. KNOWN_UNWIRED Process 28 → 25 (-3). First ship of the v827-833 chain.

# v1.49.827 — Batch Chip: dogfood Family ProcessContext (extractor + pydmd install health-check + venv-manager)

**Shipped:** 2026-05-27

First ship of the v827-833 chain (dogfood batch → scribe batch → T1.3 app-boundary → T1.3 Option C → codify onPredictions). Family-batch chip applying #10433 internal-helper pattern AND the #10427 hoist-out-of-try/catch refinement. The 3 files split into two shapes: 1 internal-helper-only (extractor) where the catch re-throws, and 2 internal-helper-plus-dependency-injected-executor (health-check + venv-manager) where the surrounding try/catches swallow errors into structured fail results — those files require the hoisted-check pattern per #10427.

## What shipped

- **MODIFIED** `src/dogfood/extraction/extractor.ts`:
  - Add imports: `ensureProcessAllowed`, `ProcessContext` from `../../security/process-context.js`.
  - Add `PROCESS_SOURCE = 'dogfood/extraction/extractor'`.
  - `runPdftotext(sourcePath, ctx?)` — internal helper; calls `ensureProcessAllowed(ctx, PROCESS_SOURCE, 'exec-file', 'pdftotext', argv)` before `execFile`. Catch in caller (`extractPdf`) re-throws so the denial propagates cleanly per #10427.
  - `extractPdf(config, ctx?)` — public function; threads ctx through helper.
  - LOC delta: ~12 (1 import line + PROCESS_SOURCE + 7-line helper signature/check + 2-line public signature + 1 callsite update).
- **MODIFIED** `src/dogfood/pydmd/install/health-check.ts`:
  - Add imports + `PROCESS_SOURCE = 'dogfood/pydmd/install/health-check'`.
  - `runHealthCheck(config, exec, ctx?)` — public function; HOISTS `ensureProcessAllowed(...)` OUTSIDE the surrounding swallowing try/catch per #10427 (the catch converts exec failures into a structured fail-report, which would silently swallow ProcessContextDenied without the hoist).
  - `defaultExec` left as-is (the check fires in `runHealthCheck` against any executor, real or mock).
  - LOC delta: ~6 (import + PROCESS_SOURCE + 2-line public signature + 3-line hoisted check with comment).
- **MODIFIED** `src/dogfood/pydmd/install/venv-manager.ts`:
  - Add imports + `PROCESS_SOURCE = 'dogfood/pydmd/install/venv-manager'`.
  - `createVenv(config, projectInfo, exec, ctx?)` — public function; 5 hoisted `ensureProcessAllowed` calls (one before each of 5 swallowing try/catches: venv create + pip upgrade + pip install + pip freeze + du).
  - `cleanupVenv(venvPath, exec, ctx?)` — public function; 1 hoisted check before the swallowing try/catch around `rm -rf`.
  - 2 internal `cleanupVenv(...)` call sites in `createVenv` updated to thread `ctx`.
  - LOC delta: ~26 (import + PROCESS_SOURCE + 2 public signatures + 6 hoisted-check sites with args-as-local-const idiom + 2 internal cleanupVenv calls).
- **MODIFIED** `src/security/process-context-audit.test.ts`:
  - Removed 3 entries from `KNOWN_UNWIRED`: `extractor.ts`, `health-check.ts`, `venv-manager.ts`.
  - Replaced inline forward-note with a 3-line completion comment ("dogfood family fully wired at v1.49.827 batch chip ... use internal-helper or hoisted-check pattern per #10433; wire cost ~14-26 LOC each").
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v826 → v827 (post-ship reset to v828 follows standard T14).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `tests/dogfood/*` | 646 | pass (existing — 47 test files including extractor + venv-manager + integration-pipeline) |
| `src/security/process-context-audit.test.ts` | 2047 | pass (3 entries removed from KNOWN_UNWIRED; audit accepts the wires) |
| `src/security/process-context.test.ts` | 21 | pass (existing) |
| **Total tests run for verification** | 2,714 | All pass; 0 new (audit-test is the structural verification per #10433 forward-test cadence) |
| **LOC delta src/** | ~44 | 3 files modified |

No new test files this ship — chip ships applying an existing pattern don't typically generate new tests unless the pattern needs refinement. The audit-test is the structural verification surface per the v819 + v825 precedent.

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **45 consecutive ships at 1.178**). Counter-cadence count UNCHANGED at 6.

Manifest entries: **22 → 22** (UNCHANGED — chip ship, not a discipline change).
Open lesson candidate backlog: **0** (UNCHANGED).
Tentative observations carried forward: ~11-15 → ~12-16 (1 new candidate this ship: dependency-injected-executor + hoisted-check pattern, may merit a #10433 refinement).
Wired calibratable thresholds: **5 of 6** (UNCHANGED).
KNOWN_UNWIRED Process: **28 → 25** (-3 net).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).

## #10433 forward-test result (2nd application)

The freshly codified internal-helper pattern (Lesson #10433, codified v1.49.824, first-tested v825 git/core batch) predicted ~14-20 LOC per file with internal helper. Actual measurements for this batch:

| File | Helper shape | Callsites | Predicted (#10433) | Actual | Match? |
|---|---|---|---|---|---|
| extractor.ts | `runPdftotext()` direct | 1 | ~10-14 LOC | ~12 LOC | within band (low end) |
| health-check.ts | `defaultExec` DI + 1 exec call | 1 | n/a — DI shape | ~6 LOC (hoist) | new shape |
| venv-manager.ts | `defaultExec` DI + 6 exec calls | 6 | n/a — DI shape | ~26 LOC (hoist × 6) | new shape |
| Total | mixed | — | — | ~44 LOC | — |

**The 2 DI-executor files require a different costing model.** When the file has a dependency-injected executor + swallowing try/catches, the check must hoist OUT of the try/catches per #10427. Cost shape: `wire_cost_LOC ≈ 4 + (3 × N_swallowing_callsites)`. For health-check at N=1: 4 + 3 = ~6 LOC (matches). For venv-manager at N=6: 4 + 18 = ~22 LOC (close to actual ~26).

This is a NEW pattern variant that may merit codification as a #10433 refinement after 1 more instance accrues.

## What this ship is not

- Not a NASA degree advance.
- Not a codification (no new lessons promoted; observations carried forward).
- Not a new audit-test introduction.
- Not a full closure of all ProcessContext KNOWN_UNWIRED (25 entries remain after this ship; next batches: scribe/netlist-renderer 3 entries, terminal 2 entries, mesh 2 entries, plus ~17 singletons).

## Verification

- `npm run build` → clean.
- `npx vitest run src/security/process-context-audit.test.ts` → 2,047 PASS / 0 fail (audit accepts the 3-entry chip).
- `npx vitest run tests/dogfood` → 646 PASS / 0 fail (47 test files; all dogfood tests including extractor, venv-manager, integration-pipeline).
- Pre-tag-gate (full): expected 17/17 PASS (step 13 within-ceiling 39 ≤ 41 PASS).

## Forward path post-v827 (chain continues)

The v827-833 chain continues:

1. **v828** — scribe/netlist-renderer 3-file batch (available + netlistsvg-driver + yosys-driver). Apply #10433 internal-helper pattern; brings KNOWN_UNWIRED Process 25 → 22.
2. **v829** — T1.3 application-boundary wire (instantiate ObservationBridge at app boundary; pass to translateSessionEvent).
3. **v830-832** — T1.3 Option C (RosettaEngine.translate() confidence-bound fallback; 2-3 ships).
4. **v833** — Codify ship promoting onPredictions wire pattern (at 2 instances per v810 + v826 #10426 threshold).

After the chain closes (~v833), NASA 1.179 forward-cadence remains the strong-default next ship per v826 handoff (now **45 consecutive ships at 1.178** at this point).
