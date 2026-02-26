---
title: "Improvement Cycle"
layer: meta
path: "meta/improvement-cycle.md"
summary: "Five closed-loop feedback mechanisms that make the documentation ecosystem self-improving — from mission execution through template extraction to skill promotion."
cross_references:
  - path: "meta/index.md"
    relationship: "builds-on"
    description: "Part of meta-documentation"
  - path: "templates/index.md"
    relationship: "parallel"
    description: "Template library that feeds Loop 1 and Loop 3"
  - path: "meta/style-guide.md"
    relationship: "parallel"
    description: "Style standards enforced by Loop 2"
  - path: "community/contributing.md"
    relationship: "parallel"
    description: "Contribution process that feeds Loop 4"
  - path: "meta/content-pipeline.md"
    relationship: "parallel"
    description: "Content pipeline that triggers Loop 5 analytics"
reading_levels:
  glance: "Five feedback loops that connect mission execution, template extraction, skill promotion, community contribution, and analytics into a self-improving documentation system."
  scan:
    - "Loop 1: Mission execution produces documentation, retrospectives extract templates"
    - "Loop 2: skill-creator observes documentation quality and flags patterns"
    - "Loop 3: Templates promoted to skills after 3+ successful uses"
    - "Loop 4: Community contributions feed the observation pipeline"
    - "Loop 5: Privacy-respecting analytics inform content priorities (future)"
created_by_phase: "v1.34-332"
last_verified: "2026-02-25"
---

# Improvement Cycle

This document specifies the closed-loop feedback system that makes the tibsfox.com
documentation ecosystem self-improving. The system has five loops, each operating at a
different cadence and serving a different purpose. Together they ensure that every mission
produces better documentation than the last, every template captures more knowledge than
its predecessor, and every skill reflects the accumulated wisdom of the ecosystem.

The fundamental insight is that documentation, templates, and skills are not static artifacts.
They are points on a maturity continuum. A pattern observed in mission documentation becomes
a template. A template proven through repeated use becomes a skill. A skill refined through
bounded learning becomes institutional knowledge that survives context resets, session
boundaries, and contributor turnover.


## Loop 1: Mission to Documentation to Template

Every GSD mission that produces documentation generates raw material for the template library.
This loop is the primary engine of improvement -- it converts operational experience into
reusable patterns.

**The cycle works as follows.** A mission executes (for example, v1.33 OpenStack Cloud Platform
or v1.34 Documentation Ecosystem). During execution, agents produce documentation artifacts:
guides, runbooks, educational packs, gateway documents, architectural specifications. After
the mission completes, the RETRO agent produces a lessons-learned retrospective using the
[mission retrospective template](templates/mission-retrospective.md). The retrospective
identifies what worked well, what could improve, and what structural patterns emerged.

Template extraction happens during the retrospective review. The RETRO agent examines the
mission's documentation output and asks three questions:

1. Did any document follow a structure that could be reused for a different domain?
2. Did any document deviate from an existing template in a way that improved the result?
3. Did the mission produce a type of content that has no template yet?

If the answer to any question is yes, the agent either creates a new template or proposes a
revision to an existing one. New templates go into the [template library](templates/index.md)
with a reference to their source exemplar. Template revisions follow the bounded learning
constraints: a maximum 20% content change per revision and a 7-day cooldown between revisions
of the same template.

**Trigger:** Mission completion. Specifically, the point at which the final SUMMARY.md is
written and the milestone is tagged.

**Cadence:** Per mission. Template review happens as part of every mission retrospective.
Immediate extraction occurs when a new pattern is identified mid-mission. Batch review
happens after every 2-3 missions to catch patterns that span multiple efforts.

**Owner:** RETRO agent (retrospective production and template extraction proposal). Human
operator (approval of new templates and template revisions).

**Inputs:** Mission documentation artifacts, SUMMARY.md files, phase execution logs.

**Outputs:** New templates in `docs/templates/`, revised templates, retrospective documents.


## Loop 2: skill-creator to Documentation Quality

The skill-creator observation pipeline already monitors agent behavior and code patterns.
This loop extends that observation to documentation quality, creating a continuous background
process that detects documentation problems before they accumulate.

**What the observation pipeline monitors for documentation:**

**Template usage patterns.** Which templates are loaded most frequently during mission
planning? Which templates are used without modification versus which require significant
customization? Templates that are consistently modified in the same way signal a gap between
the template and actual need.

