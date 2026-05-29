# v1.49.885 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10443** (KNOWN_UNWIRED allowlists as migration-debt ledger) — applied. LoaderContext opens at 15 entries; ratchet-ledger discipline extends to the third chokepoint surface.
- **#10444 / #10445 / #10447 / #10448** (wire-shape catalog) — applied implicitly. The catalog will drive chip-by-chip decisions in v887+; v885 just opens the ledger.
- **#10427** (failure-mode contracts) — applied. Stale-entry detector tests assert load-bearing invariants loudly.

## Promotion-eligible candidates (carry-forward)

1. **Tools-detecting-silent-failures must themselves fail loudly (2nd instance).** **Promoted from v883 carry-forward.** v867: regex-hardening for `]\s*\)` terminator inside comments. v885: alias-stripping in Shape B detector. Same tool (`check-stale-known-unwired.mjs`), same class of bug (false finding due to incomplete parsing of source-code shape). 2-instance bar reached. Codification candidate at v886 counter-cadence or v887+ codify ship.

2. **Cross-audit tool sanity-fixture coverage.** (1 instance v885) When extending a cross-cutting tool to a new surface, sanity-test fixtures should cover all common import shapes (default named / aliased named / namespace / dynamic). Below 2-instance bar; promotion-eligible if a future chokepoint surfaces the same gap.

## Carry-forward (unchanged from v884)

1. `module-singleton` wire shape (1 instance v881)
2. Audit-fidelity inline-literal extraction (1 instance v872)
3. Fake-fixture test pattern (3 instances; cross-cutting test-discipline home not yet created)
4. `git stash` cross-branch hazard (1 instance v883 session)
5. Codify-ship duration scales with composition (4 data points; inconsistent units)
6. Calibrate-axis read-side wire recipe (2 instances now — v837 predictive + v884 observation-retention; promotion-eligible)
