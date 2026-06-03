# v1.49.955 — Summary

## The ship

Counter-cadence #26: replace the v1.49.953 raw-text regex behind the `cadence` verify axis with a true TypeScript-AST + intra-file dataflow + depth-1 call-graph wire detector. This realizes the exact refinement v1.49.953's Scope note deferred — *"A full AST/call-graph wire detector remains a possible future refinement."*

## How it was scoped

`skill-creator cadence --check` exits **0** (no axis machine-overdue), so #26 was scoped from a ledger — the post-v1.49.954 handoff's own forward-candidate list, which named "a full AST/call-graph verify wire detector — replace v953's regex detector." Operator-designated as counter-cadence #26.

## The problem with the regex

The v1.49.953 detector matched both ends of the substrate -> calibration wire with raw text, giving it two blind spots a real end-to-end author hits:

- **False positives** — the call text in a JSDoc/comment or string literal (every real e2e file carries `loadObservationsForThreshold('...')` in its JSDoc), a substrate `from '...-events.js'` inside a comment, or a local function sharing the reader's name.
- **False negatives** — a threshold passed via a `const`, an import alias, a namespace import, or a wrapper function.

## What shipped

- **`astWireFacts(content, ts)`** — `ts.createSourceFile` parse -> `{ importsSubstrate, callsReaderWith }`. Caller end is a real `CallExpression` bound to the IMPORTED reader (aliases + namespaces followed; local shadows rejected); the threshold arg is resolved through string-const bindings and a depth-1 parameter-forwarding wrapper; the substrate end is a real `ImportDeclaration`.
- **`regexWireFacts(content)`** — the v953 logic generalized to the same shape; the FAIL-SOFT fallback.
- **`computeWireFacts` + lazy `loadTypeScript()`** — the compiler is required lazily (memoized) so eager `dispatch.ts` import stays cheap; degrades to regex on load-failure or parse-throw.
- **`detectThresholdWire`** keeps its signature (memoized per file); **`detectThresholdWireWith(..., ts | null)`** is the deterministic AST/regex test seam.

## The invariant

The live verify verdict is byte-for-byte unchanged — `not-overdue`, 0 uncovered, all 7 wired thresholds covered by the 5 real end-to-end files under BOTH the AST and regex paths. The "verify axis (live repo)" test stays the #10461 drift guard.

## Verification

- `cadence.test.ts` 65/65 (16 detector tests, each AST win paired against the regex verdict it corrects); `tsc` clean; `cadence --check` exits 0.
- All four AST conjuncts mutation-proven, plus the `isParamInScope` over-report guard.
- 3-lens adversarial review: 0 blockers, 0 majors; three nits fixed/documented in-ship.

## Engine state

NASA 1.178 (unchanged), counter-cadence **25 -> 26**, manifest **151** (unchanged — applies #10450 / #10427 / #10461; promotes no lesson). No `cadence_advances` tag.
