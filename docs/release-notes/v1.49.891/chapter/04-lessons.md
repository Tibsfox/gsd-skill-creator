# v1.49.891 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10439** (CLI manual + substrate auto-emit duality) — applied (2nd instance, after v846 predictive low-confidence). The duality is closed for `observation.retention_days`: CLI manual recorder at v884 + substrate auto-emit at v891. The 3-ship-per-threshold staging discipline holds (registration v798 + CLI manual v884 + substrate auto-emit v891).
- **#10437** (subscriber-gated observability-only context-hook pattern) — applied. Fire-and-forget Promise with `.catch(() => {})` swallow; default-kind documented per #10427 contract documentation convention.
- **#10427** (failure-mode contracts) — applied. Inline docstring marker on the auto-emit's fire-and-forget contract + paired explicit test asserting failure doesn't propagate.

## Promotion-eligible candidates (carry-forward)

1. **Substrate wrapper pattern for calibratable threshold + existing substrate** (1 instance v891). Thin `runX` function bridging operator config to existing substrate + auto-emit. Promotion-eligible at 2nd instance.
2. **Fire-and-forget test-side wait via `setTimeout(50ms)`** (1 instance v891). When asserting on fire-and-forget I/O, use real timeout not setImmediate. Promotion-eligible at 2nd instance.
3. **Default-kind selection discipline when CLI default doesn't exist** (1 instance v891). For calibratable thresholds whose CLI requires --kind (no default), substrate auto-emit must pick a default; the discipline is "conservative bias + document rationale + pin via test." Promotion-eligible at 2nd instance (likely on token_budget.max_percent substrate auto-emit).
4. Read-side-only chokepoint at write-bearing classes (1 instance v890).
5. `opts.ctx` vs separate ctx parameter (1 instance v889).
6. `audit-log.test.ts` assertion-flip step (1 instance v888).
7. `module-singleton` wire shape (1 instance v881).
8. Audit-fidelity inline-literal extraction (1 instance v872).
9. Fake-fixture test pattern (3 instances).
10. `git stash` cross-branch hazard (1 instance v883 session).
11. Codify-ship duration scales with composition (5 data points).
12. Cross-audit tool sanity-fixture coverage (1 instance v885).
