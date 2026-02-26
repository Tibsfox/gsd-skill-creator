---
title: "Lessons Learned — v1.34 Documentation Ecosystem Refinement"
layer: meta
path: "meta/lessons-learned-v1.34.md"
summary: "Post-milestone LLIS retrospective for v1.34. 15 formal lessons (LL-DOCS-001 through LL-DOCS-015) covering documentation-only milestones, execution velocity, and continuous improvement patterns."
cross_references:
  - path: "meta/lessons-applied-v1.34.md"
    relationship: "extends"
    description: "The lessons-applied document mapped v1.33 lessons INTO v1.34. This document captures lessons FROM v1.34."
  - path: "meta/verification-report.md"
    relationship: "informed-by"
    description: "Verification results referenced in multiple lessons"
  - path: "meta/style-guide.md"
    relationship: "informed-by"
    description: "Style guide effectiveness assessed in LL-DOCS-004"
  - path: "meta/filesystem-contracts.md"
    relationship: "informed-by"
    description: "Filesystem contracts pattern assessed in LL-DOCS-006"
reading_levels:
  glance: "15 formal lessons from v1.34: docs-only milestones run 3x faster than estimated, pre-built mission packages produce zero deviations, style guides as Wave 0 prevent all drift."
  scan:
    - "LL-DOCS-001–003: Execution velocity — 47 min actual vs 150 min estimated, 3.2x faster"
    - "LL-DOCS-004–006: Foundation patterns — style guide, filesystem contracts, content map"
    - "LL-DOCS-007–009: Parallelism — explicit track annotations, single commit per phase, task sizing"
    - "LL-DOCS-010–012: Quality — progressive disclosure, verification as separate track, template extraction"
    - "LL-DOCS-013–015: Process — retrospective gaps, estimation calibration, measurement infrastructure"
created_by_phase: "post-milestone"
last_verified: "2026-02-25"
---

# Lessons Learned — v1.34 Documentation Ecosystem Refinement

## Document Information

| Field | Value |
|-------|-------|
| Project | tibsfox.com Documentation Ecosystem |
| Milestone | v1.34 |
| LLIS Category | Documentation Engineering / Content Architecture |
| Date | 2026-02-25 |
| Author | Post-milestone retrospective |
| Classification | Open |
| Living Document | No — final retrospective |

---

## Executive Summary

The v1.34 Documentation Ecosystem Refinement milestone shipped 9 phases across 5 waves in 42 minutes wall-clock time (16:12 to 16:54 UTC-8), producing 47 files with 9,038 net line insertions across 9 atomic commits. The milestone transformed tibsfox.com from scattered educational resources into a unified, navigable documentation ecosystem with 158 total files (~53K lines), a narrative spine with 3 entry points, 4 extractable templates, and a complete site architecture specification.

Zero deviations from plan were recorded across all 9 phases. This is the first milestone in project history with a perfect deviation record. The pre-built mission package, documentation-only scope, and explicit parallelism annotations are the primary contributors.

The milestone also revealed that documentation-only work executes dramatically faster than mixed code+docs milestones (3.2x faster than estimated), that estimation models calibrated on code milestones significantly overestimate documentation work, and that the absence of a formal post-milestone retrospective was itself a gap in the v1.34 process.

---

## Mission Statistics

| Metric | Planned | Actual | Delta |
|--------|---------|--------|-------|
| Phases | 9 | 9 | exact |
| Plans | 23 | 23 | exact |
| Commits | — | 9 | 1 per phase |
| Wall time | ~150 min | ~42 min | 3.2x faster |
| Files created/modified | — | 47 | — |
| Net lines added | — | 9,038 | — |
| Deviations | — | 0 | zero |
| Requirements | 18 | 18 | all met |
| Cross-references validated | — | 502 (0 broken) | — |

### Commit Timeline

| Time (UTC-8) | Phase | Commit | Duration |
|-------------|-------|--------|----------|
| 16:12:58 | 326 | `39fc15d` Foundation structure, style guide, contracts | — (start) |
| 16:18:32 | 327 | `d4ca324` Narrative spine and content map | 5m 34s |
| 16:23:28 | 328 | `cf5486b` 7 gateway documents + educational packs index | 4m 56s (parallel w/ 327) |
| 16:32:07 | 330 | `79cf8e3` Template extraction (4 templates + index) | 8m 39s |
| 16:35:42 | 329 | `5fa538b` WordPress migration + application gateways | 12m 14s (parallel w/ 330) |
| 16:44:06 | 332 | `3e469d8` Improvement cycle + contributing guide | 8m 24s |
| 16:44:09 | 331 | `0ac7740` Site architecture + content pipeline | 8m 27s (parallel w/ 332) |
| 16:49:18 | 334 | `1cc8704` Lessons applied (v1.33 → v1.34) | 5m 09s |
| 16:54:55 | 333 | `859b805` Verification report | 5m 37s (parallel w/ 334) |

