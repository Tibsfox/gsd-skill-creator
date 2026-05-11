# 04 — Forward Lessons: v1.49.650 Housekeeping Cluster

Lessons emitted from this milestone, to be applied at future ship pipelines.

## Lesson #10175 — plain-bullet lesson format is a valid and recognized entry form

**Context.** v1.49.634 scored 0 on `lessons_learned` because its chapter/04-lessons.md used plain prose
bullets (- text) and Lesson-suffix headings (## Lesson #10168-followup — ...) that the pre-v1.49.650
rubric did not recognize. The plain-bullet form is natural for cleanup milestones where lessons are
authoring-time prose observations, not formal numbered entries.

**Lesson.** The cleanup rubric should recognize both structured (#ID heading) and prose (plain bullet)
lesson formats equally. Authors should choose whichever format communicates the lesson clearly; the
rubric should not impose a specific markdown style as a prerequisite for scoring.

**Resolved in.** v1.49.650 C5 (scoreCleanupLessons extended).

## Lesson #10176 — scoreForwardLessonsBlock floor-of-2 collapses score when plain bullets used

**Context.** The pre-v1.49.650 `scoreForwardLessonsBlock` returned 2 (floor) when a "Forward lessons
emitted" section existed but contained 0 formal #ID refs. v1.49.634's Forward Lessons section had 4
well-written plain bullets and 0 #IDs, receiving 2 out of 13 possible points.

**Lesson.** When a scored section exists and contains plain prose entries, the floor should be above the
"section exists but is empty" score. The 4-plain-bullets → 8 tier added in v1.49.650 C5 prevents the
floor-of-2 collapse while remaining lower than the formal-#ID tiers (ensuring formal IDs are still
preferred for maximum credit).

**Resolved in.** v1.49.650 C5 (scoreForwardLessonsBlock extended).

## Lesson #10177 — freeform retrospective headings convey identical structural intent

**Context.** v1.49.634's chapter/03-retrospective.md used "What went unusually well" and "What went
less well" (freeform phrasing) rather than "What Worked" / "What Could Be Better" (canonical). The
scorer only recognized canonical forms; v1.49.634 lost 5 points on `retrospective_structure`.

**Lesson.** Retrospective sub-section headings communicate "positive outcome" and "negative outcome".
Any phrasing that conveys these semantics should be accepted. The rubric was extended with pattern
alternatives matching the v1.49.634 style.

**Resolved in.** v1.49.650 C5 (scoreCleanupRetrospective extended).

## Lesson #10178 — synthetic fixture authoring requires awareness of corpus-builder heading demotion

**Context.** The first version of the C5 synthetic fixture scored C/67 instead of ≥ B because the
chapter summary heading was at h2 level (demoted to h3 by the corpus-builder), while the Summary
aggregator regex anchors at exactly h2 (##). The fix is to place chapter Summary content at h1 level
so after one-level demotion it lands at h2.

**Lesson.** Synthetic calibration fixtures must be authored with awareness of the corpus-builder's
one-level heading demotion rule. Chapter h1 → corpus h2; chapter h2 → corpus h3; etc. Summary
content that should be detected at h2 level must be at h1 in the chapter file.

**Applied to.** `tests/fixtures/release-notes-rubric-cleanup/chapter/00-summary.md` (uses h1 heading
so after demotion it lands at h2, matching the Summary aggregator regex).

## Lesson #10179 — the two-phase halt-and-spec pattern is clean for under-specified components

**Context.** C2 (Tauri CLI gap) was halted at Stage 1 when diagnosis revealed a gap in the spec's
assumptions about the CLI surface. Rather than proceeding with a partial or speculative implementation,
the component was halted and a pre-mission spec was authored for v1.49.651.

**Lesson.** When Stage 1 diagnosis reveals a spec gap (not a scope change, but a factual gap in the
original assumptions), halt the component and author a pre-mission spec. The halt is not a failure;
it is a scope discipline decision. The pre-mission spec is the deliverable. The next cleanup milestone
picks up the spec and implements against clear requirements, avoiding the technical debt that comes
from implementing against an under-specified gap.

**Pattern template.** (1) Stage 1 diagnosis; (2) spec gap identified; (3) halt component; (4) author
pre-mission spec at `.planning/missions/<next-milestone>-<component>/`; (5) return "HALTED" status
to orchestrator with pre-mission spec path as the deliverable reference.
