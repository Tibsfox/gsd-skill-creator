# v1.49.835 — `lowConfidenceThreshold` Calibration Scaffold (Full)

**Released:** 2026-05-27

## What shipped

Adds `'predictive.low_confidence_threshold'` to `CalibratableThreshold` in `src/bounded-learning/types.ts`. Registers observation source as `'predictive-low-confidence-events'` with `wired: false`. `loadObservationsForThreshold` returns empty array — calibration loop yields `direction: 'hold'`, the honest baseline per v798 `token_budget.max_percent` precedent.

Closes the framework-registration gap left implicit at v830 when `lowConfidenceThreshold` was added to runtime config + threaded through copper/selector but not registered in the bounded-learning calibration framework.

## Why this ship

v833 handoff: "Bounded-learning calibration of `lowConfidenceThreshold` ... needs production observation data first." Production data needs a registered threshold class to flow through. v835 registers the class; future ship wires the production data path.

This is the second of two paired ships closing silent framework gaps from the v830-833 chain:
- **v834** closed an allowlist gap that the chokepoint audit didn't enforce.
- **v835** closes a type-registration gap that the calibration framework didn't enforce.

Both gaps were predicted in framework-adjacent docs/handoffs and caught by per-ship recon discipline.

## Surface delta

- 2 MODIFIED files (`types.ts` + `observation-sources.ts`)
- 1 MODIFIED test file (+2 tests)
- 1 MODIFIED file (`.planning/PROJECT.md` pre-bump refresh)
- 0 NEW files
- 0 NEW src files
- 0 src/ source-code wires (scaffold is type-system-only)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries | 23 | 23 (UNCHANGED) |
| Lessons in manifest | 77 | 77 (UNCHANGED) |
| UNCODIFIED lessons | 39 | 39 (UNCHANGED) |
| CalibratableThreshold members | 6 | 7 (+predictive.low_confidence_threshold) |
| Wired calibratable thresholds | 6 of 6 | 6 of 7 (new class registered but observation source not wired) |
| KNOWN_UNWIRED Process | 22 | 22 (UNCHANGED) |
| KNOWN_UNWIRED Egress | 11 | 11 (UNCHANGED) |
| Tests | 35,235+ | 35,237+ (+2) |

## Engine state

NASA degree at **1.178** (UNCHANGED — **53 consecutive ships at 1.178**, new widest pressure margin record again).
Counter-cadence count UNCHANGED at 6.

## Forward path

NASA 1.179 forward-cadence is the strong-default after the v834+v835 paired counter-cadence-flavor work. Other candidates: production `fallbackProvider` wire (which flips this scaffold's `wired: false → true`), audit-inverse-check enhancement (v834-flagged), continued ProcessContext singleton chips.
