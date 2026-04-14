---
name: digital-literacy-analysis-team
type: team
category: digital-literacy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/digital-literacy/digital-literacy-analysis-team/README.md
description: Full Digital Literacy Department investigation team for complex, multi-perspective questions that span information evaluation, youth practice, institutional framing, algorithmic systems, participatory culture, and connected learning. Rheingold classifies the query and activates the relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Kafai. Use for educator questions, systemic analysis, research-driven inquiries, or any situation where different literacy perspectives may yield different insights.
superseded_by: null
---
# Digital Literacy Analysis Team

Full-department multi-method investigation team for digital-literacy questions that span sub-domains or resist easy classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-perspective questions** spanning information, privacy, participation, and algorithmic framing -- where no single specialist covers the full scope.
- **Educator questions** where the learner is designing curriculum, assessment, or interventions and needs both content and pedagogy.
- **Systemic analysis** where the question is about how the ecosystem is shaped and who benefits from its shape.
- **Research-driven inquiries** where a claim needs to be evaluated against multiple framings (empirical, institutional, structural).
- **Complex cases** -- a specific situation that touches several sub-domains, such as "a 14-year-old was harassed on a platform after posting a remix that an algorithm amplified."
- **Cross-framework synthesis** -- when understanding a phenomenon requires seeing it through networked-publics, institutional, algorithmic, and participatory lenses simultaneously.

## When NOT to use this team

- **Single-topic questions** where the classification is obvious -- route to the specialist via Rheingold in single-agent mode.
- **Simple how-to queries** -- use the relevant skill directly through the responsible specialist.
- **Pure source-checking** -- use `digital-literacy-workshop-team` or route directly to Palfrey.
- **Pure practice rehearsal** -- use `digital-literacy-practice-team`.

## Composition

The team runs all seven Digital Literacy Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `rheingold` | Classification, orchestration, synthesis | Opus |
| **Social context** | `boyd` | Networked publics, contextual integrity, youth practice | Opus |
| **Institutional** | `palfrey` | Law, policy, source credibility, institutional analysis | Opus |
| **Algorithmic bias** | `noble` | Algorithmic systems, power asymmetry, documented cases | Sonnet |
| **Participatory culture** | `jenkins` | Participation, remix, collective intelligence | Sonnet |
| **Connected learning** | `ito` | HOMAGO, interest-driven practice, learning pathways | Sonnet |
| **Pedagogy** | `kafai` | Constructionist learning design, level-appropriate output | Sonnet |

Three agents run on Opus (Rheingold, boyd, Palfrey) because their tasks require deep reasoning. Four run on Sonnet because their tasks are well-defined and bounded.

## Orchestration flow

```
Input: user query + optional level + optional prior session hash
        |
        v
+---------------------------+
| Rheingold (Opus)          |  Phase 1: Classify
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/applied/systemic)
        |                              - type (explain/evaluate/practice/design/verify)
        |                              - user level (beginner/intermediate/advanced/educator)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     boyd    palfrey   noble   jenkins    ito    (kafai
    (social) (inst.)  (algo.) (partic.) (learn.)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, each producing
             an independent Grove record in their framework.
             Rheingold activates only the relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Rheingold (Opus)          |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Kafai (Sonnet)            |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest practice activities
                         v
              +---------------------------+
              | Rheingold (Opus)          |  Phase 5: Record
              | Produce session record    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + DigitalLiteracySession Grove record
```

## Synthesis rules

Rheingold synthesizes specialist outputs using these rules:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at compatible conclusions independently (e.g., boyd's contextual-integrity reading and Palfrey's legal reading both flag a situation as a privacy concern), the finding is reported with high confidence.

### Rule 2 -- Diverging framings are preserved

When specialists emphasize different aspects (e.g., Noble says "the system is structurally biased" while Jenkins says "the community has productive participation"), both are reported with attribution. The user sees the tension rather than a forced synthesis.

### Rule 3 -- Empirical claims require evidence

Any claim about youth behavior, algorithmic behavior, institutional behavior, or learning outcomes must be traceable to a specific source. "Studies show" is not enough. When evidence is thin, specialists say so.

