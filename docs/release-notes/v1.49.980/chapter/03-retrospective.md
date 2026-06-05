# v1.49.980 — Retrospective

## What went right

- **Design-before-build paid off.** The D4 resolution mandated a design pass instead of pre-committing a mechanism. The read-only panel didn't just rank candidates — it *refuted the audit's premise* for co-activation (it was already CLI-reachable, not "never consumed") and *confirmed the trap* for calibration (ticking the degenerate retention signal would false-vindicate `lastTick`). Building the wrong mechanism, or ticking a degenerate signal, was averted by ~spending tokens on verification first.
- **Two-for-one fix.** The same envelope-unwrap bug had a second victim — the dashboard `session-collector` silently dropped every record too. Fixing both in one ship restored the dashboard session metrics for free.
- **Stale premise caught.** The `// Not provided by Claude Code` comment at `session-end.ts:80` was load-bearing in the original audit's reasoning and was *false* on the current harness — skill names are recoverable from the live transcript. Re-verifying premises ~14 milestones after the plan was written changed the whole disposition.
- **Honest worst case.** Co-activation cannot fabricate a false learned signal — if data is too sparse it surfaces nothing. That property (vs calibration's false-vindication risk) drove the choice.

## What went well in process

- **Codified adversarial review held.** The Ship 1.1 pre-push review (5 lenses → adversarial verify) found exactly one real gap (an untested empty-skill-name filter), which was fixed *in code*, not explained away — and correctly rejected three non-issues with sound reasoning.
- **Gate-denominator discipline.** All new tests landed in existing `src/` suites (plus one new file covered by the same `npx vitest run`), so the pre-tag-gate stayed at 20 steps — no denominator re-normalization.
- **Scope held to the operator decision.** 5.1a + 5.1b shipped "dark"; 5.1c threshold tuning and the retention fix were deliberately left as tracked follow-ons rather than absorbed.

## What to watch

- **The capability is plumbing-restored, not suggestions-surfacing.** At single-developer signal sparsity (~0.13 Skill entries/transcript) the cluster-detector defaults (minCoActivations:5, stabilityDays:7) will very likely never fire. 5.1c (threshold tuning) is effectively required for *visible* output, and `observation.mine_active_skills` must be flipped on first (a deliberate later rung).
- **The retention F4 debt must not be silently closed.** Until the substrate is made outcome-driven (`docs/retention-substrate-outcome-driven-debt.md`), never run `--apply` or a recurring calibration tick — a non-null `lastTick` on the current corpus is false vindication.
- **Transcript-schema assumption.** Skill-mining assumes the live `message.content[]` nesting + `input.skill` shape; the default-OFF flag is the mitigation if the schema shifts.
