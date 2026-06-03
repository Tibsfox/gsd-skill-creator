# v1.49.959 — Retrospective

## What went right

- **The detector arc reached its documented terminal bounds.** v957 named exactly
  these two follow-ups (param-return-through, parenthesized-literal); v959 closed
  both with no new abstractions — `returnParams` is the param-dependent sibling of
  the existing `returnExprs`, and the paren unwrap is two one-line recursive
  branches at the two literal/expression chokepoints.
- **Unifying the two return kinds under one divergence guard** kept
  `resolveCallReturn` honest: a function with a literal path AND a param path
  resolves only if both agree on the same literal. The mixed-divergence case
  (`maybe(t,f)` returning `t` or a literal) falls out for free.
- **The over-report direction stayed safe.** Destructured params (`params[i] === ''`)
  route to `isParamInScope` and stay undefined; the nested self-call
  `id(id('x'))` under-reports and terminates via the shared `seen` set rather than
  hanging. Both are conservative (never a false wire).

## What went well in process

- **Robustness-only was held to its word.** The change is confined to
  `astWireFacts`; the regex fallback, the fail-soft router, and all caller regexes
  are byte-identical. The live-invariance review verified `callsReaderWith` is
  byte-identical pre/post on all five real end-to-end files, so the #10461
  live-tree drift guard is untouched.
- **The adversarial review earned its keep again.** Its test-coverage lens found a
  real mutation survivor — the `unconditionalExprReturn` conjunct on the
  `returnParams` storage gate had no pinning test (the v957 finding-#2 guards only
  exercised literal returns). Fixed in the suite before push, not banked.

## What to watch

- **Param-return-through residual bounds.** A function-local block that shadows a
  same-named param, and a nested self-call (`id(id('x'))`), are documented
  under-/over-report edges absent from every real file — left as the next bounds
  if a real e2e test ever needs them.
- **The flat-map block-scope leak** (a name declared once inside a block resolving
  at an out-of-scope call site) predates v959 and is the documented residual in
  the file header; v959 only widens which paths can reach it, never introduces it.
  It requires a non-compiling shape, so it is accepted by-design for this advisory
  gate.
