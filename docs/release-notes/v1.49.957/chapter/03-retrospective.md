# v1.49.957 — Retrospective

## What went right

- **The ship closed a bound the codebase had named on purpose.** Both the post-v1.49.956 handoff's forward-candidate list AND `astWireFacts`'s own scope note recorded the exact upgrade: follow a reader call that takes a function's return value. This is the fourth consecutive ship where the lesser ship's documented bound became the next ship's one-line scope decision (v953 -> v955 -> v956 -> v957). Naming a bound when you accept it keeps lifting it cheap.

- **The lift was held to a byte-identical live verdict, and proven so.** Adding return-value resolution could silently change which thresholds count as covered. The contract was: the verdict does not move. It was verified by `cadence --axis verify --json` (not-overdue, 0 uncovered) and by the line-level "verify axis (live repo)" #10461 drift guard -- both green because all five real end-to-end files pass direct string literals, untouched by the return-value machinery. The lift is invisible to the gate's output, exactly as a robustness refinement should be.

- **The conservative direction was the design, not an accident.** Three independent "don't claim it" rules -- divergent literal returns drop, any unresolvable return path drops, and a param-return (the value depends on the call site) drops -- mean the new resolution can only ever ADD a wire when a function unconditionally returns one fixed literal. Every other shape errs toward not-wired, the safe direction for an advisory coverage gate.

## What went well in process

- **The adversarial review found two over-reports, and BOTH were fixed in code.** A 4-lens review (9 agents, 0 blockers) surfaced two false-positive surfaces the committed tests missed: (1) a DESTRUCTURED parameter (`function f({ t }) { return t; }`) defeated `isParamInScope` -- which matched only identifier params -- and resolved against a colliding module `const t`, over-reporting a call-site-supplied value; (2) an implicit-`undefined` fall-through or a bare `return;` was silently excluded from the divergence check, so a helper that did not unconditionally return the literal still resolved to it. The review judged both ship-acceptable as documented residuals. For a milestone whose entire purpose is detector PRECISION, that is the wrong default -- both were closed: a binding-pattern-aware `isParamInScope` and an unconditional-expression-return requirement.

- **One finding was a latent bug in the PRIOR ship.** The destructured-parameter hole existed on v1.49.956's wrapper/direct-call path too (a colliding module const + a destructured-param function with an internal reader call over-reported under v956). The same one-line root-cause fix (`isParamInScope` recursing binding patterns) closed both the new return-value exposure and the pre-existing one. A review of a lift is also a review of what the lift sits on.

- **The fixes were precise and mutation-proven, not rewrites.** The binding-pattern guard is a small recursive helper; the fall-through requirement is a last-statement check plus a bare-return flag; the merged counter is a one-line consolidation. Each is pinned by a mutation: reverting `isParamInScope` to identifier-only reds the five destructured tests, disabling the fall-through detection reds the two implicit-return tests, removing the merged-counter return drop reds the two ambiguity tests. Eight mutations total, each reaped by exactly the tests that should catch it.

- **Review depth matched blast radius.** v1.49.956's review caught a real over-report on the first inter-procedural fixpoint in `src/`; this lift adds a new resolution vector (return values) on top of it, so it warranted the same multi-lens treatment -- and again found a real over-report (this time a MAJOR, plus a latent prior-ship bug) a single-vote review would likely have missed.

## What to watch

- **The lift is unexercised by real inputs.** No real end-to-end file routes a threshold through a function return -- the entire return-value path is exercised only by synthetic tests. That is fine (it is robustness for shapes a future author could write), but it means the live verdict cannot regress from a return-resolution bug; the protection is the synthetic suite and the #10461 drift guard, not the live data.

- **Param-return-through remains the next bound.** A function that returns one of its parameters (`function id(t){ return t; }`, then `load(id('x'))`) is not resolved; following it would need a return-reaches extension of the fixpoint (which call-site argument flows out through the return). It is contrived, absent from every real file, and named on purpose -- the same pattern that made this ship cheap.

- **Parenthesized literals are still not unwrapped.** `return ('lit')` does not resolve, because `literalOf` does not strip a `ParenthesizedExpression`. This is a pre-existing gap shared by the v955/v956 direct-literal and alias paths, a safe under-report, and was left out of scope to keep this ship focused on return-value dataflow.