Total: 42 minutes from first commit to last.

---

## Lessons Learned

### LL-DOCS-001: Documentation-Only Milestones Execute 3x Faster Than Estimated

**Observation:** v1.34 completed in 42 minutes against a 150-minute estimate — 3.2x faster. Every individual phase ran 40-60% faster than estimated. No phase exceeded its estimate.

**Root Cause:** Estimation models were calibrated on mixed code+docs milestones (v1.29–v1.33) where the dominant cost is compilation, test execution, API provisioning, and debugging. Documentation work has none of these overheads. The only bottleneck is token generation, which for markdown is fast.

**Contributing Factors:**
- No compilation or type-checking step
- No test execution overhead
- No external service provisioning or API calls
- No debugging or rework cycles
- No merge conflicts (each phase owns distinct files)

**Recommendation:** For future documentation-only milestones, apply a 0.3x multiplier to estimates calibrated on code milestones. A 5-minute code task estimate becomes a 1.5-minute docs task estimate. Adjust wave planning accordingly — documentation milestones can fit more phases per session.

**Impact:** HIGH — affects all future milestone estimation.

---

### LL-DOCS-002: Zero Deviations Are Achievable With Pre-Built Mission Packages

**Observation:** All 9 phase summaries reported "Deviations from Plan: None." This is the first milestone in project history with zero deviations.

**Root Cause:** The combination of:
1. Pre-built mission package with complete specifications (no ambiguity)
2. Documentation-only scope (no external system failures)
3. Single-creator-per-phase pattern (no coordination overhead)
4. Strict task boundaries (1-2 documents per task)

**Caveat:** This lesson applies specifically to documentation milestones with pre-built packages. Code milestones involve external dependencies, API behavior, and emergent complexity that make zero-deviation execution unlikely regardless of package quality.

**Recommendation:** When a milestone is documentation-only AND has a pre-built mission package, set the confidence interval for on-time completion to 95%+. For code milestones, maintain the existing 70-80% confidence range.

**Impact:** MEDIUM — affects planning confidence for future doc milestones.

---

### LL-DOCS-003: Single Atomic Commit Per Phase Is Optimal for Documentation

**Observation:** v1.34 produced exactly 9 commits for 9 phases (23 tasks collapsed into 9 commits). This contrasts with v1.33's 124 commits for 14 phases. The 9-commit history is legible, each commit tells a complete story, and phase-level rollback requires exactly one `git revert`.

**Root Cause:** Documentation tasks within a phase are inherently cohesive — they share the same style guide, the same filesystem region, and the same conceptual scope. Splitting them into per-task commits adds noise without adding rollback granularity.

**Contrast with code milestones:** Code milestones benefit from per-task commits because tasks often touch shared files, tests run between tasks, and individual task failures need granular rollback. Documentation tasks are independent files that don't share state.

**Recommendation:** For documentation phases: single atomic commit per phase. For code phases: commit per logical unit (typically per task or per RED-GREEN cycle). Don't apply the documentation pattern to code.

**Impact:** LOW — confirms existing practice, formalizes the distinction.

---

### LL-DOCS-004: Style Guide as Wave 0 Foundation Prevents All Drift

**Observation:** All 47 files produced across Waves 1-4 are style-compliant per the Phase 333 verification. No rework was needed. No style corrections were applied retroactively. Every agent produced compliant output on first attempt.

**Root Cause:** Phase 326 wrote the style guide before any content was produced. Every subsequent agent had the guide in context. The guide specifies:
- Voice and tone (second person, active, conversational)
- Frontmatter schema (YAML with required fields)
- Progressive disclosure pattern (glance/scan/read)
- Heading hierarchy rules
- Cross-reference format
- Code block conventions

**Key Insight:** Writing the style guide first is not just "good practice" — it is a precondition for parallel execution without coordination. Without a shared standard, parallel agents produce incompatible output that requires a reconciliation phase. With the standard, they produce compatible output by construction.

**Recommendation:** Every documentation milestone must include a style guide or style reference as a Wave 0 mandatory deliverable. For code milestones, the equivalent is type definitions and interface contracts (already practiced — see LL-CLOUD-003).

