# v1.49.957 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This forward `feat` applies three existing lessons and adds a second instance to the v1.49.955 carried-forward candidate's lift sub-observation.

## Applied (existing lessons)

- **#10450 — static-analysis tool parsers must handle common code-shape variants OR fail loudly.** This ship extends the "handle common code-shape variants" half from literals/aliases/wrappers to return values, and ships with contrast tests pairing each AST resolution against the regex verdict it corrects. Critically -- per the #10450 mitigation and this milestone's precision bar -- the adversarial review confirmed the tool was not silently OVER-reporting on the shape it added, and the two over-reports it did find were closed in code.

- **#10427 — failure-mode contracts (silent vs loud).** The verify axis stays ADVISORY (wired into no hook, not the ship gate), so the detector's worst silent failure is a missed cadence nudge. That is what licenses the over-report guards to err toward NOT wiring (the conservative coverage-gate direction) rather than throwing -- and why the two findings, "ship-acceptable" as documented residuals, were still worth fixing: the cost of fixing a conservative over-report is low, so precision wins.

- **#10461 — gate-enforce-every-runnable-surface + drift-guard.** The "verify axis (live repo)" test is the Layer-2 drift guard the lift had to keep green: it pins the live verify verdict (all 7 wired thresholds covered) to disk reality, so adding return-value resolution had to leave that verdict byte-identical -- which it did, because the real files pass direct literals.

## Carried-forward candidate (refined, not promoted)

- **Promote a regex code-shape detector to an AST parse -- keeping the regex as a documented fail-soft fallback -- when variant-blindness accumulates AND the surface is advisory.** This is the v1.49.955 candidate (one instance: v953 regex -> v955 AST). v1.49.957 does NOT add a second instance of the regex->AST arc; it deepens the AST path. It adds a SECOND instance to the candidate's lift sub-observation, first noted at v1.49.956: *the depth bounds an AST detector documents at introduction are a forward-shadow -- lifting each later is a clean follow-on `feat`, and the adversarial review of the lift should specifically hunt for over-reports the deeper resolution introduces.* v956 lifted v955's two caps (and the alias map's flat-scope collision was a NEW over-report surface); v957 lifts v956's return-value bound (and the destructured-param hole was a NEW over-report surface -- plus a latent prior-ship bug). Two lifts, two review-found NEW over-report surfaces, both fixed in code. Still one regex->AST instance; promote the parent candidate if a second detector follows the same arc.

## Process notes

- **A review of a lift is also a review of what the lift sits on.** The destructured-parameter over-report was a latent v1.49.956 bug (the wrapper/direct-call path resolved a destructured param against a colliding const), surfaced only because v957's return-value path hit the same broken `isParamInScope`. The one-line root-cause fix closed both. When a review of the new code traces into shared machinery, fix the shared defect at its root, not just the new caller.

- **When a precision detector's review finds a conservative over-report, fix it -- don't bank it as a residual.** Both findings were minor-to-major, contrived, and conservative-direction; the review judged them ship-acceptable as documented residuals. For a milestone whose entire value is precision, that is the wrong default: the fixes were small, strictly conservative, mutation-proven, and moved the detector from "documents two false-positive surfaces" to "closes them." This is the second consecutive lift (v956, v957) where the review's residual-acceptable findings were closed in code instead.

- **Match the conservative contract you already enforce.** The implicit-fall-through over-report existed because the code already dropped EXPLICIT divergent returns (`if (c) return 42; return 'lit'` -> not wired) but not the IMPLICIT undefined path (`if (c) return 'lit'` with no else). The author had even written the explicit-divergence test. The fix made the implicit path obey the same contract the explicit path already did -- a consistency repair, not a new policy.

- **The lift's own bounds are the next forward-shadow.** This ship documents new bounds (param-return-through; the parenthesized-literal under-report). They are named on purpose: if a real e2e test ever needs param-return resolution, the scope note already says what is NOT handled, making that follow-on a one-line pick.
