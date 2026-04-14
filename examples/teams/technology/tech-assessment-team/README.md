---
name: tech-assessment-team
type: team
category: technology
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/technology/tech-assessment-team/README.md
description: Full Technology Department assessment team for multi-domain technology questions spanning systems, design, emerging technologies, security, HCI, ethics, and social impact. Berners-Lee classifies the query and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with pedagogical scaffolding from Resnick. Use for technology policy assessment, cross-cutting evaluation of technology proposals, or any question where technical, social, and ethical dimensions must be considered together. Not for single-domain questions where one specialist suffices.
superseded_by: null
---
# Tech Assessment Team

Full-department multi-perspective assessment team for technology questions that span domains or require the breadth of the entire department. Runs specialists in parallel and synthesizes their independent findings into a coherent, balanced response.

## When to use this team

- **Multi-domain questions** spanning systems, design, security, ethics, and social impact -- where no single specialist covers the full scope.
- **Technology policy assessment** where technical feasibility, social impact, risk, and equity must all be considered.
- **Cross-cutting evaluation** of technology proposals (e.g., "should our city deploy smart streetlights?") that require systems analysis, design evaluation, risk assessment, equity audit, and pedagogical framing.
- **Complex technology literacy questions** where the user does not know which specialist to invoke.
- **Stakeholder-sensitive assessments** where different perspectives may yield different conclusions.

## When NOT to use this team

- **Pure systems questions** -- use `borg` directly. The full team's token cost is substantial.
- **Pure design evaluation** -- use `design-team`.
- **Pure ethics/social analysis** -- use `ethics-team`.
- **Beginner-level teaching** with no assessment component -- use `resnick` directly.
- **Single-domain questions** where the classification is obvious -- route to the specialist via `berners-lee` in single-agent mode.

## Composition

The team runs all seven Technology Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `berners-lee` | Classification, orchestration, synthesis | Opus |
| **Systems specialist** | `borg` | Infrastructure, architecture, networking, system security | Opus |
| **Impact specialist** | `gates-m` | Digital equity, social impact, global development | Sonnet |
| **Risk specialist** | `joy` | Emerging tech risk, failure modes, precautionary analysis | Opus |
| **Social analyst** | `hicks` | Social construction, labor, gender, power dynamics | Sonnet |
| **Design specialist** | `norman` | HCI, usability, accessibility, interaction design | Sonnet |
| **Pedagogy specialist** | `resnick` | Level-appropriate framing, creative learning, scaffolding | Sonnet |

Three agents run on Opus (Berners-Lee, Borg, Joy) because their tasks require deep reasoning across complex systems and risk landscapes. Four run on Sonnet because their tasks are well-defined and benefit from fast turnaround.

## Orchestration flow

```
Input: user query + optional user level + optional prior TechSession hash
        |
        v
+---------------------------+
| Berners-Lee (Opus)        |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (foundational/intermediate/advanced)
        |                              - type (explain/evaluate/design/assess/compare)
        |                              - user level (beginner/intermediate/advanced/professional)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
      Borg    Gates-M    Joy     Hicks   Norman   (Resnick
     (sys)   (impact)  (risk)  (social) (design)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, analyzing the
             same question from their own perspective.
             Each produces a Grove record.
             Berners-Lee activates only relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Berners-Lee (Opus)        |  Phase 3: Synthesize
              | Merge specialist outputs  |          - identify convergence
              +---------------------------+          - preserve disagreement
                         |                           - rank by evidence quality
                         v
              +---------------------------+
              | Resnick (Sonnet)          |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest exploration activities
                         v
              +---------------------------+
              | Berners-Lee (Opus)        |  Phase 5: Record
              | Produce TechSession      |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + TechSession Grove record
```

## Synthesis rules

Berners-Lee synthesizes specialist outputs using these rules:

### Rule 1 -- Converging assessments are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Joy identifies a risk that Hicks confirms through historical precedent), mark the finding as high-confidence.

### Rule 2 -- Diverging assessments are preserved

Technology assessment legitimately involves value conflicts. Berners-Lee does not force consensus. Instead:

1. State both assessments with attribution ("Joy's risk analysis identifies X; Gates-M's impact assessment finds Y").
2. Identify the source of disagreement (usually different values or different evidence).
3. Present both perspectives to the user.
4. If factual (not value) disagreement, route to the specialist whose claim is more verifiable.

### Rule 3 -- Social context over technical abstraction

When Hicks identifies social dynamics that change the meaning of a technical assessment (e.g., "this efficiency improvement historically led to job reclassification rather than shared productivity gains"), the social analysis is integrated into, not appended to, the technical assessment.

### Rule 4 -- Risk assessment has veto power for irreversible actions

If Joy's risk assessment identifies irreversible consequences, this finding is prominently flagged regardless of how positive other assessments are. Reversibility is a threshold criterion, not a dimension to be averaged.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Resnick adapts the presentation: simpler language, more analogies, and hands-on activities for lower levels; concise technical writing for higher levels. The substantive content does not change.

## Input contract

The team accepts:

1. **User query** (required). Natural language technology question, assessment request, or policy evaluation.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `professional`. If omitted, Berners-Lee infers.
3. **Prior TechSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query from multiple perspectives
- Shows analysis at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or value conflicts
- Suggests follow-up explorations

### Grove record: TechSession

```yaml
type: TechSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: advanced
  type: assess
  user_level: intermediate
agents_invoked:
  - berners-lee
  - borg
  - gates-m
  - joy
  - hicks
  - norman
  - resnick
work_products:
  - <grove hash of TechAnalysis>
  - <grove hash of TechAssessment>
  - <grove hash of TechDesign>
  - <grove hash of TechExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: intermediate
```

## Escalation paths

### Internal escalations

- **Joy identifies existential risk, others disagree:** Joy's assessment is flagged prominently. The team does not vote on existential risk -- the precautionary principle applies.
- **Hicks and Gates-M disagree on equity assessment:** Both perspectives are presented. Hicks tends to analyze structural causes; Gates-M tends to analyze practical interventions. Both are valid.
- **Norman identifies usability issues in a system Borg considers well-designed:** Both assessments are valid -- technical soundness and usability are independent dimensions.

### Escalation to the user

- **Genuine value conflict:** When the assessment reveals a legitimate value trade-off (e.g., surveillance vs safety), the team presents the trade-off explicitly rather than choosing a side.
- **Outside technology:** When the question requires expertise outside technology, Berners-Lee acknowledges the boundary.

## Token / time cost

Approximate cost per assessment:

- **Berners-Lee** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Borg, Joy) + 3 Sonnet (Gates-M, Hicks, Norman), ~30-60K tokens each
- **Resnick** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

## Configuration

```yaml
name: tech-assessment-team
chair: berners-lee
specialists:
  - systems: borg
  - impact: gates-m
  - risk: joy
  - social: hicks
  - design: norman
pedagogy: resnick

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full assessment
> tech-assessment-team: Should our city deploy a network of smart surveillance
  cameras with AI-powered facial recognition? Level: professional.

# Multi-domain question
> tech-assessment-team: Evaluate the impact of transitioning a school district
  to all-digital textbooks. Consider technical, equity, design, and social factors.

# Follow-up
> tech-assessment-team: (session: grove:abc123) Now consider the privacy
  implications we did not address.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Questions requiring deep domain knowledge outside technology (e.g., constitutional law, medical diagnosis) are handled at the boundary level.
- Parallel specialists do not communicate during Phase 2. Independence is preserved for synthesis.
- Value conflicts are presented, not resolved. The team informs decisions; it does not make them.
- Assessments are based on available knowledge and reasoning, not empirical field research.