**Style guide compliance.** The pipeline watches agent output for violations of the
[Documentation Style Guide](meta/style-guide.md). Common violations include: missing
language identifiers on code blocks, frontmatter fields with placeholder values, heading
level jumps, and cross-references that use absolute URLs instead of relative paths.

**Cross-reference patterns.** Which documents are referenced most often? Which documents are
never referenced? Frequently referenced documents may need to be more robust. Unreferenced
documents may be orphaned or poorly integrated into the ecosystem.

**Content gaps.** When agents produce content that does not match any existing template, the
pipeline records the pattern. If the same unmatched pattern appears three or more times, it
signals a template gap.

**Detection thresholds and actions:**

| Pattern Detected | Threshold | Action |
|------------------|-----------|--------|
| Repeated documentation structure | 3+ instances across missions | Suggest new template |
| Consistent style guide violation | Same violation in 3+ documents | Flag for style guide revision |
| Template section routinely skipped | Skipped in 50%+ of uses | Flag for template simplification |
| Template consistently modified | Same modification in 3+ uses | Suggest template revision |
| Unmatched content pattern | 3+ instances with no template | Suggest new template category |
| Orphaned document | Zero inbound cross-references for 90+ days | Flag for integration review |

**Trigger:** Pattern detection threshold crossed. The pipeline runs continuously in the
background during mission execution.

**Cadence:** Continuous. Detection events are logged as they occur. Suggestions are batched
and presented at the start of the next session to avoid interrupting active work.

**Owner:** ANALYST agent (pattern detection and suggestion generation). Human operator
(decision on whether to act on suggestions).

**Inputs:** Agent output logs, template usage records, `sessions.jsonl` observation data.

**Outputs:** Suggestions for template creation, revision, or simplification. Style guide
revision proposals. Documentation quality metrics.


## Loop 3: Templates to Skills

Templates are human-readable. Skills are agent-optimized. The promotion pipeline transforms
the former into the latter when evidence supports the transformation. This is the loop that
converts passive documentation structures into active operational knowledge.

**The promotion pipeline has six stages:**

**Stage 1: Template creation.** A template is extracted from an exemplar artifact and added
to the [template library](templates/index.md). At this point it is a passive structure -- a
recipe that requires a human or agent to follow it manually. Every template enters at this
stage. There are no shortcuts.

**Stage 2: Template usage.** The template is used by missions to produce new content
instances. Each use is recorded by the observation pipeline (Loop 2). Usage records capture:
which template was used, which mission used it, what modifications were made, and whether the
output met quality standards.

**Stage 3: Usage review.** After three or more successful uses, the template's statistics
are reviewed. The review examines:

| Metric | Target | Rationale |
|--------|--------|-----------|
| Usage count | 3+ missions | Sufficient evidence that the pattern is reusable |
| Modification frequency | Less than 30% of uses require structural changes | Template is stable enough to codify |
| Output quality | All instances pass quality checks | Template produces good results |
| Domain diversity | Used in 2+ different subject domains | Template is genuinely domain-agnostic |

All four targets must be met before promotion is proposed.

**Stage 4: Skill creation.** skill-creator proposes a skill that automates the template's
application. The skill is a 300-500 token compressed summary that captures the template's
structure, guidance, and quality checks in a format optimized for agent consumption. The
skill includes activation conditions (when to load it) and a reference back to the source
template for human inspection.

**Stage 5: Skill deployment.** After human approval, the skill is installed via the chipset
configuration. It is loaded automatically for relevant missions through the 6-stage skill
loading pipeline (Score, Resolve, ModelFilter, CacheOrder, Budget, Load). The skill consumes
context window budget like any other skill -- it must fit within the 2-5% token budget
ceiling.

**Stage 6: Skill refinement.** Through bounded learning, the skill is refined based on
agent and user corrections. Refinement constraints are absolute:

- Maximum 20% content change per refinement
- Minimum 3 corrections before a refinement is proposed
- 7-day cooldown between refinements of the same skill
- All refinements require explicit human approval

A skill that no longer matches its source template triggers a review: either the template
should be updated to match the skill's evolution, or the skill has drifted and should be
corrected.

**The key insight.** Not every template should become a skill. Templates that require
significant human judgment in their application -- the mission retrospective template, for
instance, where the quality of the retrospective depends on the depth of analysis -- may
remain templates permanently. Templates with more mechanical application -- frontmatter
generation, cross-reference validation patterns, educational pack structural scaffolding --
are strong candidates for promotion.

