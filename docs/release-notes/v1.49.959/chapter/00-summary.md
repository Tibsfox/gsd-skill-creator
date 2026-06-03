# v1.49.959 — Summary

## The ship

v1.49.959 lifts the last two precision bounds the v1.49.957 return-value
detector documented in `astWireFacts` (`src/cli/commands/cadence.ts`), the
meta-cadence verify-axis wire detector. A function that returns one of its own
parameters is now resolved by substituting the argument at the call site, and a
parenthesized literal / identifier / call is unwrapped. The lift is
robustness-only: every real end-to-end test wires its threshold with a direct
string literal, so the live verify verdict is byte-identical.

## What shipped

- **Param-return-through** (`function id(t){ return t; }` then `load(id('x'))`
  resolves to `'x'`): a `returnParams` map of own param indices returned
  directly, classified in `collectFn`'s return-statement and concise-arrow-body
  branches, stored only under `unconditionalExprReturn`, added to the
  ambiguity-drop loop, and resolved in `resolveCallReturn` under a unified
  divergence guard spanning both literal and param-substituted returns.
- **Parenthesized literal / identifier / call**: `literalOf` and `resolveExpr`
  both unwrap `ParenthesizedExpression`.
- Doc comments and the file-header bound list updated to mark both bounds closed.

## Verification

- `npm run build` clean; 128 cadence tests pass (+18).
- All new conjuncts mutation-proven (literalOf paren branch, resolveExpr paren
  branch, return-statement param classification, arrow-body param
  classification, `returnParams.delete` ambiguity wiring, the unified divergence
  merge, and the `unconditionalExprReturn` storage-gate guard for the param path).
- `node dist/cli.js cadence --check` exits 0 (live verdict unchanged).
- 4-lens adversarial Workflow review: 0 blockers; over-report and live-invariance
  lenses CLEAN; one MAJOR test-coverage gap fixed before ship.

## Engine state

- NASA degree 1.178 (frozen hold). Counter-cadence 27 (unchanged — normal feat).
  Manifest 151 (unchanged). No `cadence_advances` marker.
