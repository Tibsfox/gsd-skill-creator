# v1.49.955 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This counter-cadence `feat` applies three existing lessons and records one carried-forward candidate.

## Applied (existing lessons)

- **#10450 — static-analysis tool parsers must handle common code-shape variants OR fail loudly.** The v1.49.953 regex was exactly the failure mode #10450 names: a code-shape parser blind to variants (comments, strings, aliases, namespaces, variable/wrapper indirection). This ship promotes it to an AST parse that handles those variants — the "handle common code-shape variants" half of the rule. The detector ships with sanity contrast-tests comparing the AST verdict against the regex on aliased/namespaced/commented/variable shapes, per the #10450 mitigation.

- **#10427 — failure-mode contracts (silent vs loud).** #10450 prefers fail-LOUD; this detector deliberately fails SOFT (silent degrade to regex on compiler-missing / parse-throw). #10427 is the resolution: the test "does the user's next decision hard-depend on this surface's output?" — for the verify axis, no (it is advisory; wired into no hook, not into the ship gate). So accessory -> swallow at the boundary is correct, AND the contract is made explicit (docstring marker + a paired throw-then-regex test), which is exactly #10427's documentation convention.

- **#10461 — gate-enforce-every-runnable-surface + drift-guard.** The "verify axis (live repo)" test is the Layer-2 drift guard: it pins the live verify verdict (all 7 wired thresholds covered) to disk reality, so the AST rewrite had to keep that test green — and a future end-to-end test that mentions-without-wiring, or a substrate naming scheme outside the specifier pattern, still fails it loudly.

## Carried-forward candidate (observed, not promoted)

- **Promote a regex code-shape detector to an AST parse — keeping the regex as a documented fail-soft fallback — when variant-blindness accumulates AND the surface is advisory.** The pattern: a raw-text detector ships first (fast, robust enough); its blind spots are enumerated in a Scope note; a later ship replaces it with an AST parse while preserving the regex as the fail-soft path for environments that cannot load the compiler. The fail-SOFT-vs-fail-LOUD choice (#10450 vs #10427) is decided by whether the surface is advisory. **One instance** here (v953 regex -> v955 AST for the cadence verify axis). Promote if a second detector follows the same regex-first -> AST-with-fallback arc; the generalizable shape would extend the static-analysis-tool discipline.

## Process notes

- **Name the future refinement in the lesser ship's Scope note.** v953 shipped a regex but recorded "a full AST/call-graph detector remains a possible future refinement." That single sentence turned v955's scoping into a one-line ledger pick. A Scope note that names what it is NOT doing is a forward-shadow that makes the better ship cheap.

- **Hold the verdict invariant explicitly, and prove it with the existing drift guard.** A detector rewrite's safety property is "the gate's output does not change." Make that the contract, and let the live-tree #10461 test be the proof — it already pins the verdict, so a green run IS the invariance proof.

- **When the AST requires an imported binding, fix unrealistic fixtures rather than weakening the detector.** v953 fixtures called the reader without importing it. The right move was to make the fixtures realistic (real tests import the reader), not to drop the binding-accuracy check — the 5 real files all import it, so the live verdict was never at risk.
