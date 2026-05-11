# v0.0.1 — Synthetic Cleanup Fixture (rubric calibration)

**Released:** 2026-01-01
**Type:** counter-cadence operational-debt milestone (NOT a NASA degree)
**Predecessor:** v0.0.0 (previous forward-cadence milestone)
**Mission package:** `.planning/missions/v0-0-1-cleanup-fixture/`
**Engine state:** UNCHANGED (no NASA / MUS / ELC / SPS forward-cadence content this milestone)

## Summary

This is a synthetic fixture for testing the cleanup-mission rubric introduced in v1.49.634 C4.2 and
recalibrated in v1.49.635 C5. It exercises the five scoring dimensions that differ between the cleanup
rubric and the default structured rubric: summary prose, components listed, retrospective sub-structure,
lessons via plain-bullet format, thread state markers, engine-state-unchanged marker, and forward lessons
block with prose-only bullet format.

The fixture uses the v1.49.634 documentation style where the "Forward lessons emitted" section in the
README lists lessons as plain prose bullets rather than formal #ID entries. This exercises the plain-bullet
acceptance added in v1.49.635 C5 to scoreCleanupLessons and scoreForwardLessonsBlock.

Four components organized across two waves: **C01** first operational gate (deterministic block on bad
actor), **C02** second gate (pre-push completeness check), **C03** template hygiene (T2.1 scorer regex
unify), **C04** cross-repo posture cleanup. Plus integration meta-test in W3-stage-1.

## Cross-track / Engine state

- **No NASA / MUS / ELC / SPS forward-cadence content this milestone** — engine state UNCHANGED.
- **No new external citations** — existing citation-debt ledger unchanged.
- **No new V-flags emitted** — citation-debt ledger unchanged.
- **First synthetic calibration fixture** — used to verify rubric scoring is stable across format variants.

## Threads closed / opened / extended

- **OPENED:** deterministic operational gate C01 (pre-commit hook blocking writes to protected dirs).
- **OPENED:** pre-push completeness gate C02 (5-file release-notes structure required).
- **EXTENDED:** existing operational-gate layer (2 new gates added).
- **CLOSED:** accumulated social-rule debt in C03 + C04.
- **CARRY-FORWARD:** all predecessor thread states unchanged.

## Forward lessons emitted

New lessons authored in chapter/04-lessons.md:
- Plain-bullet lesson entry one: gate-not-vigilance discipline applies to cleanup milestones too
- Plain-bullet lesson entry two: synthetic fixtures must exercise all five cleanup rubric dimensions
- Plain-bullet lesson entry three: format variants should produce equivalent rubric scores
- Plain-bullet lesson entry four: the cleanup rubric is calibrated to B-floor for well-documented milestones

## Thread state

CHAIN-CONVENTIONS unchanged. Engine forward-state UNCHANGED. Operational-gate layer EXTENDED.

---
**Prev:** [v0.0.0](../v0.0.0/README.md) · **Next:** v0.0.2+
