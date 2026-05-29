# v1.49.893 — Substrate Auto-Emit: `token_budget.max_percent` Ceiling Check

**Released:** 2026-05-28

Closes the v888 deferred half. New `src/token-budget/ceiling-substrate.ts` is the first production caller of `token_budget.max_percent` — reads the threshold from config, compares against a usagePercent reading, auto-emits a `TokenBudgetMaxEvent` per #10437 fire-and-forget. Outcome-driven kind: `under_budget` when usage < ceiling, `blocked` when usage >= ceiling.

**Second instance of the substrate-wrapper pattern** (after v891 observation-retention). Promotes the v891 carry-forward candidate from 1-instance to 2-instance ESTABLISHED.

**Zero UNWIRED calibratable thresholds for the first time** — all 7 registry members have at least a substrate-side caller. The remaining gap is verify-axis integration tests, which the next ship (v894) addresses.

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
