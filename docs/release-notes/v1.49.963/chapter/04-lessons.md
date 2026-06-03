# v1.49.963 — Lessons

No new manifest lesson is promoted. This ship applies existing lessons; the
manifest stays at 151.

## Applied (existing lessons)

- **#10450 (static-analysis tool must handle code-shape variants OR fail
  loudly).** The parenthesized-param forwarding gap was exactly a code-shape
  variant the detector silently mishandled (an under-report). Closing it at all
  four collect-site attribution points plus the binding-initializer sites is the
  variant-coverage this lesson calls for; the existing fail-soft to regex
  (#10427) remains the loud-failure backstop for shapes still uncovered.
- **#10427 (failure-mode contracts: silent-vs-loud).** The detector is an
  advisory surface that errs toward not-wiring, and `computeWireFacts` absorbs a
  parse throw via the regex fallback. The recursion-depth ceiling surfaced in
  review is the intended silent-degrade direction for this surface, not a
  defect.
- **#10461 (gate-enforce-every-runnable-surface + drift-guard).** The live-repo
  verify-axis test is the drift guard for the detector's real-world verdict. The
  lift was held to byte-identical against it, and that test stays the pin: a
  future change that altered the live verdict would have to update it.

## Process notes

- **Verify the fix, not just the finding (carried from v962).** Every fix point
  was mutation-proven, including the termination guard, which required asserting
  on `astWireFacts` directly because `computeWireFacts`'s try/catch would
  otherwise mask a stack-overflow mutant behind the regex fallback. A test that
  routes through the fail-soft path cannot pin a throw-based mutation.
- **Read the code before trusting a handoff's residual description.** Both the
  scope (four sites, not one) and the feasibility (the nested self-call is
  cleanly fixable, not "by design") differed from the prose; a direct probe of
  the detector settled both.
- **Mutation-testing sub-agents must be isolated or additive-only.** A
  non-isolated scoping agent left a prototype patch in the working tree; the
  follow-up review was constrained to additive probe files and the tree was
  re-verified clean around it.
