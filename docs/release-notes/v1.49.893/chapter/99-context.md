# v1.49.893 — Context

## Provenance

Second ship of the v892-v895 multi-ship session. Continues the operator's "2 3 4 5" forward-path selection from the v891 handoff:

- **v892** (option 2): Fourth LoaderContext chip — `dacp/bus/scanner.ts` (two-site hoisted-check).
- **v893** (option 3): Substrate auto-emit — `token_budget.max_percent` (THIS SHIP).
- **v894** (option 4): Integration test — `observation.retention_days` calibration loop.
- **v895** (option 5): Counter-cadence codify ship.

## Predecessor

- **v1.49.892** — Fourth LoaderContext chip: `dacp/bus/scanner.ts` (two-site hoisted-check).
- **v1.49.891** — Substrate auto-emit: `observation.retention_days`.
- **v1.49.890** — Third LoaderContext chip: `calibration-adjustment-store.ts`.
- **v1.49.889** — Second LoaderContext chip: `file-walker.ts`.
- **v1.49.888** — Bounded-learning read-side wire for `token_budget.max_percent` (this ship's read-side counterpart).

## Disciplines this ship updates

- **None codified this ship.** Applies #10439 + #10437 + #10427 + #10451 cleanly.
- **`src/token-budget/ceiling-substrate.ts`** — second instance of the substrate-wrapper pattern (after v891 retention). Promotes the v891 carry-forward candidate from 1-instance to 2-instance ESTABLISHED. v895 will codify.
- **`tools/calibratable/verify-overdue-scan.mjs`** — zero UNWIRED reached for the first time since the registry was extended.

## Cross-references to related disciplines

- **Meta-cadence** (#10428, #10438, #10439) — applied. #10439 CLI-manual + substrate-auto-emit duality closed for `token_budget.max_percent`. Third instance of the duality closure (after v846 predictive + v891 retention).
- **Failure-mode contracts** (#10427, #10437) — applied. Fire-and-forget auto-emit with explicit failure-mode test.
- **Bounded-learning calibration** (#10425, #10451) — applied. Threshold loop now has substrate-attributed observations for `token_budget.max_percent`.

## Forward path

**Continue v892-v895 session.** Next ships:

1. **v894 — Integration test for `observation.retention_days`** — verify-axis trigger within 10-ship budget per #10428. v891's substrate + v884's read-side wired; v894 closes the verify-axis gap by end-to-end exercising the loop.
2. **v895 — Counter-cadence codify ship** — codify the 2-instance ESTABLISHED candidates (substrate-wrapper pattern + setTimeout(50ms) test-side wait) + any other accumulated candidates.

**Engine-state observations:**

- NASA degree pressure-margin record extends to **111 consecutive ships** at 1.178.
- Wired calibratable thresholds: **7 of 7** — zero UNWIRED reached for the first time. 2 PENDING-TEST (observation.retention_days + token_budget.max_percent, both within verify-axis budget).
- Promotion-eligible candidates: 2 promoted to ESTABLISHED (substrate-wrapper + setTimeout(50ms)) + ~12 carry-forward 1-instance candidates.

**Replication-ready pattern from this ship:**

When the substrate IS a pure threshold comparison (rather than async work whose result is independent of the threshold), the auto-emit kind is outcome-driven rather than default-fixed. This is a sub-variant of the substrate-wrapper pattern, not a different pattern. Documented inline in `ceiling-substrate.ts` for future thresholds.

The substrate-wrapper pattern (now ESTABLISHED at 2 instances) is the canonical shape for closing #10439 duality on any calibratable threshold: thin function + reads config + invokes existing substrate or pure comparison + auto-emits with documented polarity discipline.
