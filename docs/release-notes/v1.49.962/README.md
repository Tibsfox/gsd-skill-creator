---
title: "v1.49.962 — bypass-vocab parity drift-guard (counter-cadence #29)"
version: v1.49.962
date: 2026-06-03
summary: >
  Counter-cadence #29 closes a two-way documentation drift between the
  pre-tag-gate's runtime-honored SC_PRE_TAG_GATE_BYPASS tokens and the vocabulary
  advertised to operators, and installs a parity drift-guard so the two cannot
  diverge again (#10461 gate-enforce-every-runnable-surface, Layer-2 for the
  vocab surface).
tags: [counter-cadence, drift-guard, pre-tag-gate, "10461", tooling]
---

# v1.49.962 — bypass-vocab parity drift-guard (counter-cadence #29)

**Shipped:** 2026-06-03

The pre-tag-gate's documented bypass vocabulary now matches the tokens it actually
honors at runtime, pinned by a new parity test so the surfaces can never silently
drift apart again.

## Why this ship

The `SC_PRE_TAG_GATE_BYPASS` vocabulary was documented in four operator-facing
surfaces, all of which had drifted from what the gate truly honors. The honored
set is the ground truth: the first argument of each `gate_bypassed "X"` call in
`tools/pre-tag-gate.sh` (21 tokens). The docs advertised **five tokens the gate
never honored** — `build`, `version-sequence`, `vitest`, `completeness`,
`www-bundles` (the irreducible core steps, which run unconditionally) — and
**omitted two tokens the gate does honor** — `card-template-length`,
`integration`. An operator who set `SC_PRE_TAG_GATE_BYPASS=vitest` in an emergency
would find it a no-op; an operator who needed to skip the integration project
would not know the token existed. This was the last named follow-up from the
v1.49.961 review and the chosen scope for counter-cadence #29.

## What shipped

- **Reconciliation (docs -> gate reality).** All documented surfaces corrected to
  the gate's 21 honored tokens: the `SC_PRE_TAG_GATE_BYPASS` row in
  `tools/render-claude-md/env-vars.json` (re-rendered into CLAUDE.md), the runtime
  step-names help log in `tools/pre-tag-gate.sh`, and two header-comment blocks
  (de-enumerated into pointers so they cannot drift). The reconciliation direction
  is docs-to-gate: the core build/test/completeness/version-sequence/www-bundle
  steps stay intentionally non-CSV-bypassable (making them bypassable would be a
  safety regression).
- **Drift-guard (Layer-2).** New `tests/integration/bypass-vocab-parity.test.ts`
  extracts the gate-honored set, the env-vars vocabulary, and the help-log
  vocabulary and asserts all three are equal, with anti-vacuous floors, named
  anchors, a naming-convention pin, and boundary pins for the non-bypassable core
  and the two reconciled-in tokens. It runs in the root vitest project (every
  `npx vitest run` -> gate step 2 + CI), so it enforces every ship. No new gate
  step was added; the gate count stays at 19.

## Verification

- 7 parity assertions green; `tsc` build clean; adjacent gate meta-tests
  (v1.49.961 + v1.49.869) unaffected (16/16 together); apply-to-self clean;
  `render:claude-md --check` clean.
- **Mutation-proven five ways** (snapshot/restore, never `git checkout`): phantom
  token re-added to env-vars, real token dropped from the help log, a gate token
  renamed (gate-vs-doc drift), and — closing the review's MAJOR — an undocumented
  underscore token and an uppercase token in the gate. Each turns the guard red;
  baseline restores clean each time.
- **Adversarial review:** a four-lens Workflow review (6 agents) found two real
  MAJORs, both CONFIRMED by an independent verify pass and both fixed in code (not
  documented away): (1) the gate-honored parser regex `[a-z0-9-]+` silently dropped
  a future underscore/uppercase token the gate honors verbatim -> widened to
  `[^"]+` plus a loud naming-convention pin; (2) two header-comment vocab blocks
  self-claimed parity-pinning but were not pinned -> de-enumerated to pointers. A
  focused post-fix re-check found the final state clean.

## Engine state

- **NASA degree:** 1.178 (unchanged — frozen hold).
- **Counter-cadence:** #29 (28 -> 29).
- **Manifest lessons:** 151 (unchanged — applies #10461 / #10450 / #10427; no new
  lesson promoted).
- **cadence_advances:** none (not a substrate-coverage advance).
