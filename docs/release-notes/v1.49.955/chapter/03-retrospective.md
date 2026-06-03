# v1.49.955 — Retrospective

## What went right

- **The ship realized a refinement the codebase had already named.** v1.49.953's Scope note did not just leave the regex as-is — it explicitly recorded the upgrade path: *"A full AST/call-graph wire detector remains a possible future refinement."* Two ships later, a counter-cadence with budget closed it. The scope note was a forward-shadow; this ship is its close. Naming the future refinement at the time of the lesser ship is what made the better ship a one-line scope decision.

- **The live verdict was held invariant, and proven so two ways.** A detector rewrite is dangerous precisely because it could silently change which thresholds count as covered. The contract was: byte-for-byte the same verdict. It was verified by running `cadence --axis verify --json` (not-overdue, 0 uncovered) AND by the line-level "verify axis (live repo)" #10461 drift guard test, AND a review lens confirmed AST-vs-regex produce identical verdicts across all 5 real files x all thresholds. The rewrite is invisible to the gate's output — exactly as a hardening should be.

- **Binding-accuracy was the real win, and it required updating unrealistic test fixtures.** Several v953 synthetic test contents called `loadObservationsForThreshold` WITHOUT importing it — fine for a raw-text regex, but the AST (correctly) requires the callee to resolve to an imported binding. Rather than weaken the detector to match the fixtures, the fixtures were made realistic (a real test always imports the reader). The fixtures were wrong; the detector is right; the 5 real files all import the reader, so the live verdict never moved.

- **Every AST win is pinned against the regex verdict it corrects.** The 16 detector tests do not just assert "AST says X" — the contrast cases assert `detectThresholdWireWith(..., ts)` AND `detectThresholdWireWith(..., null)` in the same test, so the regex's wrong answer is recorded alongside the AST's right one. A future change that silently collapsed the AST path back to regex behavior reds those tests immediately.

## What went well in process

- **The adversarial review found a real over-report and the fix was precise, not a rewrite.** A 3-lens review (0 blockers) surfaced a genuine new-direction false positive: a wrapper parameter `t` forwarded to the reader resolved against a module-level `const t = '<threshold>'` of the same name, marking the threshold wired even when the wrapper was never called with a literal. The fix was a one-helper lexical-scope guard (`isParamInScope`, walking the parent pointers already enabled) — it closes the collision without touching the wrapper feature, and is mutation-proven. The depth of the review matched the blast radius of a new compiler-API pattern.

- **The fail-soft contract was made explicit, not assumed.** The same review noted the `catch { regexWireFacts() }` silent degrade was neither documented nor tested — the exact #10427/#10450 anti-pattern in miniature. Closed in-ship: the contract is documented (advisory gate -> silent degrade is correct) and paired with a throw-then-regex test that the explicit-`null` cases did not exercise.

## What to watch

- **`createRequire('typescript')` is sound here only because `cadence` is operator-only.** The compiler is a devDependency. The AST path always runs from inside the repo (where devDeps exist) because `cadence` is wired into no hook and not into pre-tag-gate/CI — grep confirms only "counter-cadence" prose, never the command. A future change that wired `cadence` into the ship gate or CI would put the AST path on a surface that may lack devDeps; the fail-soft fallback covers it, but the assumption should be re-checked then.

- **The regex fallback must not drift from the AST path's verdict on real files.** Today they agree on all 5 real files. The fallback is a safety net, not a second source of truth; if a future real e2e test uses a shape only the AST resolves (a variable or wrapper), the two paths will diverge on that file — correct (AST wins), but worth noting that the fallback then under-reports that one file.

- **Scope-flat binding remains a documented bound.** Two same-named block consts (one threshold-shaped) can mis-resolve. Contrived, absent from real files, no worse than regex — but it is the one residual false-negative shape, and false-negatives are the direction that could (in principle) flip not-overdue to a missed gap.
