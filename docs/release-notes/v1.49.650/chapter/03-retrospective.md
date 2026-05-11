# 03 — Retrospective: v1.49.650 Housekeeping Cluster

## Carryover lessons applied

- **Lesson #10168** (counter-cadence cleanup pattern): this milestone IS the cadence-pattern execution
- **Lesson #10169** (gate-not-vigilance): all 8 components deliver deterministic gates or tools (not prose rules)
- **Lesson #10170** (meta-test strategy): C8 integration meta-test exercises all new gates against intentional violations
- **Lesson #10171** (architectural correction mid-mission): C2 halted when spec revealed a gap; pre-mission spec authored
- Reachability-audit template from v1.49.634 C3: applied to C1 keystore encryption path verification

## What went unusually well

C5 rubric recalibration was unusually clean. Stage 1 diagnosis took 30 minutes of tooling analysis and
precisely identified two rubric gaps. The three targeted fixes each addressed one specific failure mode
without over-reaching. All 14 new tests pass; the 29 existing tests are unaffected. The calibration
invariants (v1.49.585 ≥ B, v1.49.634 ≥ B, NASA-degree < 80 under cleanup rubric) were verified before
and after each change.

The conservative tuning rule was critical: without it, there would be temptation to over-calibrate
(raise weights until recent-20 reaches 90 immediately) rather than fixing the specific rubric gaps.
Stage 1 confirmed the gaps were real, making calibration warranted. Had the gaps not existed (real
quality regression), the conservative rule would have preserved the signal intact.

C1 keystore encryption went cleanly. The Rust AES-256-GCM implementation is straightforward using
`chacha20poly1305` crate; the keyring backend via `keyring` crate handles OS keychain integration
transparently. Migration logic (v1 → v2 with backup-first) follows the same pattern as the v1.49.634
`insecure-plaintext-keystore` feature gate. No surprises.

## What went less well

C2 was halted at Stage 1. This is the correct outcome per the spec decision tree, but it extends the
cleanup debt horizon. The pre-mission spec for v1.49.651 is a good forward-handoff mechanism, but the
debt remains open until the next cleanup milestone ships the implementation.

The synthetic fixture for C5 required three iterations to score ≥ B: first version scored C/67 due
to a heading-demotion issue (chapter h2 → h3 after corpus-builder demotion, not matching the h2 regex),
second scored C/72 after fixing heading structure but still under 800 words in summary, third scored
B/80 after adding a chapter/04-lessons.md with 5 lesson entries. The fixture-authoring process revealed
a non-obvious interaction between the corpus-builder's heading-demotion and the scorer's heading-level
anchoring. Future fixture authors should be aware: chapter headings demote by one level.

## Process observations

Three process observations from this cluster:

The two-phase fixture-authoring approach worked well: start with a minimal inline test (fast feedback),
then build the proper on-disk fixture (catches corpus-builder interactions). The inline test found
the rubric gap quickly; the on-disk fixture confirmed the corpus-builder behavior.

C5's plain-bullet acceptance was the highest-ROI change in the cluster: one regex fix and one fallback
path unlock recognition of an entire lesson-documentation style that v1.49.634 used throughout its
chapter. The -12.2 drift-check delta collapses to near-zero once both cleanup milestones score correctly.

The spec decision tree for C2 (halt when gap confirmed) worked exactly as intended. The pre-mission
spec pattern is a clean forward-handoff: the next cleanup milestone can pick up C2's spec and implement
against it without needing to re-diagnose the gap. This pattern should be documented in the cleanup
milestone template.
