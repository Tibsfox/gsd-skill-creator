# v1.49.895 — Counter-Cadence Codify Ship: Promote #10452 (Substrate-Wrapper Pattern) + #10453 (Substrate→Calibration End-to-End Test) + #10454 (Fire-and-Forget Test-Side Wait)

**Released:** 2026-05-28

Closing ship of the v892-v895 multi-ship session. Counter-cadence codify ship — no production code changes; doc-only. Absorbs 3 ESTABLISHED-ready candidates accumulated during the session:

1. **#10452 NEW LESSON — Substrate-wrapper pattern for calibratable thresholds** (v891 + v893; 2-instance ESTABLISHED). Extends `bounded-learning-calibration-discipline.md` with the two sub-variants (default-fixed + outcome-driven) and the polarity-derivation discriminator.
2. **#10453 NEW LESSON — Substrate→calibration end-to-end integration test pattern** (v856 + v894; 2-instance ESTABLISHED). Extends `meta-cadence-discipline.md` with the verify-axis closing-move 7-step test shape.
3. **#10454 NEW LESSON — Fire-and-forget test-side wait via `setTimeout(50ms)`** (v891 + v893 + v894; 3-instance evidence). Extends `failure-mode-contracts.md` as a test-discipline refinement of #10437.

Mirrors v886's codify-ship cadence (which promoted #10450 + #10451). Counter-cadence count: 7 → 8.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