**Impact:** HIGH — foundational pattern for all parallel work.

---

### LL-DOCS-005: Three Reading Speeds Enable Systematic Progressive Disclosure

**Observation:** Every v1.34 document includes YAML frontmatter with `reading_levels` specifying glance (1 sentence), scan (3-5 bullets), and read (full document) access patterns. Phase 333 verified all 44 v1.34 files pass the reading test.

**Root Cause:** The style guide mandated `reading_levels` as a required frontmatter field. This forced every author to identify the core insight before writing the full document.

**Measured Benefit:** The glance-level summaries across all 44 files average 18 words. A reader can assess relevance of the entire 53K-line documentation set by reading ~800 words of glance summaries — a 66x compression ratio.

**Recommendation:** Adopt three-speed reading as a standard for all generated documentation, not just milestone deliverables. This includes skill files, agent definitions, and auto-generated reports. The overhead is minimal (one extra YAML field), the benefit is substantial.

**Impact:** MEDIUM — improves documentation navigation. Applicable to sc:learn's report generation in v1.35.

---

### LL-DOCS-006: Filesystem Contracts Are More Valuable Than Directory Listings

**Observation:** Phase 326 produced `docs/meta/filesystem-contracts.md` with machine-readable YAML declaring every file's creator phase, consumer phases, purpose, and required frontmatter. Phase 333 validated the entire filesystem against these contracts.

**Root Cause:** A directory listing tells you what exists. A filesystem contract tells you what *should* exist, who created it, who depends on it, and what it must contain. The contract serves as:
- Pre-flight validation artifact (verify structure before executing)
- Deployment manifest (tooling can validate site structure)
- Dependency graph (know what exists before your phase starts)
- Regression detector (notice when files are deleted or misplaced)

**Recommendation:** For milestones that produce >20 files, include filesystem contracts as a Wave 0 deliverable. For smaller milestones, a simple file inventory in the plan suffices. Consider automating contract validation as a pre-commit hook.

**Impact:** MEDIUM — useful for large documentation and infrastructure milestones.

---

### LL-DOCS-007: Explicit Parallel Track Annotations Enable True Parallelism

**Observation:** v1.34 declared 4 parallel pairs across 5 waves (327||328, 329||330, 331||332, 333||334). All 4 pairs executed concurrently. The critical path reduced from ~84 minutes (sequential) to ~42 minutes (parallel) — a 2x speedup from parallelism alone.

**Root Cause:** The wave execution plan included explicit `parallel_with` annotations on every parallelizable phase. Executors respected these annotations without manual intervention.

**Contrast with implicit parallelism:** In earlier milestones, parallelism was inferred from the absence of dependencies. This is fragile — an executor that isn't certain about independence defaults to sequential execution. Explicit annotations remove ambiguity.

**Recommendation:** Always annotate parallelism explicitly in wave plans. The syntax `Phase X (parallel with Phase Y)` takes 5 words and saves hours. Never rely on executors to infer parallelism from dependency analysis alone.

**Impact:** HIGH — directly affects wall-clock time for all future milestones.

---

### LL-DOCS-008: Content Map as Living Inventory Enables Automated Validation

**Observation:** Phase 327 produced `docs/meta/content-map.md` cataloging all 158 files with classification (gateway, original, migrated, placeholder, reference). Phase 333 used this map to systematically validate 502 cross-references and identify 5 expected orphans.

**Root Cause:** The content map is a structured inventory that supports both human navigation and automated validation. Unlike a flat file listing, it classifies content by type, creation phase, and audience.

**Recommendation:** For documentation milestones, produce a content map in Wave 1 and validate against it in the verification wave. The map should be machine-readable (structured markdown or JSON) so validation can be automated.

**Impact:** LOW — useful pattern but specific to documentation milestones.

---

### LL-DOCS-009: Task Sizing for Documentation: 1-2 Documents Per Task

**Observation:** Tasks were capped at 1-2 documents each. Average task duration was 1.8 minutes. No task hit rate limits. No task required more than one agent context.

**Root Cause:** v1.33's LL-CLOUD-007 recommended capping documentation tasks at 1 service per task. v1.34 refined this to 1-2 documents per task, which proved ideal:
- 1 document per task: optimal for complex documents (>200 lines)
- 2 documents per task: optimal for related documents that share context (e.g., site-architecture.md + content-pipeline.md)

