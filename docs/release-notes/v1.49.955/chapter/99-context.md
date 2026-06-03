---
title: "Context"
chapter: 99-context
version: v1.49.955
date: 2026-06-02
summary: "Where v1.49.955 sits in the larger arc."
tags: [context, cli, cadence, verify, ast, call-graph, counter-cadence]
---

# v1.49.955 — Context

## Milestone metadata

- **Version:** v1.49.955
- **Type:** `feat(cli)` — AST/call-graph wire detector for the cadence verify axis (**counter-cadence #26**)
- **Predecessor:** v1.49.954 (PROJECT.md latest-shipped source eliminator, counter-cadence #25)
- **NASA degree:** 1.178 (unchanged — degree-non-advancing)
- **Counter-cadence count:** 25 -> **26**

## Where this sits

- First ship after the post-v1.49.954 "1 2 3 and 4" batch closed. Operator picked two forward candidates — "Counter-cadence #26" and "Full AST/call-graph verify detector" — which resolve to one ship: the AST detector IS counter-cadence #26.
- The verify-axis detector arc: **v947** (dedicated-file restriction) -> **v949** (end-to-end-file detection) -> **v953** (structural regex wire detection) -> **v955** (AST/call-graph wire detection — this). v953's Scope note named v955 as the future refinement.

## How the scope was chosen

`skill-creator cadence --check` exits 0:

| Axis | Status | Why |
|---|---|---|
| codify | manual | 151 lessons; operator-tracked backlog |
| consume | not-overdue | 0 genuinely-unwired thresholds |
| calibrate | not-overdue | max 12 observations (< 20) |
| verify | not-overdue | all 7 wired thresholds wire (post-v953/v955) |

Nothing machine-overdue -> #26 was scoped from a ledger: the handoff's forward-candidate list, which named "a full AST/call-graph verify wire detector — replace v953's regex detector."

## Files changed

- `src/cli/commands/cadence.ts` — replaces the regex `detectThresholdWire` with `astWireFacts` (TS-compiler parse + import/alias/namespace binding resolution + string-const dataflow + depth-1 wrapper call-graph + `isParamInScope` lexical guard), `regexWireFacts` (fail-soft fallback), `computeWireFacts`, lazy `loadTypeScript()`, and `detectThresholdWireWith` (test seam); new exports `WireFacts`, `SUBSTRATE_SPECIFIER_RE`, `READER_MODULE_RE`; module/`verifyVerdict` docstrings updated; private `escapeRegExp` removed. Adds `import { createRequire } from 'node:module'` + `import type * as TS from 'typescript'`.
- `src/cli/commands/cadence.test.ts` — `import * as ts from 'typescript'`; 16 detector tests (existing core + an AST-precision contrast block + a WireFacts-primitives block, incl. wrapper/const collision and the fail-soft throw test); the `READER_IMPORT` fixture; unrealistic call-without-import fixtures made realistic.

## The detector arc (verify axis)

| Ship | Mechanism | Blind spot it closed |
|---|---|---|
| v1.49.947 | `content.includes` over dedicated files | global substring scan -> dedicated files only |
| v1.49.949 | end-to-end-file detection | non-end-to-end files no longer count |
| v1.49.953 | regex: reader-call-literal + substrate-import | a bare mention no longer counts |
| v1.49.955 (this) | AST: real call bound to imported reader + dataflow + depth-1 call-graph | comments/strings/aliases/namespaces/variable+wrapper indirection |

## Runtime note

The compiler is required lazily (`createRequire(import.meta.url)('typescript')`, memoized) so the eager `dispatch.ts` import of `cadenceCommand` does not load it on every CLI run; `import type * as TS` is erased at runtime. `cadence` is operator-only (no hook, not in pre-tag-gate/CI), so the AST path always runs where devDeps exist; the regex fail-soft fallback covers a production-CLI-without-devDeps install. Precedent: `src/cli.ts` already does `createRequire(...)('typescript/package.json')`.

## Test posture

- `cadence.test.ts` 65/65 (16 detector tests). `tsc --noEmit` clean. `cadence --check` exits 0; `cadence --axis verify` reports `not-overdue`, `uncovered: []`.
- Mutation-proven: each of the four AST conjuncts (substrate-import, reader-binding-accuracy, identifier dataflow, wrapper call-graph) plus the `isParamInScope` over-report guard reaps at least one test when reverted.
- CLI suite 701/701; no collateral from the `escapeRegExp` removal.
- 3-lens adversarial review Workflow: 0 blockers, 0 majors; three nits fixed/documented in-ship.

## Engine state at close

- NASA degree 1.178 (unchanged).
- Counter-cadence count **26** (operator-designated; the sibling forward `feat` v953 was not counted).
- Manifest: **151 lessons** (unchanged — applies #10450 / #10427 / #10461; records a carried-forward "promote-regex-to-AST-with-fail-soft-fallback" candidate; promotes none).

## References

- The detector: `src/cli/commands/cadence.ts` (`astWireFacts`, `detectThresholdWire`).
- The arc predecessor: v1.49.953 (regex wire detector; its Scope note named this ship).
- The drift guard: the "verify axis (live repo)" test (#10461).
- The disciplines: static-analysis-tool (#10450), failure-mode-contracts (#10427).