### Rule 4 -- Moral panic filter

Rheingold and boyd jointly filter responses to avoid amplifying unsupported moral panics. If a question assumes a claim that the evidence does not support, the team names the assumption and addresses the underlying concern on its own terms.

### Rule 5 -- Level governs presentation, not content

All specialist findings are included regardless of level. Kafai adapts presentation: activities for students, teaching advice for educators, background for curious adults. Content does not change; framing does.

## Input contract

1. **User query** (required).
2. **User level** (optional). One of `beginner`, `intermediate`, `advanced`, `educator`. Inferred if omitted.
3. **Prior session hash** (optional). For follow-up queries.

## Output contract

### Primary output: Synthesized response

Natural language that directly answers the query, shows reasoning at an appropriate depth, credits the specialists, and suggests concrete next actions or practice.

### Grove record: DigitalLiteracySession

```yaml
type: DigitalLiteracySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: systemic
  type: evaluate
  user_level: educator
agents_invoked:
  - rheingold
  - boyd
  - palfrey
  - noble
  - jenkins
  - ito
  - kafai
work_products:
  - <grove hash of DigitalLiteracyAnalysis from palfrey>
  - <grove hash of DigitalLiteracyAnalysis from boyd>
  - <grove hash of DigitalLiteracyReview from noble>
  - <grove hash of DigitalLiteracyExplanation from kafai>
concept_ids:
  - <relevant college concept IDs>
user_level: educator
```

## Escalation paths

### Internal escalations

- **boyd and Palfrey disagree on a privacy case:** Report both framings; note that privacy is both a legal and a contextual concept.
- **Noble finds algorithmic harm but Jenkins finds productive participation:** Both are valid. Present both; let the user weigh the trade-off.
- **Ito recommends patience but the user needs an immediate answer:** Honor the urgency; mark the recommendation as a short-term fix with a longer-term path.

### External escalations

- **From workshop team:** When a focused evaluation reveals the situation is actually multi-dimensional, escalate to the analysis team.
- **From practice team:** When a rehearsal reveals that the underlying content needs revision, escalate to the analysis team.

### Escalation to the user

- **Beyond digital literacy scope:** If the query turns on mental health, legal dispute, or professional ethics, Rheingold acknowledges the boundary and suggests appropriate resources.
- **Insufficient evidence:** If a query cannot be answered responsibly because the evidence is thin or contested, the team says so rather than speculating.

## Token / time cost

- **Rheingold** -- 2 Opus invocations, ~40K tokens
- **Specialists in parallel** -- 2 Opus (boyd, Palfrey) + 3 Sonnet (Noble, Jenkins, Ito), ~30-50K tokens each
- **Kafai** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 180-350K tokens, 5-15 minutes wall-clock

Use the full team only when the query actually benefits from multi-framework analysis.

## Configuration

```yaml
name: digital-literacy-analysis-team
chair: rheingold
specialists:
  - social_context: boyd
  - institutional: palfrey
  - algorithmic: noble
  - participatory: jenkins
  - connected_learning: ito
pedagogy: kafai

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
> digital-literacy-analysis-team: A school district wants to adopt an AI content-moderation tool for student devices. Analyze the trade-offs and help us design a community conversation. Level: educator.

> digital-literacy-analysis-team: My 8th grader was briefly the target of a coordinated harassment campaign after posting a TikTok remix that got algorithmically amplified. How do we think about recovery, prevention, and what to teach them about platforms?

> digital-literacy-analysis-team: (session: grove:abc123) Now extend this analysis to what parents outside the original community should take away.
```

## Limitations

- The team is bounded by the seven agents' combined expertise. Questions requiring deep specialization (cybersecurity operations, specific legal filings, clinical mental-health intervention) are handled at the closest available level of generality, with explicit handoff recommendations.
- Parallel specialists do not communicate during Phase 2. Convergence is measured only at synthesis. This preserves independence but prevents real-time collaboration.
- The team does not access external real-time data beyond what each agent's tools provide.
- Systemic questions about the information ecosystem may not have clean answers. The team reports this honestly rather than fabricating certainty.
