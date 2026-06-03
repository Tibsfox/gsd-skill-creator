# v1.49.956 — Retrospective

## What went right

- **The ship closed a bound the codebase had already named — twice.** Both the post-v1.49.955 handoff's forward-candidate list AND `astWireFacts`'s own scope note recorded the exact upgrade: lift the one-hop / one-level caps. Like v1.49.955 closing v1.49.953's deferred AST refinement, this ship is the close of a forward-shadow the lesser ship left behind. Naming a bound when you accept it makes lifting it a one-line scope decision later.

- **The lift was held to a byte-identical live verdict, and proven so.** Generalizing wrapper and binding resolution is dangerous precisely because it could silently change which thresholds count as covered. The contract was: the verdict does not move. It was verified by `cadence --axis verify --json` (not-overdue, 0 uncovered) and by the line-level "verify axis (live repo)" #10461 drift guard — both green because all five real end-to-end files pass direct string literals, untouched by the wrapper/binding machinery. The lift is invisible to the gate's output, exactly as a robustness refinement should be.

- **Termination was a design property, not a hope.** A fixpoint and a recursive alias resolver both invite non-termination. The fixpoint is monotone over a finite `(function x param index)` domain, so it converges; the alias resolver carries a `seen` set. Both were exercised with adversarial inputs (mutual recursion `f -> g -> f` with no reader call; binding cycle `const a = b; const b = a`) that return cleanly rather than hang — and those termination cases are committed tests, not one-off probes.

## What went well in process

- **The adversarial review found two over-reports, and BOTH were fixed in code, not documented away.** A 3-lens review (0 blockers, 0 majors) surfaced two minor false-positive surfaces: (1) `collectFn`'s `eachNode(fn.body)` descended into nested callbacks and attributed a nested param's name to the outer wrapper, and (2) the new flat `aliasBindings` map let a function-local `const` shadow a module-level `const` of the same name. Both are contrived (absent from real files) and conservative-direction for an advisory gate — the review explicitly judged them ship-acceptable as documented residuals. But this milestone's whole purpose is detector PRECISION, and finding #2's surface was NEW (introduced by this lift), so both were closed: `eachOwnNode` (no descent into nested function bodies) and an ambiguity drop (a redeclared binding name is unresolvable). The detector ships strictly more precise than when the review ran.

- **The fixes were precise and mutation-proven, not rewrites.** `eachOwnNode` is a four-line traversal variant; the ambiguity drop is a declaration counter plus a post-scan delete. Each is pinned by a mutation: reverting `eachOwnNode -> eachNode` reds the two finding-#1 tests, disabling the ambiguity drop reds the two finding-#2 tests. A boundary test pins that the ambiguity drop fires only on genuine redeclaration, not on every binding.

- **Review depth matched blast radius.** v1.49.955's review caught a real over-report on the first AST consumer in `src/`; this lift extends that consumer with the first inter-procedural fixpoint in `src/`, so it warranted the same 3-lens treatment — and it again found a real (if minor) over-report a single-vote review would likely have missed.

## What to watch

- **The lift is unexercised by real inputs.** No real end-to-end file uses a wrapper or a variable binding for the threshold — the entire N-hop / N-level machinery is exercised only by synthetic tests. That is fine (it is robustness for shapes a future author could write), but it means the live verdict cannot regress from a fixpoint bug; the protection is the synthetic test suite and the #10461 drift guard, not the live data.

- **Name-based resolution still has a contrived residual.** A single name declared once but read across genuinely distinct lexical scopes can mis-resolve. Three guards (nested-body non-descent, redeclared-name ambiguity, per-hop `isParamInScope`) close the cases that matter; the residual is absent from real files and no worse than the regex. Full lexical scope analysis was deliberately not built — it is disproportionate for an advisory gate.

- **Return-value dataflow remains unfollowed.** `load(getThreshold(), ...)` (a reader call taking a function's return value) is not resolved. It is a different mechanism than the two caps this ship lifted; if a real e2e test ever adopts it, the detector would under-report that one file (the safe direction) until it is added.