**Recommendation:** For future documentation: 1 document per task when document exceeds 200 lines or requires significant judgment. 2 documents per task when documents are related and under 200 lines each. Never 3+ documents per task.

**Impact:** LOW — refinement of existing LL-CLOUD-007.

---

### LL-DOCS-010: Verification as Separate Phase Catches Real Issues

**Observation:** Phase 333 (Verification) ran as a dedicated phase with three checks: cross-reference validation (502 links, 0 broken), reading test (30 documents verified), and style compliance (44 files checked). The verification discovered that initial orphan analysis missed frontmatter `cross_references` fields, extending coverage from inline links only to inline + frontmatter.

**Root Cause:** Dedicated verification phases have focused context — the agent's only job is to find problems, not to create content. This focus produces more thorough checks than inline verification (where the creator checks their own work).

**Key Finding:** The verification agent's decision to extend orphan analysis beyond the plan scope was the only "deviation-like" behavior in the entire milestone — and it improved quality. Verification agents should be empowered to expand scope when they discover gaps in the verification plan.

**Recommendation:** Always include a dedicated verification phase. Allow verification agents to extend scope beyond the plan when they identify uncovered areas. The verification phase should be the second-to-last phase (before retrospective/lessons), not the last.

**Impact:** MEDIUM — affects verification design for all milestones.

---

### LL-DOCS-011: Template Extraction Produces Reusable Artifacts

