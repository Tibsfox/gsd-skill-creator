# v1.49.956 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This forward `feat` applies three existing lessons and refines the v1.49.955 carried-forward candidate.

## Applied (existing lessons)

- **#10450 — static-analysis tool parsers must handle common code-shape variants OR fail loudly.** v1.49.955 promoted the regex to an AST parse that handles comments/aliases/namespaces/one-hop indirection; this ship extends the "handle common code-shape variants" half to N-hop wrapper chains and N-level binding chains. The detector ships with contrast tests that pair each AST resolution against the regex verdict it corrects, per the #10450 mitigation — and, critically, the adversarial review confirmed the tool was not itself silently over-reporting on the two shapes it added.

- **#10427 — failure-mode contracts (silent vs loud).** The verify axis stays ADVISORY (wired into no hook, not the ship gate), so the detector's worst silent failure is a missed cadence nudge. That is what licenses the two over-report guards to err toward NOT wiring (the conservative coverage-gate direction) rather than throwing — and it is why both findings were "ship-acceptable" yet still worth fixing: the cost of fixing a conservative over-report is low, so precision wins.

- **#10461 — gate-enforce-every-runnable-surface + drift-guard.** The "verify axis (live repo)" test is the Layer-2 drift guard the lift had to keep green: it pins the live verify verdict (all 7 wired thresholds covered) to disk reality, so generalizing wrapper/binding resolution had to leave that verdict byte-identical — which it did, because the real files pass direct literals.

## Carried-forward candidate (refined, not promoted)

- **Promote a regex code-shape detector to an AST parse — keeping the regex as a documented fail-soft fallback — when variant-blindness accumulates AND the surface is advisory.** This is the v1.49.955 candidate (one instance: v953 regex -> v955 AST). v1.49.956 does NOT add a second instance of the regex->AST arc; it deepens the AST path that already exists. It adds one observation to the candidate's shape: *the depth caps an AST detector documents at introduction are themselves a forward-shadow — lifting them later is a clean follow-on `feat`, and the adversarial review of the lift should specifically hunt for over-reports the deeper resolution introduces (the alias map's flat-scope collision was exactly such a NEW surface).* Still one regex->AST instance; promote the parent candidate if a second detector follows the same arc.

## Process notes

- **When a precision detector's review finds a conservative over-report, fix it — don't bank it as a residual.** Both findings were minor, contrived, and conservative-direction; the review judged them ship-acceptable as documented residuals. For a milestone whose entire value is precision, that is the wrong default: the fixes (`eachOwnNode`, ambiguity drop) were small, strictly conservative, mutation-proven, and moved the detector from "documents two false-positive surfaces" to "closes them." Documenting an over-report is a fallback for when the fix is expensive; here it was cheap.

- **Make termination a committed test, not a probe.** A fixpoint and a recursive resolver both need a convergence/cycle argument. The argument (finite domain; `seen` set) is in the docstring, but the proof is two tests — mutual-recursion-with-no-reader-call and a binding reference cycle — that pass by returning rather than hanging. A reviewer (or a future refactor) re-runs the proof for free.

- **The lift's own depth caps are the next forward-shadow.** This ship documents new bounds (return-value dataflow; the contrived single-name cross-scope residual). They are named on purpose: if a real e2e test ever needs return-value resolution, the scope note already says what is NOT handled, making that follow-on a one-line pick — the same pattern that made this ship cheap.
