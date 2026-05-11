# 04 — Forward Lessons: v0.0.1 Synthetic Cleanup Fixture

Lessons emitted from this synthetic fixture milestone, to be applied at future ship pipelines.

## Lesson #10001-fixture — plain-bullet lesson format is a valid entry form

**Context.** The cleanup-mission rubric originally counted only numbered lists, bold-lead bullets
(- **text**), and formal #ID section headings as lesson entries. Plain prose bullets (- text without
bold lead-in) were not recognized, causing v1.49.634's lessons_learned dimension to score 0.

**Lesson.** The markup format of a lesson entry is orthogonal to its content quality. A well-written
plain-bullet lesson is structurally equivalent to a formal #ID entry for rubric purposes. The rubric
should reward substance, not enforce a specific markdown style.

## Lesson #10002-fixture — Lesson-suffix headings must be recognized

**Context.** v1.49.634's chapter/04-lessons.md used "## Lesson #10168-followup — ..." headings to
indicate follow-up lessons that extend prior formal lessons. The original hashIds regex matched only
"## #10168 — ..." (bare ID) not "## Lesson #10168-followup" (Lesson-prefix + suffix).

**Lesson.** Follow-up lessons are a natural evolution of the lesson corpus. When a prior lesson is
revisited or extended in a subsequent milestone, the follow-up notation should be recognized as a
lesson entry. The rubric's hashIds pattern was extended to match "## Lesson #NNNNN..." headings.

## Lesson #10003-fixture — freeform retrospective headings convey identical structural intent

**Context.** The v1.49.634 retrospective chapter used "What went unusually well" and "What went less
well" rather than the canonical "What Worked" and "What Could Be Better". The scorer only recognized
the canonical form, awarding 0 points for both sub-sections.

**Lesson.** Retrospective sub-section headings should be matched on semantic intent (positive / negative)
rather than exact wording. "What went unusually well" communicates the same intent as "What Worked".
The rubric was extended to accept common paraphrases of both canonical headings.

## Lesson #10004-fixture — scoreForwardLessonsBlock floor of 2 is inappropriate when bullets exist

**Context.** scoreForwardLessonsBlock found the "Forward lessons emitted" section in v1.49.634's README,
counted 0 formal #ID lesson refs, and returned 2 (the floor for "section found"). But the section had
4 well-written plain bullets that are structurally equivalent to formal lesson entries.

**Lesson.** When a Forward Lessons section exists and contains plain prose bullets describing lessons,
those bullets should count as lesson-entry proxies. The function now awards 8 points for ≥4 plain bullets,
5 points for ≥2 bullets, 3 points for ≥1 bullet — all above the previous floor of 2.

## Lesson #10005-fixture — synthetic fixtures must exercise all rubric dimensions

**Context.** The first version of this synthetic fixture scored C/72 because the chapter summary section
used a heading format that the corpus-builder's demotion logic reduced to h3, which the summary-aggregator
regex only matches at h2. The h1-title chapter structure (# Title with ## subheadings) demotes to h2+h3,
while the scorer's regex anchors at h2 (##). A chapter whose summary is at h2 (demotes to h3) is missed.

**Lesson.** Synthetic fixtures must be authored with awareness of the corpus-builder's heading-demotion
logic. If a chapter's summary content should be detected at h2 level (##) in the combined corpus, the
chapter must place that content at h1 (# ) level in the original file, so after one-level demotion it
lands at h2. The canonical pattern is to use # as the chapter title and ## for major sections.
