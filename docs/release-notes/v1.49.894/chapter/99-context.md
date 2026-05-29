# v1.49.894 — Context

## Provenance

Third ship of the v892-v895 multi-ship session. Continues the operator's "2 3 4 5" forward-path selection:

- **v892** (option 2): Fourth LoaderContext chip — `dacp/bus/scanner.ts`.
- **v893** (option 3): Substrate auto-emit — `token_budget.max_percent`.
- **v894** (option 4): Integration test — `observation.retention_days` calibration loop (THIS SHIP).
- **v895** (option 5): Counter-cadence codify ship.

## Predecessor

- **v1.49.893** — Substrate auto-emit: `token_budget.max_percent` ceiling check (zero UNWIRED reached).
- **v1.49.892** — Fourth LoaderContext chip: `dacp/bus/scanner.ts`.
- **v1.49.891** — Substrate auto-emit: `observation.retention_days` (this ship's substrate counterpart).
- **v1.49.884** — Bounded-learning read-side wire: `observation.retention_days` (this ship's read-side counterpart).
- **v1.49.856** — First "substrate→calibration end-to-end test" instance (predictive low-confidence).

## Disciplines this ship updates

- **None codified this ship.** Applies #10428 + #10438 + #10437 cleanly.
- **`tools/calibratable/verify-overdue-scan.mjs`** — observation.retention_days flips from PENDING-TEST to COVERED at 3 ships after wire.
- The "substrate→calibration end-to-end test" pattern promoted from 1-instance (v856) to 2-instance (v856 + v894). v895 will codify.

## Cross-references to related disciplines

- **Meta-cadence** (#10428, #10438, #10439) — applied. Verify-axis trigger at 3 ships (well within 10-ship budget); integration test proves substrate→calibration wire end-to-end.
- **Failure-mode contracts** (#10427, #10437) — applied indirectly via fire-and-forget wait pattern in test.
- **Bounded-learning calibration** (#10425, #10451) — applied. Integration test exercises both halves of #10451's recipe.

## Forward path

**Continue v892-v895 session.** Last ship:

- **v895 — Counter-cadence codify ship** — codify 3 ESTABLISHED-ready patterns:
  1. Substrate-wrapper pattern for calibratable thresholds (v891 + v893).
  2. Fire-and-forget test-side wait via `setTimeout(50ms)` (v891 + v893 + v894).
  3. "Substrate→calibration end-to-end test" pattern (v856 + v894).

**Engine-state observations:**

- NASA degree pressure-margin record extends to **112 consecutive ships** at 1.178.
- Wired calibratable thresholds: **7 of 7**; verify-axis coverage: 6 COVERED + 1 PENDING-TEST.
- Promotion-eligible: 3 ESTABLISHED-ready (for v895 codify) + ~12 carry-forward 1-instance candidates.

**Replication-ready pattern from this ship:**

The "substrate→calibration end-to-end test" pattern is the verify-axis closing move for any calibratable threshold whose substrate and read-side are both wired. 7-step shape documented in 00-summary.md + retrospective.md. v895 will codify this as a #10428 refinement or new lesson.
