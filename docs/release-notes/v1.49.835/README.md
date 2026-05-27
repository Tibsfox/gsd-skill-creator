> Following v1.49.834 — _ProcessContext Stale-Entry Cleanup (`intelligence/analyzer/git.ts`)_, v1.49.835 is the **lowConfidenceThreshold calibration scaffold** — the second of two paired ships closing silent framework gaps from the v830-833 chain. v830 added `lowConfidenceThreshold` as a runtime config field (default `0.30`) and routed it through `predictNextSkillsWithMeta` → copper + selector, but the bounded-learning calibration framework didn't know about it: the threshold appeared in `PredictiveSkillLoaderConfig` but was absent from `CalibratableThreshold` in `src/bounded-learning/types.ts`. v835 closes that gap by registering the threshold class + observation source with explicit "not yet wired" semantics, parallel to the v798 pattern for `token_budget.*` — declare-the-surface-now, wire-the-source-when-production-data-flows.

# v1.49.835 — `lowConfidenceThreshold` Calibration Scaffold (Full)

**Shipped:** 2026-05-27

Adds `'predictive.low_confidence_threshold'` to `CalibratableThreshold` in `src/bounded-learning/types.ts`. Registers the observation source as `'predictive-low-confidence-events'` with `wired: false` and an explicit description noting "awaiting production wire of `fallbackProvider` in copper/orchestration call paths." `loadObservationsForThreshold` returns an empty array for the new class — the calibration loop then yields `direction: 'hold'`, the honest baseline for "wire exists, source not yet captured" (per v798 pattern).

## Why this ship

v830-833 chain established `lowConfidenceThreshold` as the 6th calibratable threshold (per v833 README "Wired calibratable thresholds: 6 of 6"), but a recon pass against `src/bounded-learning/types.ts` reveals: only 6 thresholds are enumerated in the `CalibratableThreshold` union, and `predictive.low_confidence_threshold` is NOT one of them. The v833 handoff explicitly noted: "Bounded-learning calibration of `lowConfidenceThreshold` (the 6th wired calibratable threshold, from v830) — needs production observation data first."

The framework cannot reason about a threshold class that doesn't exist in its type system. v835 closes that registration gap by adding the threshold to the type union + the observation source registry. With this scaffold:

- The CLI's `--threshold predictive.low_confidence_threshold` argument is now type-safe (currently rejected by `SUPPORTED_THRESHOLDS` in `src/cli/commands/bounded-learning.ts`; that allowlist remains unchanged this ship because the threshold's observation source is NOT wired).
- `observationSourceFor('predictive.low_confidence_threshold')` returns metadata with `wired: false`, surfacing the gap to any operator who queries it.
- `loadObservationsForThreshold('predictive.low_confidence_threshold', _)` returns `[]`, the honest baseline.
- The calibration loop returns `direction: 'hold'` whenever invoked against this threshold — never silently produces a recommendation against zero data.

Parallel to v798 `token_budget.max_percent`: type-registered, source-not-wired, calibration returns hold. The framework knows about the threshold and can surface the wire gap; the next ship that wires production `fallbackProvider` + activation telemetry into `predictive-low-confidence-events.jsonl` can then flip `wired: true` and the calibration loop becomes functional for this threshold.

## What shipped

- **MODIFIED** `src/bounded-learning/types.ts` (~10 LOC):
  - Adds `'predictive.low_confidence_threshold'` as a new member of `CalibratableThreshold`.
  - Updates the JSDoc to list it explicitly with `(v1.49.835 — calibration scaffold only; observation source not yet wired, awaiting production fallbackProvider deployment + activation telemetry)`.
- **MODIFIED** `src/bounded-learning/observation-sources.ts` (~12 LOC):
  - Adds case in `observationSourceFor()` returning `{ sourceId: 'predictive-low-confidence-events', wired: false, description: '...awaiting production wire of fallbackProvider...' }`.
  - Updates the JSDoc on `loadObservationsForThreshold()` to list the new unwired class alongside `token_budget.max_percent` and `observation.*`.
  - Adds inline-comment fallthrough note in the dispatch function listing the 3 unwired classes (cross-references the v835 scaffold reason).
- **MODIFIED** `src/bounded-learning/__tests__/observation-sources.test.ts` (+2 tests):
  - `classifies predictive.low_confidence_threshold as unwired predictive-low-confidence-events source (v1.49.835 scaffold)` — verifies `sourceId` + `wired: false` + description matches `/fallbackProvider/`.
  - `returns empty array for predictive.low_confidence_threshold (v1.49.835 scaffold; observation source not yet wired)` — verifies dispatch fallthrough.
- **MODIFIED** `.planning/PROJECT.md` — pre-bump refresh v834 → v835.

NOT modified (deferred):
- `src/cli/commands/bounded-learning.ts` `SUPPORTED_THRESHOLDS` — stays at 4 because the new threshold has no observation source yet. Surfaces in `observationSourceFor` registry but not in the operator-facing CLI allowlist until production wire lands. Avoids surfacing "supported" thresholds the operator can't get a meaningful recommendation for.

## Pairing with v834

v834 closed an allowlist gap that the audit didn't enforce. v835 closes a type-registration gap that the calibration framework didn't enforce. Both ships are "framework predicted the gap, recon caught it" shapes. v834's discipline doc (`docs/known-unwired-ledger-discipline.md`) literally predicted the v834 catch in its forward-observations section; v833 README's forward-path listed the v835 work explicitly as a known-needed action.

