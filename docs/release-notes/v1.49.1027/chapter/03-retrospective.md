# v1.49.1027 — Retrospective

## What went right

- **The outcome is real, not theater.** Both possible tick results occurred and both were honest: the
  amiga corpus produced an overwhelming statistical case (mean −1.000, evidence 1808) and moved; the
  retention corpus met the bidirectional guard *precondition* but not the e-process bar (5.08 < 40) and
  HELD. The system declined the move the audit half-expected it to make — exactly the anti-theater
  behavior v980–983 was built to guarantee.
- **The brain→actuator gap closed with the established recipe.** The 8th threshold wire reused the
  per-threshold pattern (evidence loader + e-process + apply writer + audit log) with zero new
  architecture; the cadence checker recognized it as wired (8/8) the same hour it landed.
- **Honest widening over threshold-lowering.** Component C raised co-activation yield 10 → 14 of 194
  sessions purely by observing a signal that was always there (slash-command activations); the
  `minCoActivations`/`recencyDays` bars were not touched.

## What went well in process

- Design-pass-first (the D4 lesson): `.planning/SHIP-v1.49.1027-DESIGN.md` written before any code;
  both build agents executed it with zero scope drift and three declared, sound deviations.
- Bounded sub-agent dispatch: two agents, one component each (92 and 40 tool uses), commit-per-deliverable,
  full discipline pack compliance (no trailers, explicit staging, no push).
- Ground-truth-before-code: component C's agent verified the real `<command-name>` transcript shape
  (user-type string content only) before writing the extractor, avoiding the string-pattern-blindness
  error class the 2026-06-09 audit's refuters caught twice.
- The meta-cadence verify-axis flagged the new threshold's missing e2e test the same session it was
  born; the test shipped in the same milestone instead of becoming deferred debt.

## What to watch

- **`amiga.min_sequence_count` is now 3 (operator-applied).** The next `skill-creator amiga --corpus`
  run is the validation event: the generic two-tool-pair class should stop surfacing. If high-value
  sequence candidates ALSO disappear, the e-process can walk the threshold back on accept evidence —
  watch the suggestion queue rather than pre-judging.
- **Retention HOLD is evidence-bounded, not final.** 39 observations at mean −0.33; the e-process is
  anytime-valid, so future retention events simply extend the same martingale. Re-tick opportunistically
  (e.g., at the 5.1c re-audit window ~2026-06-19 → 07-03).
- **Co-activation pairs still need ≥2 skills per session.** Yield widening is necessary but may not be
  sufficient; if the 5.1c re-audit still finds 0 pairs, the next honest widening is hook-observed
  context injections — NOT threshold-lowering. The degenerate tool-tracker.sh (event:unknown — written
  against env vars the hook runtime never sets) is a named hygiene-ship candidate.
- The 1 attribution_cluster dismissal is insufficient evidence for its knob; let verdicts accrue.
