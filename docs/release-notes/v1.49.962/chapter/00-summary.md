# v1.49.962 — Summary

## The ship

Counter-cadence #29 reconciles the pre-tag-gate's documented
`SC_PRE_TAG_GATE_BYPASS` vocabulary to the 21 tokens the gate actually honors at
runtime, and installs a parity drift-guard pinning the documented surfaces to the
gate's `gate_bypassed` calls so they can never silently diverge again. This is the
#10461 gate-enforce-every-runnable-surface + drift-guard pairing applied (Layer-2)
to the vocab surface, and the last named follow-up from the v1.49.961 review.

## What shipped

- Corrected the vocabulary in `tools/render-claude-md/env-vars.json` (re-rendered
  into CLAUDE.md), the runtime step-names help log in `tools/pre-tag-gate.sh`, and
  two header-comment blocks (de-enumerated to pointers) from the stale 24-token set
  to the gate's 21 honored tokens — removing 5 phantom tokens (`build`,
  `version-sequence`, `vitest`, `completeness`, `www-bundles`) and adding 2 real
  ones (`card-template-length`, `integration`).
- Added `tests/integration/bypass-vocab-parity.test.ts` — a 7-assertion drift-guard
  that pins gate-honored == env-vars vocab == help-log vocab, with anti-vacuous,
  naming-convention, and boundary pins. It runs in the root vitest project, so it
  enforces on every ship. No new gate step; the gate count stays 19.

## Verification

7 parity assertions green; build clean; adjacent gate meta-tests unaffected
(16/16 together); apply-to-self + render-check clean. Mutation-proven five ways
(phantom re-add, help-log drop, gate rename, undocumented underscore token,
undocumented uppercase token) — each turns the guard red, baseline restores clean.
A four-lens adversarial Workflow review found two real MAJORs (false-negative
parser charset; unpinned + self-claiming header comments), both CONFIRMED by an
independent verify pass and both fixed in code; a post-fix re-check was clean.

## Engine state

- NASA degree 1.178 (unchanged). Counter-cadence #29 (28 -> 29). Manifest lessons
  151 (unchanged). cadence_advances: none.