This pairing is a useful counter-example to the "framework gaps stay hidden" pattern — both gaps were documented in framework-adjacent docs and operationally caught by per-ship recon discipline. The dual catch demonstrates that **documenting expected manual catches IS a load-bearing discipline** (cross-ref #10434 — discipline-coverage ratchet as related observability+enforcement shape).

## Test impact

| Surface | Tests | Notes |
|---|---|---|
| `src/bounded-learning/__tests__/observation-sources.test.ts` | 14 → 16 (+2) | New tests for the predictive.low_confidence_threshold scaffold |
| Full suite | 35,235 → 35,237 (+2) | Type-system addition; no other test changes |
| **LOC delta** | ~24 | 1 type field + observation source case + 2 test cases + JSDoc updates |

## Engine state

NASA degree sustains at **1.178** (UNCHANGED — **53 consecutive ships at 1.178**, new widest pressure margin record again). Counter-cadence count UNCHANGED at 6.

KNOWN_UNWIRED Process: **22** (UNCHANGED).
KNOWN_UNWIRED Egress: **11** (UNCHANGED).
Manifest entries: **23** (UNCHANGED).
Lessons in manifest: **77** (UNCHANGED).
UNCODIFIED: **39** (UNCHANGED; ≤ ceiling 41).

Wired calibratable thresholds: **6 of 7** (v835 adds the 7th class to the type union; observation source not yet wired so functional-wire count stays at 6).

This is a finer-grained version of what v833 README claimed (`6 of 6`): the type union actually had 6 members before v835 ship; now has 7. The "6 wired" claim referenced the runtime wire in copper + selector + settings, not the bounded-learning type registration. v835 makes both views consistent by registering in the calibration framework type as the 7th member — wired count stays at 6 (suggestions×3 + token_budget×1 + observation.retention_days × 1 + predictive.low_confidence_threshold runtime × 1 = 6 with runtime wires; 7 total threshold classes in the union with the v835 addition).

Codify-axis cadence: 2 ships past last codify (v833) — within the 7-10 ship floor.
Consume-axis cadence: 1 ship past last consume (v834) — at floor.
Calibrate-axis cadence: 5 ships past last calibrate (v830 introduced the 6th wired threshold) — within ~10-ship floor.

## What this ship is not

- Not a NASA degree advance (NASA 1.178 unchanged, now 53 consecutive).
- Not a chip ship (KNOWN_UNWIRED counts unchanged).
- Not a codify ship (no new manifest entries; the 1-instance stale-entry chip pattern stays carry-forward).
- Not a production fallbackProvider wire (the scaffold is type-registration-only; production wire is a future ship).
- Not a calibration-functional change (calibration returns `direction: 'hold'` for the new threshold; the observation-source-empty path is the honest baseline per v798 precedent).

## Verification

- `npx vitest run src/bounded-learning/__tests__/observation-sources.test.ts` → 16 PASS.
- `npm run build` → clean (type-system addition transpiles cleanly).
- `bash tools/pre-tag-gate.sh` → 17/17 PASS.
- Full suite: 35,237 PASS / 45 skipped / 7 todo / 0 fail.

## Forward path post-v835

1. **NASA 1.179 forward-cadence** — STRONG-DEFAULT now (53 consecutive ships at 1.178). After this v834-v835 paired counter-cadence-flavor work, the forward-cadence axis is the next obvious move.
2. **Production fallbackProvider wire** — wire `RosettaConceptFallback` into the production constructor path for copper/selector + add `predictive-low-confidence-events.jsonl` JSONL log + flip `observationSourceFor('predictive.low_confidence_threshold').wired` to `true`. ~45-60 min ship; consumes production data after that.
3. **Audit-inverse-check enhancement** — v834-flagged ~30 min ship to close the unidirectional asymmetry in the chokepoint audit tests.
4. **Continued ProcessContext singleton chips** — terminal family / mesh family batch chips remain available.
5. **Future codify ship** (likely v840+) — picks up the 3 deferred eligible patterns from v833 plus the 1-instance observations from v834 if they accumulate a 2nd instance.

## Most valuable single takeaway

**Type-system registration is a load-bearing scaffold step BEFORE production wire.** The v830 ship added `lowConfidenceThreshold` to the runtime config + threaded it through copper + selector, but stopped short of registering it in the bounded-learning calibration framework. The framework gap was silent because: (a) no consumer references the new threshold via `CalibratableThreshold`; (b) the operator-facing CLI's `SUPPORTED_THRESHOLDS` doesn't include it. The gap stayed hidden for 5 ships (v830 → v835) until per-ship recon for the v835 scaffold ship caught it.

The v798 precedent for `token_budget.max_percent` — register-now-wire-source-later — is the right scaffold pattern. It surfaces the gap inside the type system (other framework consumers can now reason about the threshold's existence), establishes the honest baseline (calibration returns hold against empty observation source), and creates a single named place to flip `wired: false → true` when production data flows. v835 applies the same pattern to `predictive.low_confidence_threshold`, paying down the registration-deferred-vs-runtime-wire gap that v830 left implicit.

**Second-most valuable:** the v834-v835 pair demonstrates that paired "framework-predicted, recon-caught" ships are a recognizable shape. v834 closed a discipline-doc-predicted allowlist gap; v835 closes a handoff-predicted type-registration gap. Both gaps were known to be there; both were closed by per-ship recon discipline catching the prediction. If this shape recurs (a 2nd paired catch), worth codifying as a "deferred-gap-pair" sub-pattern of meta-cadence discipline.
