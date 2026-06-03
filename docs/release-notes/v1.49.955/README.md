---
title: "v1.49.955 — AST/call-graph wire detector for the cadence verify axis (counter-cadence #26)"
version: v1.49.955
date: 2026-06-02
summary: >
  Counter-cadence #26: replace the v1.49.953 regex wire detector behind the
  cadence verify axis with a true TypeScript-AST + intra-file dataflow + depth-1
  call-graph detector — the "full AST/call-graph wire detector" v1.49.953's own
  Scope note named as the future refinement. The verify axis judges a wired
  calibratable threshold "covered" iff a dedicated *-end-to-end integration test
  exercises BOTH ends of the substrate -> calibration wire. v1.49.953 matched
  both ends with raw-text regex, which (a) false-POSITIVES when the call text
  appears in a JSDoc/comment or string literal (all five real end-to-end files
  carry loadObservationsForThreshold('...') in their JSDoc) or a substrate
  "import" sits inside a comment, and (b) false-NEGATIVES on import aliases,
  namespace imports, and any threshold passed through a variable or a wrapper.
  The new astWireFacts parses the test with the compiler: the CALLER end must be
  a real CallExpression whose callee resolves to the IMPORTED reader binding (a
  local shadow that merely shares the name does NOT match; aliases and namespace
  imports are followed), the threshold ARGUMENT is resolved through a
  string-literal const binding and through a depth-1 wrapper that forwards a
  parameter, and the SUBSTRATE end is a real ImportDeclaration. The regex
  survives as a documented, test-paired FAIL-SOFT fallback for when the compiler
  cannot be loaded (a production CLI without devDependencies) or a parse throws —
  correct because the verify axis is an ADVISORY gate (#10427). The live verify
  verdict is byte-for-byte unchanged (not-overdue, 0 uncovered; all 7 wired
  thresholds across the 5 real end-to-end files wire under both paths), so the
  "verify axis (live repo)" test stays the #10461 drift guard. 16 detector tests
  (each AST win paired against the regex verdict it corrects); all four AST
  conjuncts mutation-proven; a 3-lens adversarial review (0 blockers, 0 majors)
  surfaced three nits, all fixed or documented in-ship.
tags: [feat, cli, cadence, verify, ast, call-graph, wire-detector, counter-cadence, lesson-10450, lesson-10427]
---

# v1.49.955 — AST/call-graph wire detector for the cadence verify axis (counter-cadence #26)

**Shipped:** 2026-06-02

One-line: the `cadence` verify axis now decides a threshold is "covered" by PARSING each dedicated end-to-end test with the TypeScript compiler and structurally resolving the substrate -> calibration wire — ignoring the call text when it appears in comments/JSDoc/strings, binding the callee to the imported reader (aliases + namespaces followed), and resolving the threshold through variable and depth-1 wrapper indirection — replacing the v1.49.953 raw-text regex.

## Why this ship

The post-v1.49.954 handoff named two operator picks; this ship is both at once. Counter-cadence #26 was scoped from the handoff's own forward-candidate list (`cadence --check` exits 0 — nothing machine-overdue), and the candidate chosen was "a full AST/call-graph verify wire detector — replace v953's regex detector," which v1.49.953's Scope note had explicitly deferred: *"A full AST/call-graph wire detector remains a possible future refinement."* This ship realizes it.

The v1.49.953 regex had two structural blind spots a real end-to-end test author can hit:

- **False positives.** The caller regex matches `loadObservationsForThreshold('threshold')` wherever the text appears — including a JSDoc example or a comment (all five real end-to-end files carry exactly that call in their JSDoc headers) or inside a string literal. The substrate regex matches a `from '...-events.js'` even inside a comment. A locally-defined function sharing the reader's name also matches.
- **False negatives.** A threshold passed through a `const`, an import alias (`loadObservationsForThreshold as load`), a namespace import (`os.loadObservationsForThreshold`), or a wrapper function is invisible to the raw-text regex.

## What shipped

- **`astWireFacts(content, ts)`** — parses the source with `ts.createSourceFile` and extracts two facts (independent of any specific threshold): `importsSubstrate` and the set `callsReaderWith`. A threshold is wired iff `importsSubstrate && callsReaderWith.has(threshold)`. The AST path resolves what the regex could not:
  - **CALLER end** is a real `CallExpression` — comments, JSDoc, and string-literal occurrences of the call text are not nodes and are ignored. The callee must resolve to the IMPORTED reader binding (a local function that merely shares the name does NOT match); named imports, aliases (`as load`), and namespace imports (`import * as os` from `observation-sources` -> `os.loadObservationsForThreshold`) are followed.
  - **Threshold ARGUMENT** is resolved through intra-file dataflow: a direct string literal, a no-substitution template, `'x' as const`, an identifier bound to a string-literal `const`/`let`, and a depth-1 wrapper that forwards a parameter to the reader (`function w(t){ return load(t) }; w('x')`).
  - **SUBSTRATE end** is a real `ImportDeclaration` whose specifier matches `/-substrate|-events|suggestion-store/` — an import line inside a comment does not count.
- **`regexWireFacts(content)`** — the v1.49.953 logic, generalized to the same `WireFacts` shape; the FAIL-SOFT fallback.
- **`computeWireFacts(content, ts)` + lazy `loadTypeScript()`** — the compiler is required lazily via `createRequire(import.meta.url)('typescript')` (memoized) so the eager `dispatch.ts` import of `cadenceCommand` does not load the compiler on every CLI invocation; the `import type * as TS` is erased at runtime. On a compiler-load failure or a parse throw, `computeWireFacts` degrades to `regexWireFacts` — a documented FAIL-SOFT contract (see Scope note).
- **`detectThresholdWire(threshold, content)`** keeps its signature (so `verifyVerdict` is unchanged) and memoizes `WireFacts` per file content so its per-(threshold, file) calls parse each file once.
- **`detectThresholdWireWith(threshold, content, ts | null)`** — a deterministic test seam: pass a real `ts` to force the AST path, `null` to force the regex fallback, in one process.

## Scope note (now realized; new bound)

v1.49.953's "structural (not full call-graph)" caveat is closed: this IS the AST/call-graph detector. Two bounds remain, both documented in `astWireFacts` and acceptable-by-design for an advisory gate:

- **One-hop call graph + one-level binding.** A wrapper calling another wrapper, or a `const a = b` chain, is not followed. Absent from all five real files.
- **Scope-flat const map.** Two same-named string-literal `const`s in different blocks are not lexically distinguished. The one place this mattered in practice — a wrapper parameter shadowing a module const of the same name (a review-surfaced over-report) — IS handled by a lexical `isParamInScope` guard; the residual (two block consts of the same name, one threshold-shaped) is contrived and no worse than the regex.

The **FAIL-SOFT** choice (silent degrade to regex on compiler-missing / parse-throw) is the documented exception to the static-analysis fail-LOUD rule (#10450): the verify axis is ADVISORY (#10427) — wired into no hook and not into pre-tag-gate/CI — so its worst silent failure is a missed cadence nudge, never a broken ship or a spurious `overdue` (all divergences err toward over-reporting coverage, the conservative direction for a coverage gate). The contract is paired with a dedicated throw-then-regex test.

## Verification

- `npx tsc --noEmit` clean (new compiler-API usage typechecks; first AST consumer in `src/`).
- `cadence.test.ts` 65/65 (16 detector tests; each AST-vs-regex contrast pins the win against the verdict it corrects). `cadence --check` exits 0; `cadence --axis verify --json` reports `not-overdue`, `uncovered: []`, all 7 covered.
- **All four AST conjuncts mutation-proven**: never set `importsSubstrate` (16 fail), match the reader name even when unimported (1 fail — binding-accuracy), drop identifier->binding resolution (4 fail), never record a wrapper (2 fail); plus disabling the `isParamInScope` guard fails the over-report test.
- No collateral: the private `escapeRegExp` removal breaks no importer; `cadence.js` is imported only by `dispatch.ts` + its test; CLI suite 701/701.
- **3-lens adversarial review Workflow** (AST-correctness/evasion · invariance+runtime-safety · test-rigor): 0 blockers, 0 majors. Three nits closed/documented in-ship — wrapper/const name-collision over-report (fixed: `isParamInScope`), undocumented fail-soft catch (documented #10427 + throw-fallback test), scope-flat binding bound (documented).

## Engine state

NASA 1.178 (unchanged), counter-cadence **25 -> 26** (operator-designated; the sibling detector-hardening v1.49.953 was a forward `feat` and not counted, but the operator scoped this AST upgrade explicitly as counter-cadence #26), manifest **151** (unchanged — applies #10450 / #10427 / #10461; records a carried-forward "promote a regex code-shape detector to AST with a fail-soft fallback" candidate; promotes no lesson). No `cadence_advances` tag: hardening the verify DETECTOR is not a verify-axis COVERAGE advance (coverage is unchanged), exactly as v1.49.949/953 self-tagged nothing.