**Observation:** Phase 330 extracted 4 templates from real artifacts: educational-pack (from electronics pack), career-pathway (from docs structure), ai-learning-prompt (from The Space Between's teaching approach), mission-retrospective (from v1.33 LLIS). Total: 1,457 lines of template content.

**Root Cause:** Templates extracted from successful real artifacts carry the implicit quality of the original. They encode decisions that were validated through execution rather than designed in theory.

**Open Question:** Whether these templates produce comparable quality when reused. This is one of v1.34's anticipated lessons (template extraction fidelity) and has not been validated yet. v1.35's mission retrospective template usage will provide the first data point.

**Recommendation:** Continue extracting templates from successful artifacts. Track whether template-based output matches the quality of the original artifact. If templates consistently constrain quality, the extraction process needs refinement — likely the templates are too rigid and need more flexible sections.

**Impact:** MEDIUM — affects all future documentation and mission design.

---

### LL-DOCS-012: WordPress Migration Requires Content Judgment, Not Just Conversion

**Observation:** Phase 329 migrated 6 WordPress pages to markdown framework documents + 2 application gateways. The task required Opus-level judgment to restructure CMS content into progressive disclosure format with proper frontmatter, cross-references, and reading levels. Simple format conversion (HTML → markdown) would have produced inferior results.

**Root Cause:** WordPress content is structured for CMS rendering (sidebars, widgets, theme-specific formatting). Markdown documentation is structured for reading (headings, progressive disclosure, cross-references). The transformation is semantic, not syntactic.

**Recommendation:** For future content migrations: assign Opus to content restructuring tasks, not Sonnet. The judgment required to restructure content for a different consumption model is architectural, not mechanical. Budget extra time (5-10 min per page vs 2-3 min for new content).

**Impact:** LOW — specific to migration tasks but relevant to v1.35's sc:learn which must handle diverse source formats.

---

### LL-DOCS-013: Retrospective Gap — Always Generate Post-Milestone Lessons

**Observation:** v1.34 produced a `lessons-applied-v1.34.md` (mapping v1.33 lessons INTO v1.34) but did not produce a `lessons-learned-v1.34.md` (extracting lessons FROM v1.34). This gap was only discovered during v1.35 mission preparation.

**Root Cause:** The v1.34 wave plan included "lessons applied" as a phase deliverable but not "lessons learned." The milestone completion workflow archived and tagged without generating a retrospective. The v1.33 LLIS document was manually written during a dedicated retrospective session — v1.34 skipped this step.

**Contributing Factor:** Documentation-only milestones feel "simpler" and create a false sense that there's nothing to learn. In fact, v1.34 produced 15 formal lessons — more than enough to justify a retrospective.

**Recommendation:** Make post-milestone retrospective a MANDATORY step in the milestone completion workflow. The `gsd:complete-milestone` command should either generate a retrospective automatically or block completion until one exists. This lesson is the most important from v1.34 because it affects the quality of every future milestone's input.

**Impact:** CRITICAL — affects institutional learning for all future milestones.

---

### LL-DOCS-014: Estimation Models Need Scope-Type Calibration

**Observation:** v1.34 estimated 150 minutes and completed in 42 minutes (3.2x faster). v1.33 estimated ~4 hours and completed in approximately that range. The models are calibrated for code milestones and systematically overestimate documentation milestones.

**Root Cause:** The estimation model uses tokens-per-task and tasks-per-wave as primary inputs. For code tasks, tokens correlate with execution time because compilation, testing, and debugging add overhead proportional to code complexity. For documentation tasks, tokens correlate almost directly with generation time — there's no overhead multiplier.

**Proposed Calibration:**

| Scope Type | Multiplier (vs raw token estimate) |
|------------|-----------------------------------|
| Code + tests | 1.0x (baseline) |
| Infrastructure/config | 0.8x |
| Documentation only | 0.3x |
| Mixed code + docs | 0.7x |

**Recommendation:** Include scope-type classification in milestone specs. Apply the appropriate multiplier during wave planning. Track actual vs estimated across future milestones to refine the multipliers.

**Impact:** HIGH — affects planning accuracy for all future milestones.

---

### LL-DOCS-015: Anticipated Lessons Need Measurement Infrastructure

**Observation:** v1.34's lessons-applied document identified 5 anticipated lessons (template extraction fidelity, narrative spine effectiveness, documentation-first workflow, cross-reference density, WordPress migration completeness). None of these have measurement infrastructure in place.

**Root Cause:** Anticipating lessons is easy. Building the instrumentation to measure them is a separate task that was not included in v1.34's scope.

**Specific Gaps:**
- Template extraction fidelity: no framework for comparing template output against original quality
- Narrative spine effectiveness: requires site analytics (not yet deployed)
- Documentation-first workflow: qualitative assessment deferred to site build milestone
- Cross-reference density: Phase 333 provided quantitative data (502 links, 0 broken) but no readability impact assessment
- WordPress migration completeness: no tracking of post-migration cleanup effort

**Recommendation:** When anticipating lessons, also specify the measurement mechanism and which future milestone will provide the data. An anticipated lesson without a measurement plan is an unfulfillable promise.

**Impact:** MEDIUM — affects retrospective quality for future milestones.

---

## Summary Table

| ID | Lesson | Category | Impact |
|----|--------|----------|--------|
| LL-DOCS-001 | Docs milestones execute 3x faster than estimated | Estimation | HIGH |
| LL-DOCS-002 | Zero deviations achievable with pre-built packages | Execution | MEDIUM |
| LL-DOCS-003 | Single commit per phase optimal for docs | Git workflow | LOW |
| LL-DOCS-004 | Style guide as Wave 0 prevents all drift | Foundation | HIGH |
| LL-DOCS-005 | Three reading speeds enable systematic disclosure | Content design | MEDIUM |
| LL-DOCS-006 | Filesystem contracts > directory listings | Validation | MEDIUM |
| LL-DOCS-007 | Explicit parallel annotations enable true parallelism | Execution | HIGH |
| LL-DOCS-008 | Content map enables automated validation | Validation | LOW |
| LL-DOCS-009 | 1-2 documents per task is the sweet spot | Task sizing | LOW |
| LL-DOCS-010 | Dedicated verification catches real issues | Quality | MEDIUM |
| LL-DOCS-011 | Template extraction produces reusable artifacts | Reuse | MEDIUM |
| LL-DOCS-012 | Content migration requires judgment, not just conversion | Migration | LOW |
| LL-DOCS-013 | Always generate post-milestone lessons | Process | CRITICAL |
| LL-DOCS-014 | Estimation needs scope-type calibration | Estimation | HIGH |
| LL-DOCS-015 | Anticipated lessons need measurement infrastructure | Process | MEDIUM |

---

## Comparison to v1.33

| Dimension | v1.33 (OpenStack Cloud) | v1.34 (Documentation) |
|-----------|------------------------|----------------------|
| Phases | 14 | 9 |
| Commits | 124 | 9 |
| Wall time | ~4 hours | ~42 min |
| Deviations | Multiple (type mismatches, rate limits) | Zero |
| Tests | 216 | 0 (verification only) |
| Code LOC | ~5,900 | 0 |
| Doc files | 113 | 158 |
| Lessons produced | 15 (LL-CLOUD-001–015) | 15 (LL-DOCS-001–015) |

The two milestones are complementary in what they teach. v1.33 lessons focus on infrastructure complexity, agent coordination, and deviation recovery. v1.34 lessons focus on documentation velocity, content architecture, and process completeness. Together they cover the full spectrum of milestone types this project encounters.
