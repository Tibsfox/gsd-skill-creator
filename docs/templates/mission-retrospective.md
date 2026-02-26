---
title: "Mission Retrospective Template"
layer: templates
path: "templates/mission-retrospective.md"
summary: "Structured template for mission retrospectives using the NASA LLIS lessons-learned format with 8 fields per entry, priority matrix, and phase assessment."
cross_references:
  - path: "templates/index.md"
    relationship: "builds-on"
    description: "Part of template library"
  - path: "applications/case-studies/openstack-cloud.md"
    relationship: "extracted-from"
    description: "Template extracted from v1.33 OpenStack Cloud mission retrospective"
reading_levels:
  glance: "Structured template for mission retrospectives using the LLIS lessons-learned format."
  scan:
    - "8 structured fields per lesson (LLIS ID, title, category, event, lesson, recommendation, evidence, NASA phase)"
    - "Four category sections: worked well, could improve, risks realized, process observations"
    - "Priority matrix for recommendations with effort and impact ratings"
    - "Mission phase assessment with 5-point scale"
    - "NASA SE phase mapping connecting lessons to lifecycle stages"
created_by_phase: "v1.34-330"
last_verified: "2026-02-25"
---

# Mission Retrospective Template

This template defines the structure for a post-mission retrospective using the NASA Lessons
Learned Information System (LLIS) format. It provides a rigorous, structured approach to
capturing what happened during a GSD mission, what was learned, and what should change for
future missions.

The template was extracted from the v1.33 GSD OpenStack Cloud Platform lessons-learned
document, which applied the LLIS format to a multi-phase software mission. The format
originated at NASA for capturing engineering lessons across space programs, and its
structured fields translate well to any complex technical project where lessons need to be
searchable, categorizable, and actionable.


## When to Use

Use this template for post-mission analysis when any of these conditions apply:

- The mission included 5 or more phases (enough complexity to generate meaningful lessons)
- The mission used crew configurations (multiple agents with distinct roles)
- The mission produced results worth learning from, whether positive or negative
- A RETRO agent position is staffed in the crew (the designated retrospective author)
- The team wants structured feedback that connects to specific evidence and artifacts

The template is not necessary for small missions (fewer than 5 phases) or for missions
where a brief "what went well / what to change" conversation suffices. The LLIS format
adds rigor at the cost of effort -- use it when the lessons are valuable enough to justify
the investment.


## How to Use

Work through the template in order. The Document Information Table and Executive Summary
frame the retrospective. The Mission Overview provides factual context. The Lessons Learned
section is the core -- each lesson gets a structured LLIS entry with all 8 fields. The
remaining sections (Recommendations Summary, Phase Assessment, NASA SE Mapping, Appendixes)
synthesize and organize the lessons for different audiences.

The most common mistake is writing vague lessons. "Communication could be better" is not
a lesson. "Phase 3 execution stalled for 2 days because the executor agent lacked access
to the API schema document, which was only referenced in the planner's context" is a
lesson -- it has a specific event, a measurable impact, and an obvious recommendation.

Start by reviewing all SUMMARY.md files from the mission. Each summary contains the raw
material (commits, deviations, decisions, metrics) that feeds into LLIS entries. Do not
write lessons from memory alone.


## Template

### Document Information Table

```markdown
| Field | Value |
|-------|-------|
| Project | [Project name and identifier] |
| Milestone | [Version number, e.g., v1.33] |
| LLIS Category | [Domain / Subdomain, e.g., Cloud Infrastructure / OpenStack] |
| Date | [YYYY-MM-DD] |
| Author | [RETRO Agent (Crew Name), e.g., RETRO Agent (Atlas Crew)] |
| Living Document | [Yes | No] |
```

The Living Document field indicates whether this retrospective will be updated as new
information emerges. Most mission retrospectives are "No" -- they capture the state at
mission completion. Set to "Yes" only if the mission has ongoing implications that will
generate new lessons.

### Executive Summary

```markdown
## Executive Summary

[3-4 paragraphs covering:]

[Paragraph 1: What was attempted -- mission objectives, scope, and constraints.]

[Paragraph 2: What was achieved -- key deliverables, metrics, and outcomes.
Include the single most important number from the mission.]

[Paragraph 3: Primary findings -- the 2-3 most significant lessons, stated
concisely. These are the lessons that, if the reader reads nothing else, they
should know.]

[Paragraph 4: Overall assessment -- mission success level, key factors that
drove the outcome, and the single most important recommendation for future missions.]
```

### Mission Overview

#### Scope

```markdown
## Mission Overview

### Scope

What was built during this mission:

- [Deliverable 1 -- brief description]
- [Deliverable 2 -- brief description]
- [Deliverable 3 -- brief description]
- [Additional deliverables as needed]
```

#### Timeline

```markdown
### Timeline

| Wave | Phases | Focus | Status |
|------|--------|-------|--------|
| [Wave 1] | [Phase range] | [Description] | [Complete | Partial | Skipped] |
| [Wave 2] | [Phase range] | [Description] | [Status] |
| [Wave 3] | [Phase range] | [Description] | [Status] |
```

