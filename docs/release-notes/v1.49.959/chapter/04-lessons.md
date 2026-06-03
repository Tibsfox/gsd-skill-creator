# v1.49.959 — Lessons

No new manifest lesson is promoted (count stays 151). v959 deepens the existing
AST detector path rather than introducing a new reusable pattern.

## Applied (existing lessons)

- **#10450 (static-analysis tools must handle code-shape variants OR fail loudly).**
  Param-return and parenthesized literals are two more code-shape variants the
  AST parser now handles; the regex fallback still covers neither, and the
  fail-soft router degrades to it on any throw (both new helpers are total — no
  new throw surface).
- **#10427 (failure-mode contracts — silent vs loud).** The detector is an
  advisory coverage gate: the safe failure direction is to UNDER-report (not
  wire), never to over-report. Every new path preserves that — the divergence
  guard, the `unconditionalExprReturn` storage gate, and the `seen` cycle guard
  all resolve to undefined rather than guess.
- **#10461 (gate-enforce-every-runnable-surface + drift-guard).** The live-repo
  verify test is the drift guard for the verdict; the lift is robustness-only so
  that guard stays byte-identical (verified pre/post on all five real e2e files).

## Process notes

- **Reviewing a lift also reviews what it sits on.** The over-report lens
  re-surfaced the pre-existing flat-map block-scope leak (present since v955) —
  not a v959 defect, but worth re-confirming as the documented residual now that
  more paths can reach it.
- **A precision detector's storage GATES need their own pinning tests, per return
  kind.** The v957 finding-#2 guards covered the `unconditionalExprReturn` gate
  for literal returns but not for param returns; the param sibling needed its own
  fall-through / bare-return guard tests. Mirror existing over-report guards for
  each NEW classification path, not just the value path.
