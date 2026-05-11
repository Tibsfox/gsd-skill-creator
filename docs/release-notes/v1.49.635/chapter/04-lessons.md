# 04 — Forward Lessons: v1.49.635 Housekeeping Cluster

Lessons emitted from this milestone, to be applied at future ship pipelines.

## Lesson #10175 — plain-bullet lesson format is a valid and recognized entry form

**Context.** v1.49.634 scored 0 on `lessons_learned` because its chapter/04-lessons.md used plain prose
bullets (- text) and Lesson-suffix headings (## Lesson #10168-followup — ...) that the pre-v1.49.635
rubric did not recognize. The plain-bullet form is natural for cleanup milestones where lessons are
authoring-time prose observations, not formal numbered entries.

**Lesson.** The cleanup rubric should recognize both structured (#ID heading) and prose (plain bullet)
lesson formats equally. Authors should choose whichever format communicates the lesson clearly; the
rubric should not impose a specific markdown style as a prerequisite for scoring.

**Resolved in.** v1.49.635 C5 (scoreCleanupLessons extended).

## Lesson #10176 — scoreForwardLessonsBlock floor-of-2 collapses score when plain bullets used

**Context.** The pre-v1.49.635 `scoreForwardLessonsBlock` returned 2 (floor) when a "Forward lessons
emitted" section existed but contained 0 formal #ID refs. v1.49.634's Forward Lessons section had 4
well-written plain bullets and 0 #IDs, receiving 2 out of 13 possible points.

**Lesson.** When a scored section exists and contains plain prose entries, the floor should be above the
"section exists but is empty" score. The 4-plain-bullets → 8 tier added in v1.49.635 C5 prevents the
floor-of-2 collapse while remaining lower than the formal-#ID tiers (ensuring formal IDs are still
preferred for maximum credit).

**Resolved in.** v1.49.635 C5 (scoreForwardLessonsBlock extended).

## Lesson #10177 — freeform retrospective headings convey identical structural intent

**Context.** v1.49.634's chapter/03-retrospective.md used "What went unusually well" and "What went
less well" (freeform phrasing) rather than "What Worked" / "What Could Be Better" (canonical). The
scorer only recognized canonical forms; v1.49.634 lost 5 points on `retrospective_structure`.

**Lesson.** Retrospective sub-section headings communicate "positive outcome" and "negative outcome".
Any phrasing that conveys these semantics should be accepted. The rubric was extended with pattern
alternatives matching the v1.49.634 style.

**Resolved in.** v1.49.635 C5 (scoreCleanupRetrospective extended).

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

## Lesson #10180 — meta-tests must skip-guard against gitignored runtime artifacts

**Context.** The v1.49.634 C8 meta-test at `tests/integration/v1-49-634-meta-test.test.ts:118` + `:141`
asserts `expect(result.status).toBe(0)` for a subprocess spawn of
`.claude/hooks/self-mod-guard.js`. The hook is gitignored at `.gitignore:9` (all of `.claude/` is
excluded) and installed locally by `project-claude/install.cjs` at workspace setup time. CI runners do
not execute that install step, so the hook is absent on CI; the subprocess spawn returns exit code 1
and the assertion fails. The meta-test passed locally (where the hook is installed) and failed silently
in CI for 19 forward-cadence milestones until the v1.49.635 W3 G3 pre-tag-gate composite (step 4/9
"CI-on-dev verification") surfaced the predecessor `d4ffa4f32` CI red as a ship blocker.

**Lesson.** Any meta-test that exercises a deploy-installed-only artifact — gitignored hooks,
locally-generated config files, environment-specific binaries — MUST `existsSync()` skip-guard ahead of
the subprocess invocation. The test should still verify the assertion when the artifact is present
(local dev path) and gracefully skip when absent (CI path). Failing to skip-guard means CI red on the
predecessor permanently blocks downstream ship pipelines from a real defect that's invisible to
isolated local runs.

**Applied to.** `tests/integration/v1-49-634-meta-test.test.ts` (skip-guard via
`it.runIf(HOOK_AVAILABLE)` at the two C4 self-mod-guard tests, where
`HOOK_AVAILABLE = existsSync(HOOK_PATH)` is computed at module scope).

**Resolved in.** v1.49.635 W3 G3 inline stabilization (commit `327b4e235`); demonstrates the v1.49.635
C4 fragile-test-pattern.md Template-3 (full-manifest skip-guard) on the test that surfaced its need.

**Pattern template.** `const ARTIFACT_AVAILABLE = existsSync(ARTIFACT_PATH);` at module scope; gate the
artifact-dependent tests with `it.runIf(ARTIFACT_AVAILABLE)(...)`. Document the runtime-install context
in a comment naming the gitignore rule + the installer that produces the artifact.

## Lesson #10181 — perf-assertion audits need regex coverage of relative-ratio assertion forms

**Context.** v1.49.635 C3 audited the suite for sharp-threshold perf assertions using a 7-regex set
keying on `latency` / `p95` / `p99` / `performance.now` / `duration` / `throughput` / `qps` /
`opsPerSec` identifier names. The audit surfaced 31 sites, fixed top-8, and documented 9 for follow-on.
At ship time, two additional pre-existing perf flakes surfaced during the full-suite pre-tag-gate run
that the C3 audit had missed: `src/intelligence/analyzer/__tests__/performance.test.ts` used
`expect(mean).toBeLessThan(N)` with a generic `mean` variable, and
`src/intelligence/atlas-indexer/__tests__/runner.test.ts:481` used `expect(t4).toBeLessThan(t1 * 5)` —
a relative-ratio form rather than an absolute-threshold form. Both passed in isolation but failed
under full-suite contention; both pre-existed v1.49.635 by 19+ milestones.

**Lesson.** Perf-assertion audits need regex coverage of TWO assertion shapes:
1. **Absolute-threshold:** `expect(<identifier>).toBeLessThan(<numeric-literal>)` — caught by v1.49.635 C3.
2. **Relative-ratio:** `expect(<identifier>).toBeLessThan(<identifier> * <numeric-literal>)` — MISSED by v1.49.635 C3.

The relative-ratio form is jitter-prone in a different way than the absolute form: when the divisor is
small (sub-50ms), measurement jitter dominates the ratio and the assertion fails under contention even
though the underlying behavior is correct. Future audits should grep both shapes and apply per-site
analysis to the relative-ratio sites separately (often the right fix is widening the multiplier OR
adding an absolute-time floor like `if (t1 < 50) skip`).

**Resolved in.** v1.49.635 W3 G3 inline stabilization (commits `bbde73555` analyzer + `90c3d8cbb`
atlas-indexer). Carry-forward: extend C3 audit regex set in v1.49.651 to catch
`expect\([^)]+\)\.toBeLessThan\([^)]+\s*\*\s*\d+\)` and `expect\(mean\b` patterns.

**Pattern template.** When designing a grep-based audit, enumerate the syntactic shapes of the pattern
to audit + assertion-name variants + identifier-name variants; the audit's regex set should cover the
Cartesian product. A missed shape compounds across milestones because the missing pattern stays
invisible until contention surfaces it.
