# v1.49.1027 — Lessons

No new manifest lesson promoted this ship. One candidate observed (below); manifest holds at 152.

**Lesson candidate (1st observation):** *"An apply-guard precondition is not a recommendation."* The
audit treated "26:13 satisfies the bidirectional guard" as near-synonymous with "the first threshold
move is imminent"; the actual e-process verdict was HOLD (5.08 < 40). Guards gate *whether an apply is
permitted*; the e-process decides *whether a move is warranted*. Conflating the two layers in planning
prose overstates imminence. Promote if observed again.

## Applied (existing lessons)

- **Anti-theater calibration discipline (v980–983 arc):** dry-run default, operator-gated `--apply`,
  audit-logged both outcomes — applied verbatim for both ticks.
- **Calibrate-axis write-side wire recipe:** the 8th threshold reused the established
  loader/e-process/apply/audit pattern; no bespoke machinery.
- **#10463 staged-promotion shape:** detector default unchanged (2) at code level; the move to 3 happened
  through the calibration channel as operator-local config, not a hardcoded flip.
- **Design-pass-first (D4):** design doc preceded dispatch; deviations declared in agent final messages.
- **Chokepoint discipline (ProcessContext/LoaderContext):** both audits run by every agent; no new
  loader-named fs importers; no child_process.
- **Sub-agent dispatch discipline (v973 rewrite):** bounded one-component dispatches at 92/40 tool uses,
  comfortably inside the reaffirmed ~60–70 band for the heavier one.

## Process notes

- The bounded-learning CLI's "threshold must exist in config" behavior is recipe-consistent (config
  presence = calibration surface) but surprised the orchestrator; the operational fix (seed the key at
  its current default in `.planning/skill-creator.json`) is now precedented for future threshold wires.
- `skill-creator cadence` proved its worth as a ship-time checklist: it surfaced the verify-axis e2e gap
  AND confirmed consume-axis closure (8/8) within minutes of the wire landing — run it during every
  loop-adjacent ship, not just at counter-cadence opens.
- Real-corpus probes (the 10 → 14 yield numbers) belong in agent final messages and release notes, not
  in tests: they document honest value without coupling tests to mutable operator data.
