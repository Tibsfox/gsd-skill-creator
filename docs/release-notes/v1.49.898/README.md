# v1.49.898 — Verify-Axis Integration Test: `token_budget.max_percent` (Substrate→Calibration End-to-End — 3rd Instance PROMOTES Pattern)

**Released:** 2026-05-29

Closes the verify-axis PENDING-TEST entry for `token_budget.max_percent`. The v888 ship wired the calibration-loop read side; v893 wired the substrate auto-emit. v898 proves the wire works end-to-end against real collaborators (no mocks) — substrate calls `runTokenBudgetCeilingCheck`, the fire-and-forget auto-emit lands on disk, the calibration loop reads the JSONL, polarity flows through outcome-driven kind selection. Ships 5 ships after substrate wire (well within the 10-ship verify-axis budget per #10428). **Third instance of the substrate→calibration end-to-end test pattern** (after v856 predictive low-confidence + v894 observation-retention) — promotes the pattern from 2-instance to ESTABLISHED at the 3-instance bar. Distinct from v894 in substrate shape: outcome-driven (kind falls out of the inequality) vs default-fixed. All 7 calibratable thresholds now COVERED.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
