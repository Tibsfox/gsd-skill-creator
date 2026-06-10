# v1.49.1027 — Summary

## The ship

AUDIT-2026-06-09 §10 ship 1, the loop-outcome ship. Targets the audit's strategic frontier — the loop's
three zeroes (0 thresholds moved, 0 accepted suggestions consumed, 0 co-activation pairs) — and converts
the first of them into a realized outcome: **the project's first evidence-driven threshold move on real
operator-decision data** (`amiga.min_sequence_count` 2 → 3, e-process evidence 1808.04 ≥ 40 at α 0.05,
operator-applied 2026-06-10). Design pass at `.planning/SHIP-v1.49.1027-DESIGN.md`; all applies routed
through the bounded-learning dry-run-default / operator-gated `--apply` discipline.

## What shipped

- **B — dismissal-feedback actuation:** `amiga.min_sequence_count` config key ([1,20], default 2);
  `SkillCandidateDetector.minSequenceCount` replaces the hardcoded sequence_repetition `count >= 2`;
  amiga CLI threads the live config value; `bounded-learning` 8th calibratable threshold with
  `[source: AMIGA sequence_repetition]` verdict evidence. Real tick: 20/20 dismissals → INCREASE 2→3 → APPLIED.
- **A — first real retention tick:** `observation.retention_days` on the 26:13 bidirectional corpus →
  principled **HOLD** (evidence 5.0784 < 40). The machinery's first end-to-end run on real data.
- **C — co-activation widening:** `extractActiveSkills` additionally mines `<command-name>` slash-command
  activations (user string-content entries, 15-builtin denylist, grounded on real transcript shape);
  corpus yield 10 → 14 of 194 sessions; co-activation thresholds untouched.
- **Verify-axis e2e:** `tests/integration/amiga-min-sequence-end-to-end.integration.test.ts` — substrate →
  calibration → apply → detector consumption, no mocks.

## Verification

304/304 touched-module tests; 26 transcript-parser tests (13 new); ProcessContext + LoaderContext audits
green (2,119); integration e2e green; adversarial ship review (Workflow `wf_7ec8d837-9d6`) pre-push;
real tick outcomes audit-logged in `.planning/patterns/bounded-learning-log.jsonl`; `skill-creator cadence`
reports 8/8 calibratable thresholds wired; pre-tag-gate 21/21 at tag time.

## Engine state

NASA degree **1.217**, counter-cadence **29**, manifest lessons **152** — UNCHANGED (code ship).
cadence_advances: [consume, calibrate, verify].
