---
title: "Context"
chapter: 99-context
version: v1.49.963
date: 2026-06-03
summary: "Where v1.49.963 sits in the larger arc."
tags: [context, cadence, verify-detector]
---

# v1.49.963 — Context

## Milestone metadata

- **Version:** v1.49.963
- **Type:** `feat(cli)` — verify-detector paren-param + nested-self-call bounds
- **Predecessor:** v1.49.962 (counter-cadence #29 — bypass-vocab parity drift-guard)
- **NASA degree:** 1.178 (frozen hold)
- **Counter-cadence count:** 29 (unchanged — normal forward feat)

## Where this sits

This completes the verify-detector hardening arc that ran v1.49.955 (regex to
AST) -> v1.49.956 (inter-procedural call graph) -> v1.49.957 (return-value
dataflow) -> v1.49.959 (param-return-through + parenthesized literals). v959
closed paren-literal resolution and basic param-return-through and documented
two remaining bounds; v1.49.963 closes both (parenthesized-param forwarding on
the collect side, and the nested self-call), leaving only the name-based
lexical-scope residual as an accepted conservative under-report.

It is the first of the carried non-blocking residuals taken up after v1.49.962.
The sibling residual — the M4 orphan trunk-tmp leak — is a separate
`fix(branches)` ship.

## Files changed

- `src/cli/commands/cadence.ts` — `unwrapParens` helper; applied at the four
  `collectFn` attribution sites and the two binding-initializer sites; the
  `argSeen` (clone-minus-name) relaxation in `resolveCallReturn`; doc-comment
  updates.
- `src/cli/commands/cadence.test.ts` — flipped the v1.49.959 nested-self-call
  bound test; added the v1.49.963 describe block (paren-param at all sites,
  nested self-call, termination guards, binding initializers, 1(a) benign
  anchor).

## Engine state at close

- NASA degree 1.178 (frozen).
- Counter-cadence 29 (unchanged).
- Manifest 151 lessons (unchanged).
- No cadence_advances (robustness-only).
