# 00 — Summary: v0.0.1 Synthetic Cleanup Fixture

This is a synthetic fixture for testing the cleanup-mission rubric introduced in v1.49.634 C4.2 and
recalibrated in v1.49.635 C5. It exercises all five scoring dimensions that differ between the cleanup
rubric and the default structured rubric: summary prose depth, components listed, retrospective sub-structure
with freeform headings, lessons via plain-bullet format, thread state markers, engine-state-unchanged marker,
and forward lessons block with prose-only bullet format rather than formal ID enumeration.

The fixture uses the v1.49.634 documentation style where the "Forward lessons emitted" section in the
README lists lessons as plain prose bullets rather than formal #ID entries. This exercises the plain-bullet
acceptance added in v1.49.635 C5 to scoreCleanupLessons and scoreForwardLessonsBlock. The retrospective
chapter uses "What went unusually well" and "What went less well" headings rather than the canonical
"What Worked" and "What Could Be Better", exercising the freeform heading acceptance added to
scoreCleanupRetrospective in the same C5 recalibration pass.

The purpose of synthetic calibration fixtures is to verify rubric scoring stability across format variants.
Real release notes for cleanup milestones vary in their authoring style: some milestones use formal lesson
ID headers, others use plain prose bullets. Some retrospectives use canonical headings, others use freeform
phrasing that conveys identical intent. The rubric should accept both forms and award equivalent scores
for equivalent structural completeness, regardless of the specific markdown formatting chosen.

The C5 recalibration was motivated by the drift-check alert at v1.49.634 ship, which reported a
recent-20 average of 85.2 against a historical baseline of 97.4 (a -12.2 delta). Stage 1 diagnosis
confirmed that v1.49.634 scored D/64 under the cleanup rubric due to two specific failures: first, the
lessons_learned dimension scored 0 because the chapter used plain-prose bullets and Lesson-suffix headings
that the pre-recalibration regex did not recognize; second, the infrastructure_block dimension scored 2
(the floor value for "section found, no IDs") because the Forward Lessons section used plain prose
bullets rather than formal #NNNNN ID references.

The recalibration applied three targeted changes: plain bullets (- text without ** bold) are now counted
as lesson entries in scoreCleanupLessons; Lesson-prefix headings with any suffix (## Lesson #10168-followup)
are matched by the extended regex; and scoreForwardLessonsBlock now counts plain bullets as lesson-entry
proxies when a Forward Lessons section exists but contains no formal #ID references. A fourth change
extended scoreCleanupRetrospective to recognize freeform heading variants like "What went unusually well"
and "What went less well" that were introduced in v1.49.634's chapter/03-retrospective.md.

The conservative tuning rule from the C5 spec was applied: since Stage 1 diagnosis confirmed the scoring
failure was a rubric gap (not real quality regression), recalibration was warranted. The rubric correctly
penalizes NASA-degree milestones when graded under the cleanup rubric, verifying that the shape distinction
is preserved. v1.49.633 and v1.49.611 both score F under the cleanup rubric despite their correct grades
under the degree rubric.

Four components organized across two waves: C01 the first operational gate (deterministic block on bad
actor tool calls), C02 the second gate (pre-push completeness check enforcing 5-file release-notes
structure), C03 template hygiene (scorer regex unify plus scorer regression test additions), and C04
cross-repo posture cleanup (deprecated env-var path deprecation, gitattributes update). Plus an integration
meta-test in W3-stage-1 asserting the new gates block on intentional violations. The milestone gates
itself at ship time — pre-tag-gate runs the new completeness gate against this milestone's own release-notes
before the tag lands, proving the gate is integrated and not just authored.

The engine state is UNCHANGED throughout this milestone. No NASA degree content, no MUS degree content,
no ELC degree content, no SPS species content, no TRS pack content was advanced. The cleanup milestone
exclusively addresses operational debt accumulated across prior forward-cadence ships. This is the defining
property of a counter-cadence cleanup milestone: the engine stays at its prior state while the operational
layer is hardened and debt is cleared.

Rubric calibration is an ongoing process. Each new cleanup milestone may introduce documentation format
variants that the current rubric does not recognize. The process for handling this is: first, run the
rubric against the new milestone and observe the score; second, diagnose any unexpected score by tracing
each dimension's value and identifying which patterns fail to match; third, decide whether the failure
represents real quality regression (rubric is correct, milestone is under-documented) or a rubric gap
(rubric misses a valid format variant); fourth, if a rubric gap is confirmed, recalibrate the specific
affected dimension with the minimum change needed to recognize the new format; fifth, add a fixture-based
test asserting the recalibrated behavior; sixth, verify that the calibration invariants (NASA milestones
still penalized, empty fixtures still score low) remain intact.

This fixture is itself a calibration artifact. Future developers extending the cleanup rubric should add
a companion synthetic fixture that exercises the new behavior, following the same structure as this file.
The fixture corpus (README.md + chapter/*.md) is authoritative for the test; the test file at
tools/release-history/__tests__/score-completeness-c5.test.mjs describes the invariants in terms of
dimension values and grade boundaries rather than specific score values, so the fixture can be updated
without changing the test expectations as long as the invariants remain satisfied.
