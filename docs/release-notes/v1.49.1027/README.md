---
title: "v1.49.1027 — Loop-Outcome Ship: First Evidence-Driven Calibration Tick, Dismissal-Feedback Actuation, Co-Activation Widening"
version: v1.49.1027
date: 2026-06-10
cadence_advances: [consume, calibrate, verify]
summary: >
  Ship 1 of AUDIT-2026-06-09: the first ship that makes a v1.0-implied loop OUTCOME true rather than
  enabled. The amiga dismissal-verdict feedback loop is wired brain-to-actuator (8th calibratable
  threshold, amiga.min_sequence_count) and produced the project's first evidence-driven threshold move
  on real operator data (2 -> 3, e-process evidence 1808 at alpha 0.05, operator-applied). The first
  real retention tick ran end-to-end on the 26:13 bidirectional corpus and returned a principled HOLD.
  Co-activation mining widened to slash-command activations, lifting real-corpus session yield 10 -> 14
  of 194 with zero threshold-lowering.
tags: [loop-outcome, bounded-learning, calibration, amiga, co-activation, audit-ship-1]
---

# v1.49.1027 — Loop-Outcome Ship: First Evidence-Driven Calibration Tick, Dismissal-Feedback Actuation, Co-Activation Widening

**Shipped:** 2026-06-10

One-line: the adaptive-learning loop produced its first realized outcome — a threshold moved because statistically-sound evidence from real operator decisions said it should.

## Why this ship

AUDIT-2026-06-09 §10 ship 1 (operator-authorized 2026-06-10). The audit's headline strategic finding: the
loop's *activity* plateau broke in Era G but its *outcome* plateau held — zero accepted suggestions, zero
evidence-driven threshold moves, zero co-activation pairs. Three zeroes, three components, all routed through
the existing bounded-learning e-process with its anti-theater constraints (no threshold-lowering, no
synthesized volume, dry-run default, operator-gated `--apply`). Design pass: `.planning/SHIP-v1.49.1027-DESIGN.md`.

## What shipped

- **Dismissal-feedback actuation (component B).** The 21-verdict amiga dismissal corpus was a
  stored-but-unconsumed calibration signal: the e-process brain existed but no detector listened. Now:
  config key `amiga.min_sequence_count` (zod, [1,20], default 2); `SkillCandidateDetector` takes
  `minSequenceCount` replacing the hardcoded `count >= 2` sequence_repetition bar; the amiga CLI threads
  the live config value through both single-session and corpus paths; `bounded-learning` gains the 8th
  calibratable threshold with evidence = suggestions.json verdicts tagged `[source: AMIGA sequence_repetition]`.
- **First evidence-driven threshold move ever.** Real tick on the 20-dismissal corpus: mean −1.000,
  e-process evidence **1808.04 ≥ 40** (= 1/α at α 0.05), direction INCREASE, proposed 2 → 3. Operator
  applied 2026-06-10T20:14:59Z (`bounded-learning-log.jsonl`, `applied:"applied"`). Future amiga corpus
  runs stop emitting the generic two-tool-pair candidate class the operator dismissed 20/20.
- **First real retention tick (component A).** `observation.retention_days` ticked on the now-bidirectional
  26 too_aggressive : 13 too_lax corpus — the v983 Tier-2 apply-guard's precondition met for the first time.
  Outcome: **HOLD** (max one-sided evidence 5.0784 < 40). No move — and that is the honest result the
  anti-theater design exists to produce. The loop ran end-to-end on real data; the audit log records it.
- **Co-activation widening (component C).** `TranscriptParser.extractActiveSkills` now also mines
  slash-command activations (`<command-name>` tags in user string-content entries; 15-builtin denylist;
  source-grounded against real transcripts), behind the existing `observation.mine_active_skills` flag.
  Real-corpus yield: 10 → 14 of 194 sessions with activation signal — honest widening of the observable,
  thresholds untouched (`minCoActivations: 2`, `recencyDays: 30` unchanged).
- **Verify-axis closure in-ship:** dedicated `tests/integration/amiga-min-sequence-end-to-end.integration.test.ts`
  structurally wiring substrate → calibration → apply → detector consumption, added the same day the
  meta-cadence checker first flagged the new threshold's missing e2e test.

## Verification

- Component tests: 9 config schema + 6 detector option + 9 CLI branch (B); 26 transcript-parser incl.
  13 new widening tests (C); 304/304 touched-module tests green; ProcessContext + LoaderContext security
  audits green (2,119); end-to-end integration test green.
- Adversarial ship review (T14 step P, Workflow `wf_7ec8d837-9d6`) run pre-push against v1.49.1026..HEAD.
- Real dry-runs recorded in `.planning/patterns/bounded-learning-log.jsonl` (retention HOLD; amiga
  INCREASE applied). `skill-creator cadence` confirms 8/8 thresholds wired, 0 genuinely-unwired.
- Pre-tag-gate 21/21 before tag (see chapter/00-summary Verification).

## Engine state

NASA degree **1.217**, counter-cadence **29**, manifest lessons **152** — UNCHANGED (code ship).
cadence_advances: **consume** (8th threshold wired with live caller), **calibrate** (first real tick +
first applied evidence-driven move), **verify** (dedicated substrate→calibration e2e test).
