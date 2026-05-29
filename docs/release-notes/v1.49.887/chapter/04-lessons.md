# v1.49.887 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10444** (size-ascending chip-pick reveals wire-shape diversity) — applied. Smallest entry (109 LOC) picked first; turned out to also be the simplest N.
- **#10445** (spawn-site count as primary wire-shape predictor) — applied. N=1 selected hoist-at-top from the #10448 catalog.
- **#10448** (shared-helper hoist sub-variant catalog) — applied. Sub-variant 1 (hoist-at-top) chosen.
- **#10442** (re-throw denial outside swallow-catch) — applied. `ensureAllowed` hoisted above the per-file try/catch that swallows individual errors.
- **#10443** (KNOWN_UNWIRED allowlists as migration-debt ledger) — applied. Ratchet count Loader 15 → 14.

## Promotion-eligible candidates (carry-forward)

Unchanged from v886:

1. `module-singleton` wire shape (1 instance v881)
2. Audit-fidelity inline-literal extraction (1 instance v872)
3. Fake-fixture test pattern (3 instances; cross-cutting test-discipline home not yet created)
4. `git stash` cross-branch hazard (1 instance v883 session)
5. Codify-ship duration scales with composition (5 data points; inconsistent units; revisit at v900-ish codify ship)
6. Cross-audit tool sanity-fixture coverage (1 instance v885; corollary of #10450 but distinct)
