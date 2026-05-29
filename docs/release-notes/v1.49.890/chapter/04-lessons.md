# v1.49.890 — Lessons

## Lessons emitted this ship

**None new.** All design decisions reused established patterns:

- **#10444** (size-ascending chip-pick reveals wire-shape diversity) — applied (3rd consecutive chip). The size-ascending traversal surfaced a new structural variant (class with mixed read/write methods) at the third entry — confirming the catalog continues to grow with each new chip.
- **#10445** (spawn-site count as primary wire-shape predictor) — applied. N=1 per gated method.
- **#10448** (shared-helper hoist sub-variant catalog) — applied. Sub-variant 1 (hoist-at-top) refined to "hoist-at-top of the gated method, leave non-gated methods unchanged."
- **#10442** (re-throw denial outside swallow-catch) — applied. `ensureAllowed` hoisted above the ENOENT-swallowing try/catch.
- **#10443** (KNOWN_UNWIRED allowlists as migration-debt ledger) — applied. Loader 13 → 12.
- **LoaderContext docstring contract** ("loaders that READ bytes") — applied as design discipline. Gates `load()`, leaves `save()` unaudited with explicit assertion.

## Promotion-eligible candidates (carry-forward)

1. **Read-side-only chokepoint at write-bearing classes** (1 instance v890). Gate read paths, leave write paths unaudited + docstring note + explicit "save not gated" test. Promotion-eligible if a 2nd write-bearing class is chipped.
2. **`opts.ctx` vs separate ctx parameter** (1 instance v889). Sub-variant of #10448 for options-bag functions.
3. `audit-log.test.ts` assertion-flip step (1 instance v888).
4. `module-singleton` wire shape (1 instance v881)
5. Audit-fidelity inline-literal extraction (1 instance v872)
6. Fake-fixture test pattern (3 instances)
7. `git stash` cross-branch hazard (1 instance v883 session)
8. Codify-ship duration scales with composition (5 data points)
9. Cross-audit tool sanity-fixture coverage (1 instance v885)