#### Key Metrics

```markdown
### Key Metrics

| Metric | Value | Source |
|--------|-------|--------|
| Total phases | [N] | ROADMAP.md |
| Total plans | [N] | ROADMAP.md |
| Total commits | [N] | git log |
| Tests added | [N] | test suite |
| Requirements met | [N/M] | REQUIREMENTS.md |
| Lines of code (estimated) | [N] | cloc or manual estimate |
| Duration | [N days/weeks] | git log first..last |
```

### Lessons Learned

The lessons section is the core of the retrospective. Every lesson follows the LLIS entry
format with all 8 fields populated.

#### LLIS Entry Format

Each lesson uses this structure:

```markdown
### LL-[PROJECT]-[NNN]: [Brief Descriptive Title]

| Field | Value |
|-------|-------|
| **LLIS ID** | LL-[PROJECT]-[NNN] |
| **Category** | [Architecture | Process | Tooling | Documentation | Integration] |
| **Driving Event** | [What happened -- specific, factual, citing phase/plan if applicable] |
| **Lesson** | [What was learned -- the insight, not just the event] |
| **Applicable NASA SE Phase** | [Pre-Phase A | Phase A | Phase B | Phase C | Phase D | Phase E | Phase F] |

**Recommendation:**
1. [Specific actionable improvement 1]
2. [Specific actionable improvement 2]
3. [Additional improvements as needed]

**Evidence:**
[Data supporting the lesson. Cite specific SUMMARY files, commit hashes, metrics,
or observable outcomes. "It felt slow" is not evidence. "Phase 7 execution took 3
context windows vs. the planned 1, per 07-01-SUMMARY.md" is evidence.]
```

The 8 fields are:

1. **LLIS ID** -- unique identifier using the format LL-[PROJECT]-NNN, where PROJECT is
   a short project code and NNN is a sequential number. IDs are sequential across all
   categories.

2. **Title** -- a brief descriptive phrase that captures the lesson at a glance. Should be
   specific enough to distinguish from other lessons.

3. **Category** -- one of five classifications:
   - **Architecture** -- lessons about system design, component boundaries, data models
   - **Process** -- lessons about workflow, planning, execution methodology
   - **Tooling** -- lessons about tools, frameworks, build systems, CI/CD
   - **Documentation** -- lessons about docs, specifications, communication artifacts
   - **Integration** -- lessons about component interaction, API design, system boundaries

4. **Driving Event** -- what happened that produced this lesson. Must be specific and
   factual. Cite the phase, plan, or artifact where it occurred.

5. **Lesson** -- the insight derived from the event. This is the transferable knowledge --
   not "Phase 3 was late" but "Plans that modify shared state files require explicit
   ordering constraints, not just dependency declarations."

6. **Recommendation** -- specific, actionable improvements. Each recommendation should be
   concrete enough that someone could implement it without asking for clarification.
   Number them for reference in the Priority Matrix.

7. **Evidence** -- data supporting the lesson. Cite SUMMARY files, commit hashes, metrics,
   test results, or other verifiable artifacts. Every lesson must have evidence.

8. **Applicable NASA SE Phase** -- which NASA Systems Engineering lifecycle phase this
   lesson maps to. This enables cross-mission analysis by lifecycle stage.

#### Category Organization

Organize lessons into four sections. A lesson belongs to exactly one section.

```markdown
## Lessons Learned

### What Worked Well
[Lessons LL-XXX-001 through LL-XXX-NNN]

### What Could Be Improved
[Lessons LL-XXX-NNN through LL-XXX-NNN]

### Risks Realized and Mitigated
[Lessons LL-XXX-NNN through LL-XXX-NNN]

### Process Observations
[Lessons LL-XXX-NNN through LL-XXX-NNN]
```

**What Worked Well** -- practices, decisions, or approaches that produced better outcomes
than expected. These are patterns to repeat.

**What Could Be Improved** -- areas where the outcome was acceptable but the approach was
inefficient, error-prone, or harder than necessary. These are patterns to refine.

**Risks Realized and Mitigated** -- risks that materialized during the mission and how
they were handled. These document both the risk and the mitigation for future reference.

**Process Observations** -- neutral observations about the process that do not fit neatly
into the other categories. These often become "What Worked Well" or "What Could Be
Improved" lessons in hindsight.

### Recommendations Summary (Priority Matrix)

```markdown
## Recommendations Summary

| Priority | Recommendation | LLIS Ref | Effort | Impact |
|----------|---------------|----------|--------|--------|
| [1] | [Recommendation text] | [LL-XXX-NNN] | [Low | Medium | High] | [Low | Medium | High] |
| [2] | [Recommendation text] | [LL-XXX-NNN] | [Effort] | [Impact] |
| [3] | [Recommendation text] | [LL-XXX-NNN] | [Effort] | [Impact] |
```

