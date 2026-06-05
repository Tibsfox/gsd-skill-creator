# v1.49.980 — Lessons

No new manifest lesson promoted. This is a forward Phase-5 feat that applies
existing lessons; manifest lesson count stays **152**.

## Applied (existing lessons)

- **#10463 (staged promotion):** the new capability ships behind a default-OFF flag (`observation.mine_active_skills`), with a flag-OFF byte-identical guarantee — the capability lands "dark," to be flipped on in a later deliberate rung.
- **#10461 (gate-denominator discipline):** all new tests landed in existing `src/` suites (plus one new file covered by the same `npx vitest run` step), so the pre-tag-gate stayed at 20 steps — no denominator re-normalization.
- **Ship 1.1 (adversarial pre-push review):** ran the 5-lens review on the diff; fixed the one confirmed REAL finding (untested empty-skill-name filter) in code rather than explaining it away.
- **Design-before-build (D4 resolution):** picked the mechanism with a read-only design panel + adversarial verification before writing any code; re-verified the 2026-06-03 audit premises against current HEAD (one was stale).
- **#10462 (describe, don't quote, guarded literals):** the F4 debt doc and release notes describe the degenerate-signal mechanics without reproducing trip-vocab or scaffold markers.

## Process notes

- **Premise re-verification has a shelf life.** An audit premise written ~14 milestones earlier (`// Not provided by Claude Code`) was false on the current harness. Re-checking load-bearing premises against live code before acting on a plan is cheap insurance.
- **One bug, multiple victims.** The PatternStore-envelope read bug existed identically in two readers (suggest path + dashboard). Grepping for the *pattern* of the bug, not just the reported site, turned a one-line fix into a two-surface restore.
- **Track the trap, don't spring it.** When a candidate (calibration) is gated by a degenerate signal, the right move is to record the pre-req as explicit debt — not to tick the signal to make the metric move.
