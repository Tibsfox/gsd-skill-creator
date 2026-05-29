# v1.49.888 — Bounded-Learning Read-Side Wire: `token_budget.max_percent`

**Released:** 2026-05-28

Third instance of the #10451 calibrate-axis read-side wire recipe (after v837 predictive + v884 observation-retention). New `token-budget-max-events.ts` module + dispatcher branch + `wired: true` flip + public API exports + CLI manual recorder. Promotes #10451 from 2-instance ESTABLISHED to 3-instance STABLE evidence. Substrate auto-emit deferred per #10439 staging (mirrors v837 → v846).

## Chapter contents

- [00-summary.md](chapter/00-summary.md) — what this ship delivers
- [03-retrospective.md](chapter/03-retrospective.md) — what worked, what didn't
- [04-lessons.md](chapter/04-lessons.md) — lessons emitted
- [99-context.md](chapter/99-context.md) — provenance + forward path
