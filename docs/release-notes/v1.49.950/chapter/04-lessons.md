# v1.49.950 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This `feat` ship completes the meta-cadence tool and records one carried-forward candidate.

## Applied (existing lessons)

- **#10428 — meta-cadence (gate-not-vigilance).** v1.49.947 built the FIRST-conjunct surface and named the second conjunct as operator-tracked. This ship machine-tracks the second conjunct (`>=10` ships since last advance) so a met first conjunct reaches a definitive `overdue` and `--check` becomes a true gate — converting the last operator-vigilance step of the overdue-check into a deterministic surface.
- **#10461 — gate-enforce-every-runnable-surface (wire a producer, don't ship dormant).** The new `readAxisAdvances` consumer is given real producers in the same ship: the two genuine consume ships (v1.49.944, v1.49.946) are tagged `cadence_advances: [consume]`. A consumer surface shipped without any producer is the "active but finds nothing" dormancy this lesson warns against.
- **#10427 — failure-mode contracts (honest verdicts, never a false positive).** The upgrade is one-directional and guarded: only a `candidate` (first conjunct already met) can become `overdue`, and only with a known anchor `>=10` ships back. Unknown anchors and sub-threshold counts stay `candidate`. A gate that claimed `overdue` on a guessed anchor would be the silent-failure anti-pattern; the design refuses to guess.

## Carried-forward candidate (observed, not promoted)

- **A two-conjunct gate splits a live-state conjunct from a marker-tracked conjunct.** When a discipline's trigger is conjunctive and only one conjunct is derivable from live state, the honest machine surface computes that conjunct live (here: observations / wired registry / dedicated end-to-end tests) and tracks the other via an explicit, operator-authored marker (here: `cadence_advances` frontmatter), upgrading to a definitive verdict only when BOTH are met and staying advisory otherwise. **One instance.** Promote if a second conjunctive-trigger tool adopts the same live-conjunct / marker-conjunct split (sibling of the v1.49.947 carried-forward "deterministic first-conjunct surface + operator-tracked second conjunct" — this ship realizes the second half of that pattern).

## Process note

- **Apply the marker discipline to the ship that introduces it.** The cleanest test of a new "this ship advanced axis X" convention is whether the introducing ship would tag itself — and here it would NOT (it promotes no manifest lesson, so it is not a codify advance). Resisting a vanity self-tag kept the very first use of the convention honest.
- **A semantics shift in an exit code is a contract change — update all three surfaces together.** Moving `--check`'s trip from `candidate` to `overdue` touched the exit-code computation, the human output text, and the module docstring; changing one without the others would have left a lying surface (#10427). The shift was also checked against existing tests for a silent break (none relied on candidate -> exit 1).