Sort recommendations by priority (highest first). Priority considers both effort and
impact -- a high-impact, low-effort recommendation is highest priority. A high-impact,
high-effort recommendation may still rank high if the impact is critical.

### Mission Phase Assessment

```markdown
## Mission Phase Assessment

| Phase Group | Phases | Assessment | Notes |
|-------------|--------|------------|-------|
| [Group name] | [Phase range] | [Assessment] | [Brief explanation] |
| [Group name] | [Phase range] | [Assessment] | [Notes] |
| [Group name] | [Phase range] | [Assessment] | [Notes] |
```

Assessment uses this scale:

- **Exceeded** -- delivered more than planned, ahead of schedule, or with higher quality
- **Met** -- delivered as planned, on schedule, at expected quality
- **Partially Met** -- delivered most objectives but with gaps, delays, or quality issues
- **Below** -- significant shortfalls in delivery, schedule, or quality
- **Not Yet Executed** -- planned but not started (for missions that ended early)

### NASA SE Phase Mapping

```markdown
## NASA SE Phase Mapping

| NASA SE Phase | Project Equivalent | Key Lessons |
|---------------|-------------------|-------------|
| Pre-Phase A: Concept Studies | [Mission questioning/vision] | [LL-XXX-NNN, ...] |
| Phase A: Concept & Technology Development | [Research and requirements] | [LL-XXX-NNN, ...] |
| Phase B: Preliminary Design & Technology Completion | [Planning and architecture] | [LL-XXX-NNN, ...] |
| Phase C: Final Design & Fabrication | [Implementation] | [LL-XXX-NNN, ...] |
| Phase D: System Assembly, Integration & Test | [Integration and testing] | [LL-XXX-NNN, ...] |
| Phase E: Operations & Sustainment | [Deployment and maintenance] | [LL-XXX-NNN, ...] |
| Phase F: Closeout | [Retrospective and archival] | [LL-XXX-NNN, ...] |
```

Map each lesson to the NASA SE phase where it is most applicable. A lesson about planning
methodology maps to Phase B. A lesson about test coverage maps to Phase D. Some lessons
span multiple phases -- list the primary phase and note the secondary in the Key Lessons
column.

### Appendixes

#### Appendix A: Decision Log Summary

```markdown
## Appendix A: Decision Log Summary

| Decision | Phase | Rationale | Outcome |
|----------|-------|-----------|---------|
| [Decision made] | [Phase N] | [Why this was chosen] | [Positive | Negative | Mixed] |
| [Decision made] | [Phase N] | [Rationale] | [Outcome] |
```

Extract decisions from STATE.md and SUMMARY files. The Outcome column is assessed in
hindsight -- was this the right call?

#### Appendix B: Ecosystem Feedback

```markdown
## Appendix B: GSD Ecosystem Feedback

### Tool Improvements
- [Specific suggestion for GSD tooling improvement]
- [Specific suggestion]

### Process Improvements
- [Specific suggestion for GSD workflow improvement]
- [Specific suggestion]

### Documentation Improvements
- [Specific suggestion for GSD documentation improvement]
- [Specific suggestion]
```

This appendix captures concrete suggestions for improving the GSD ecosystem itself, not
just the project. These feed back into skill-creator's observation pipeline.

#### Appendix C: Future Mission Recommendations

```markdown
## Appendix C: Future Mission Recommendations

### For Missions in the Same Domain
- [Recommendation specific to this project's domain]
- [Recommendation]

### For Missions Using Similar Architecture
- [Recommendation about technical approach]
- [Recommendation]

### For All GSD Missions
- [General recommendation applicable to any mission]
- [Recommendation]
```

Organize recommendations by scope. Domain-specific recommendations help teams working
in the same area. Architecture recommendations help teams using similar technical
approaches. General recommendations improve all future missions.


## Quality Checks

Every mission retrospective must pass these checks.

- [ ] Every lesson has all 8 LLIS fields populated (no empty fields)
- [ ] Recommendations are specific and actionable (not "improve communication")
- [ ] Evidence cites actual artifacts (commit hashes, SUMMARY files, metrics)
- [ ] Categories are balanced (not all "What Worked Well" -- every mission has improvements)
- [ ] LLIS IDs are sequential and unique across all categories
- [ ] Priority Matrix sorts recommendations by priority (highest first)
- [ ] Phase Assessment uses the 5-point scale consistently
- [ ] NASA SE Phase Mapping covers all 7 phases (some may have no lessons -- note that)
- [ ] Decision Log includes outcome assessment (not just the decision)
- [ ] Ecosystem Feedback includes concrete tool improvement suggestions
- [ ] Executive Summary includes the most important number and the most important lesson
- [ ] Driving Events cite specific phases, plans, or artifacts (not vague references)


## Source Exemplar

This template was extracted from the v1.33 GSD OpenStack Cloud Platform lessons-learned
document, which applied the NASA LLIS format to a multi-phase cloud infrastructure mission.
The original document captured lessons across architecture, process, tooling, documentation,
and integration categories, with recommendations that fed directly into the GSD ecosystem's
improvement cycle.
