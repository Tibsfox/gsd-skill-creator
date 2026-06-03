# v1.49.954 — Lessons

No new manifest lesson is promoted this ship (manifest stays **151**). This counter-cadence `feat` applies three existing lessons.

## Applied (existing lessons)

- **#10431 — two-layer closure for procedure-rooted drift.** The PROJECT.md "Latest shipped release" hand-edit is a textbook procedure-rooted drift: an operator-discretion step (hand-edit the structured lines each ship) that only becomes visible at the next pipeline gate. It had the detector half (`--check`, pre-tag-gate step 17, since v1.49.785) but not the source-eliminator half. This ship adds the eliminator (`--write`), completing the closure — the detector-first inversion of the STATE.md case (v807 detector -> v813 eliminator). A new instance of the pattern, recorded in the discipline doc's case studies.

- **#10168 — counter-cadence (gate-not-vigilance).** The offending RULE was "remember to hand-edit PROJECT.md each ship." Counter-cadence converts an offending rule into a deterministic gate rather than re-emphasizing the prose. The `--write` tool IS that conversion: the discretion step becomes a deterministic command with a post-condition self-check.

- **#10428 — meta-cadence (the operator/gate picks the counter-cadence scope).** The cadence-overdue check is informational; the operator picks which debt a counter-cadence spends on. This ship operationalized that: `cadence --check` was run first (exits 0 — nothing machine-overdue), confirming the scope had to be hand-picked, and the pick (PROJECT.md drift) was the most-evidenced debt available (surfaced twice in-batch).

## Carried-forward candidate (observed, not promoted)

- **A detector that has sat without a source eliminator for many ships is a standing counter-cadence candidate.** When the two-layer-closure ledger lists a drift class with a detector but no eliminator (here: PROJECT.md, open from v813 to v954 — 141 ships), that gap is durable operational debt that a counter-cadence with budget should close before inventing new work. The ledger IS the backlog. **One instance** of "close a long-standing detector-without-eliminator ledger entry." Promote if a second counter-cadence is scoped by picking the oldest open two-layer-closure ledger entry.

## Process notes

- **Scope a counter-cadence from a ledger, not from a blank page.** With `cadence --check` exiting 0, the temptation is to invent debt. Instead the scope came from an existing ledger (the two-layer-closure doc's explicit "open" list) — the highest-confidence source of real, named, bounded debt.

- **Dogfood a new gate on the ship that introduces it (#10203).** v954's PROJECT.md lines were set by `--write`, the very tool it ships — the cleanest acceptance test that the source eliminator works on the real artifact, not just synthetic fixtures.