The decision to promote belongs to the human operator. skill-creator suggests; humans decide.
This is a core safety principle of the bounded learning system.

**Trigger:** Template reaches three successful uses across two or more domains.

**Cadence:** Quarterly review of all templates in the library. Immediate review when a
template crosses the usage threshold.

**Owner:** SKILL agent (usage tracking and promotion proposals). Human operator (approval
decisions at stages 4, 5, and 6).

**Inputs:** Template usage records from Loop 2, quality check results, mission SUMMARY.md
files.

**Outputs:** New skills in `.claude/commands/`, skill refinement proposals, template-skill
alignment reports.


## Loop 4: Community to Documentation

External contributions are the mechanism by which the documentation ecosystem incorporates
perspectives, corrections, and content that the core team does not produce. This loop
connects the community contribution process to the observation pipeline, ensuring that
community input improves not just individual documents but the system's understanding of
what content is needed.

**The contribution flow works as follows.** A contributor identifies an improvement -- a
factual correction, a missing gateway document, a template enhancement, new educational
content, a career pathway for an uncovered domain, or an AI prompt pattern for a new use
case. The contributor follows the process described in the
[contributing guide](community/contributing.md) to submit a pull request against the `docs/`
directory.

**Automated review** checks style guide compliance, cross-reference validity, and frontmatter
schema correctness. These checks run as part of the pull request pipeline and produce a
pass/fail result. Structural issues must be resolved before human review begins.

**Human review** evaluates content accuracy, educational value, and alignment with the
ecosystem's principles. A single human approval is required for merge. The reviewer checks
that the contribution genuinely improves the ecosystem rather than introducing noise,
commercial promotion, or content that conflicts with existing material.

**After merge,** the contribution enters the observation pipeline. skill-creator records the
contribution pattern: what type of content was contributed, which layer it belongs to, and
whether it addresses a previously identified gap. If community contributions cluster around
a topic -- three or more people submit content about the same domain -- this signals unmet
demand for a new educational pack or gateway document. The clustering signal feeds into
mission planning for future milestones.

**The shareware-style vision.** This contribution model draws from the Amiga demoscene
tradition where community members share concrete artifacts -- demos, modules, intros, tools --
not just opinions or requests. Contributors to the tibsfox.com ecosystem share documentation,
templates, educational content, and skill definitions. Every shared artifact makes the next
contributor's work easier. The community grows through contribution, not consumption.

**Trigger:** Pull request submission against `docs/`.

**Cadence:** On demand. Contributions are reviewed as they arrive.

**Owner:** Human reviewer (content approval). ANALYST agent (post-merge observation and
clustering analysis).

**Inputs:** Pull requests, contributor submissions.

**Outputs:** Merged documentation improvements, contribution pattern data, demand signals
for new content.


## Loop 5: Analytics to Priorities (Future)

This loop does not operate today. It is specified here so that when the custom site is
deployed with privacy-respecting analytics, the feedback mechanism is already designed and
ready to implement.

**What analytics will measure.** When the custom www/ layer replaces the current WordPress
site, it will include privacy-respecting analytics that measure documentation effectiveness
without tracking individual users. The analytics capture four signals:

**Page visit frequency** reveals which documents the community uses most. High-traffic
documents deserve the most attention for accuracy, completeness, and clarity. Low-traffic
documents may indicate content that is poorly discoverable or no longer relevant.

**Path completion** measures whether visitors follow the intended learning journeys through
the narrative spine. If a path from mathematical foundations through complex plane geometry
to practical applications has high entry but low completion, there is a gap or difficulty
spike somewhere along the route.

**Drop-off analysis** identifies where visitors leave. Consistent drop-off at a specific
point in a learning path signals either a content quality problem or a missing prerequisite
that the path does not account for.

**Template download frequency** measures community adoption of the template library.
Templates that are frequently downloaded but rarely result in contributions may need better
guidance. Templates that are never downloaded may not be solving a real problem.

**How analytics feed priorities.** The PLAN agent consumes analytics data during mission
planning and uses it to prioritize documentation improvements. A document with high traffic
and high drop-off gets priority over a document with low traffic and no issues. This
transforms documentation improvement from guesswork into evidence-based prioritization.

**Privacy commitment.** Analytics will never track individual users, use cookies for
identification, or share data with third parties. The system measures content effectiveness,
not user behavior. No analytics infrastructure will be deployed until the custom site is
built and the privacy model is verified.

