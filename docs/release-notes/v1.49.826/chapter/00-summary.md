# v1.49.826 — T1.3 Ship 3: ActivationSelector onPredictions Wire

**Released:** 2026-05-27

## What shipped

Adds the `onPredictions` substrate-consumer wire pattern to `src/orchestration/selector.ts` ActivationSelector — the 2nd production caller of this pattern (first was `src/chipset/copper/activation.ts` at v1.49.810).

- `SelectorOptions.onPredictions?: (skill, predictions) => void | Promise<void>` — subscriber-gated hook field.
- `ActivationSelector` stores the hook; `select()` fires `_emitPredictions(decision.id)` for each activated decision after trace writes.
- `_emitPredictions` calls `predictNextSkills(skill, {})` and passes the result to the hook. Fire-and-forget; errors swallowed.
- 3 new tests covering: hook invocation per activated decision, subscriber-gate (no hook = no work), fire-and-forget error swallow.

## Why this ship

Third (and final) ship of the v824-826 chain. Operator selected items 2/3/4 from the v823 handoff. Item 4 was "T1.3 Ship 3 = Option A (gnn-predictor wire into a skill-activation call site; not yet shipped)" — but recon surfaced that Option A's original copper wire ALREADY shipped at v1.49.810 (16 ships earlier, same day). The v823 handoff's "not yet shipped" framing was an inaccuracy.

The SPIRIT of item 4 — close another branch of T1.3 GAP-2 by wiring a NEW production caller — applies cleanly to `src/orchestration/selector.ts`. This is the M5 production selector (vs copper's substrate dispatch). Wiring it here:
- Demonstrates the wire pattern is reusable beyond the v810 instance.
- Brings the onPredictions pattern to 2 instances (the #10426 codification threshold).
- Surfaces the v823 handoff inaccuracy as a forensic finding for future operators.

## Surface delta

- 1 src file modified (~30 LOC)
- 1 test file modified (+3 tests / ~50 LOC)
- 0 new test files
- 0 new lesson candidates (1 carry-forward observation now at 2nd-instance threshold)

## Manifest state

| Field | Before | After |
|---|---|---|
| Manifest entries | 22 | 22 |
| Lessons in manifest | 77 | 77 |
| onPredictions pattern instances | 1 (v810) | **2** (v810 + v826) — eligible for next codify ship |
| Open lesson backlog | 0 | 0 |

## Engine state

NASA degree at **1.178** (UNCHANGED — 44 consecutive ships at 1.178).
Counter-cadence count UNCHANGED at 6.
KNOWN_UNWIRED Process UNCHANGED at 28 (v825 chip closed git/core family).
Wired calibratable thresholds: 5 of 6 (UNCHANGED).
