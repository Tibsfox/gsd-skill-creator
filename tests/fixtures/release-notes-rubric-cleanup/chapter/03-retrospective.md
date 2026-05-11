# 03 — Retrospective: v0.0.1 Synthetic Cleanup

## Carryover lessons applied

- **Gate-not-vigilance principle** applied from prior milestone: C01 and C02 are deterministic gates,
  not prose-only rules. Each gate fires mechanically on tool calls.
- **Meta-test strategy** applied: the pre-push completeness gate C02 is exercised against this milestone's
  own release-notes during the W3 ship pipeline.

## What went unusually well

This section title uses the v1.49.634 freeform style rather than the canonical "What Worked" heading.
The cleanup rubric (v1.49.650 C5) accepts this phrasing to avoid penalizing retros that use natural
language instead of the canonical template wording.

The fixture correctly exercises the plain-bullet lesson format by listing lessons in the README's
"Forward lessons emitted" section as prose bullets rather than formal #ID entries.

## What went less well

This section title also uses v1.49.634 freeform style rather than "What Could Be Better". The
retrospective scoring accepts it via the expanded pattern added in v1.49.650 C5.

The synthetic fixture cannot test real gate execution behavior — it only exercises the scoring rubric.
Future calibration fixtures should include a chapter/00-summary.md with realistic word counts.

## Process observations

Three process observations from authoring this fixture:
1. The plain-bullet format is easier to author than the formal #ID format during rapid cleanup milestones.
2. The rubric's acceptance of plain-bullet format allows both structured and freeform lesson documentation.
3. Fixture-based tests provide better calibration assurance than score-against-live-release tests.
