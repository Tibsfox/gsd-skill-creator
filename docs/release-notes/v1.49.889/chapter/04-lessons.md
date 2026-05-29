# v1.49.889 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10444** (size-ascending chip-pick reveals wire-shape diversity) — applied (2nd consecutive chip). Confirms small-LOC + low-N → simplest shape.
- **#10445** (spawn-site count as primary wire-shape predictor) — applied. N=1 → hoist-at-top.
- **#10448** (shared-helper hoist sub-variant catalog) — applied. Sub-variant 1 (hoist-at-top).
- **#10442** (re-throw denial outside swallow-catch) — applied. `ensureAllowed` hoisted above the realpath try/catch + recursive walk's try/catches.
- **#10443** (KNOWN_UNWIRED allowlists as migration-debt ledger) — applied. Ratchet count Loader 14 → 13.

## Promotion-eligible candidates (carry-forward)

1. **`opts.ctx` vs separate ctx parameter** (1 instance v889). When the function already has an options bag, prefer adding ctx as a property over a new positional parameter to keep the public signature stable. Sub-variant of #10448. Promotion-eligible on 2nd instance.
2. `audit-log.test.ts` assertion-flip step (1 instance v888) — when applying #10451 read-side wire recipe, grep all test files for the threshold's `wired` assertion (not just dispatcher test).
3. `module-singleton` wire shape (1 instance v881)
4. Audit-fidelity inline-literal extraction (1 instance v872)
5. Fake-fixture test pattern (3 instances; cross-cutting test-discipline home not yet created)
6. `git stash` cross-branch hazard (1 instance v883 session)
7. Codify-ship duration scales with composition (5 data points; inconsistent units)
8. Cross-audit tool sanity-fixture coverage (1 instance v885; corollary of #10450 but distinct)