**Trigger:** Data accumulation above minimum significance threshold (exact threshold to be
determined when analytics are implemented).

**Cadence:** Monthly review of accumulated analytics data.

**Owner:** Human operator (priority decisions). PLAN agent (data synthesis and
recommendation generation).

**Inputs:** Privacy-respecting analytics data from www/ layer.

**Outputs:** Prioritized documentation improvement backlog, content gap reports, learning
path effectiveness assessments.


## How the Loops Connect

The five loops are not independent. They form a connected system where the output of each
loop feeds into the inputs of others.

```text
                 Loop 1                    Loop 3
  Mission ──────────────> Templates ──────────────> Skills
     ^                       ^                        │
     │                       │                        │
     │    Loop 5             │    Loop 4              │
  Analytics ◄────── www/ ◄───┤◄──── Community         │
     │                       │                        │
     │                       │    Loop 2              │
     └───── Priorities ──────┴◄──── Observation ◄─────┘
```

Loop 1 produces templates. Loop 3 promotes templates to skills. Skills improve the next
mission's execution (closing back to Loop 1). Loop 2 observes all documentation activity and
feeds quality signals into Loops 1, 3, and 4. Loop 4 introduces external contributions that
become inputs to Loop 2's observation. Loop 5 (future) provides quantitative evidence that
informs priority decisions across all other loops.

The system is self-reinforcing: better templates produce better documentation, which produces
better skills, which produce better missions, which produce better templates. Each cycle
raises the quality floor for the next iteration.


## Cycle Timing

This table summarizes when each loop fires, how often, and who is responsible.

| Loop | Trigger | Cadence | Owner | Current Status |
|------|---------|---------|-------|----------------|
| Mission to Template | Mission completion | Per mission + batch every 2-3 missions | RETRO agent + human | Active |
| skill-creator to Quality | Pattern threshold crossed | Continuous (background) | ANALYST agent + human | Active |
| Template to Skill | 3+ uses across 2+ domains | Quarterly review + immediate on threshold | SKILL agent + human | Active |
| Community to Documentation | PR submission | On demand | Human reviewer + ANALYST agent | Active |
| Analytics to Priorities | Data accumulation | Monthly | Human + PLAN agent | Future |


## Quality Metrics

These metrics measure whether the improvement cycle is working. Each metric is measurable
with current tooling except where noted.

| Metric | How to Measure | Target | Data Source |
|--------|---------------|--------|-------------|
| Template reuse rate | Templates used per mission / templates available | Greater than 50% per mission | Mission SUMMARY.md files |
| Documentation consistency | Style guide violations per document | Fewer than 3 per document | Automated linting (PR checks) |
| Cross-reference integrity | Broken links / total links | 0% broken | Build-time validation script |
| Progressive disclosure compliance | Documents passing 3-speed test / total documents | 100% | Phase verification checks |
| Community contribution rate | Documentation PRs merged per quarter | Increasing trend | Git history analysis |
| Template-to-skill promotion rate | Skills created from templates / eligible templates | At least 1 per quarter | skill-creator records |
| Skill refinement frequency | Refinements proposed per skill per quarter | 0-2 (stability indicator) | skill-creator logs |
| Observation pipeline coverage | Documentation events observed / total events | Greater than 90% | sessions.jsonl completeness |

Metrics are reviewed quarterly as part of the Loop 3 template review cycle. If a metric
consistently misses its target, the responsible loop owner investigates the root cause and
proposes a process adjustment through the standard contribution process.


## Getting Started

For someone encountering this system for the first time, here is what matters.

If you are **writing documentation**, Loops 1 and 2 affect you. Follow the
[style guide](meta/style-guide.md), use existing [templates](templates/index.md) where they
fit, and know that the observation pipeline is watching for patterns you produce. Your work
feeds the system.

If you are **contributing to the ecosystem**, Loop 4 is your entry point. Read the
[contributing guide](community/contributing.md) for the process, standards, and review
criteria.

If you are **planning a mission**, all five loops are relevant. Check which templates exist,
which skills are loaded, what the observation pipeline has flagged, and whether any community
contributions have signaled demand for specific content.

If you are **maintaining the system**, the quality metrics table above is your dashboard.
Track the metrics quarterly, investigate misses, and propose adjustments through the same
contribution process that everyone else uses.
