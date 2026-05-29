# v1.49.894 — Verify-Axis Integration Test: `observation.retention_days` Substrate→Calibration End-to-End

**Released:** 2026-05-28

Closes the verify-axis trigger gap for `observation.retention_days`. v891 wired the substrate; v884 wired the read side. v894 proves the wire works end-to-end against real collaborators (no mocks) — substrate auto-emits an event, calibration loop reads it back, polarity flows through correctly. Ships at 3 ships after substrate wire (well within the 10-ship verify-axis budget per #10428).

**Second instance of the substrate→calibration end-to-end test pattern** (after v856 predictive-low-confidence). Promotes the pattern from 1-instance to 2-instance.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
