# v1.49.926 — Complete the `token_budget.warn_at_percent` Loop: Substrate Auto-Emit + Verify E2E

**Shipped:** 2026-05-31
**Type:** Forward work (consume + verify axes) — first genuine forward `feat` in 14 ships
**NASA degree:** 1.178 (unchanged — 141 consecutive ships)
**Predecessor:** v1.49.925

## What shipped

Closed the single most-overdue gap in the bounded-learning calibration stack. `token_budget.warn_at_percent` was the **first** `#10439` CLI+substrate-duality threshold (read side + CLI manual recorder both shipped v803), yet it was the **only** member of its `token_budget.*` family never given a substrate auto-emit writer — its *younger* sibling `max_percent` got one at v893. Warn's calibration loop could therefore only learn from operator-attributed CLI invocations that in practice never happen, never from traffic.

This ships the missing writer — `src/token-budget/warn-substrate.ts::runTokenBudgetWarnCheck` (the second `#10439` write-caller, ~123 ships after the read+CLI half) — plus the canonical substrate→calibration end-to-end test (`#10453` **4th instance**, after v856/v894/v898), closing both the **consume** axis (the substrate is warn's first traffic-attributed writer) and the **verify** axis (the e2e) in one ship.

A parallel survey across the project's four meta-cadence axes triangulated this gap independently from three different angles (verify, calibrate, forward-backlog), and surfaced that `tools/calibratable/verify-overdue-scan.mjs` reported warn `COVERED` only because of a **stale ground-truth entry** (`tested @ v799`) — a misattribution to a unit-test/audit-log ship that predates the canonical `#10453` pattern by 100 ships. That entry masked the gap for ~122 ships; it is now corrected to the honest v926.

As a deliberate side-effect, the feature commit was pushed to `dev` on its own (the v923 pattern) so `ci.yml` ran the macOS leg on this **organic** churn — advancing the `#10463` flip streak toward load-bearing.

## Engine state

- NASA degree 1.178 (unchanged — 141 consecutive ships)
- Counter-cadence count: 20 (unchanged — this is forward work, not a counter-cadence ship)
- Manifest: 24 domains, 150 lessons (unchanged — applies #10439/#10453/#10452/#10425/#10437; no new lesson)
- macOS organic-green streak (#10463): advanced toward the flip (this is organic green #2)
- KNOWN_UNWIRED Process/Egress/Loader: 0/0/0

## Chapters

- [00-summary](chapter/00-summary.md)
- [03-retrospective](chapter/03-retrospective.md)
- [04-lessons](chapter/04-lessons.md)
- [99-context](chapter/99-context.md)
