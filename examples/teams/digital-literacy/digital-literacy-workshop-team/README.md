---
name: digital-literacy-workshop-team
type: team
category: digital-literacy
status: stable
origin: tibsfox
first_seen: 2026-04-12
first_path: examples/teams/digital-literacy/digital-literacy-workshop-team/README.md
description: Focused workshop team for in-depth information evaluation and source analysis. Combines Palfrey (institutional credibility), Noble (algorithmic amplification), boyd (contextual framing), and Kafai (pedagogy) to take a specific source, claim, or artifact and analyze it in depth with a teaching wrap-up. Use when a learner brings a concrete case and wants to understand it thoroughly rather than get a general-purpose literacy overview.
superseded_by: null
---
# Digital Literacy Workshop Team

Focused workshop team for deep evaluation of a specific source, claim, or media artifact. Smaller than the analysis team, tighter turnaround, and oriented around a single concrete case.

## When to use this team

- **A specific source needs evaluation.** "Is this article credible?" "Is this website a reliable reference?" "Can I cite this?"
- **A specific claim needs fact-checking plus structural analysis.** "Is it true that X, and if so, why is this particular framing reaching me?"
- **An educator wants to workshop source evaluation in class.** The team produces an analysis the educator can walk through with students.
- **A learner wants to learn evaluation by example.** Walking through the team's analysis is itself a literacy lesson.
- **A single algorithmic artifact needs analysis.** "This search result," "this recommendation," "this AI-generated output."

## When NOT to use this team

- **Multi-domain questions without a specific artifact.** Use the analysis team.
- **Pedagogy design without a source to anchor it.** Use Kafai directly.
- **General participatory-culture questions.** Route to Jenkins via Rheingold.
- **Privacy or security configuration.** Route to Palfrey via Rheingold; workshop team is over-powered for setup questions.
- **Pure rehearsal of a known skill.** Use the practice team.

## Composition

Four agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Institutional analyst** | `palfrey` | Source credibility, editorial oversight, legal accountability, track record | Opus |
| **Algorithmic analyst** | `noble` | Amplification effects, bias in ranking, documented case comparisons | Sonnet |
| **Social-context analyst** | `boyd` | Contextual framing, audience, networked publics effects | Opus |
| **Pedagogy** | `kafai` | Teaching wrap-up, activity generation, level-appropriate presentation | Sonnet |

Notably absent: Jenkins and Ito. The workshop is oriented around evaluation and teaching, not participation or learning pathways. If the case escalates to a participation question or a connected-learning question, Rheingold escalates to the full analysis team.

## Orchestration flow

```
Input: specific source/claim/artifact + user level + optional context
        |
        v
+---------------------------+
| Rheingold (Opus, external)|  Phase 0: Rheingold classifies
| Chair (router)            |          and dispatches to workshop team
+---------------------------+
        |
        v
+---------------------------+
| Palfrey (Opus)            |  Phase 1: Institutional analysis
| Credibility framework     |          - editorial oversight
+---------------------------+          - legal accountability
        |                              - track record
        |                              - transparency
        |                              - bias profile
        v
+---------------------------+
| Noble (Sonnet)            |  Phase 2: Algorithmic analysis
| Bias and amplification    |          - how did this reach the learner?
+---------------------------+          - documented similar cases
        |                              - power asymmetry
        v
+---------------------------+
| boyd (Opus)               |  Phase 3: Contextual analysis
| Networked publics framing |          - audience assumed vs. actual
+---------------------------+          - contextual integrity check
        |                              - what this looks like in practice
        v
+---------------------------+
| Kafai (Sonnet)            |  Phase 4: Pedagogical wrap-up
| Teaching presentation     |          - key takeaways for learner
+---------------------------+          - optional activity for classroom use
        |                              - level-appropriate framing
        v
              +---------------------------+
              | Rheingold (Opus)          |  Phase 5: Synthesize and record
              | Unified workshop output   |
              +---------------------------+
                         |
                         v
                  Final workshop response
                  + DigitalLiteracyReview Grove record
```

Phases 1-3 can run in parallel. Phase 4 consumes their output. This workshop team is sequential-parallel rather than fully parallel because Kafai's pedagogy depends on the specialists' analyses being complete.

## Workshop output

### Primary output: Workshop response

A structured analysis of the specific case, organized as:

1. **The artifact** -- what was evaluated, with stable reference
2. **Institutional reading** -- Palfrey's findings
3. **Algorithmic reading** -- Noble's findings
4. **Contextual reading** -- boyd's findings
5. **Synthesis** -- Rheingold's integrated verdict
6. **Teaching takeaway** -- Kafai's wrap-up for the learner or classroom

### Grove record: DigitalLiteracyReview

```yaml
type: DigitalLiteracyReview
subject: <artifact reference>
reviewers:
  - palfrey
  - noble
  - boyd
institutional_reading:
  verdict: high | mixed | low
  factors: [...]
algorithmic_reading:
  verdict: neutral | amplified | suppressed
  factors: [...]
contextual_reading:
  verdict: context_appropriate | context_violation | ambiguous
  factors: [...]
synthesis: <integrated reading>
teaching_takeaway: <Kafai's wrap-up>
confidence: 0.85
concept_ids:
  - diglit-source-credibility
  - diglit-algorithmic-bias
  - diglit-fact-checking
```

## Input contract

1. **The artifact** (required). URL, quotation, claim, screenshot, or Grove hash of content to evaluate.
2. **Context** (optional). Where the learner encountered it, what prompted the question.
3. **User level** (optional). Shapes Kafai's wrap-up.

## When the workshop escalates

The workshop escalates to the full analysis team when:

- **Participation dimensions emerge.** "This is a fan-community remix that looks like misinformation" -- needs Jenkins's framing.
- **Learning pathway questions arise.** "How do I help my student develop this as a habit?" -- needs Ito's framing.
- **The case turns out to be multi-artifact or systemic** rather than a single case.

In all these cases, Rheingold re-routes to `digital-literacy-analysis-team`.

## Synthesis rules

Workshop synthesis uses a simpler rule set than the analysis team:

### Rule 1 -- Verdicts must agree or be explicitly noted as disagreeing

If institutional, algorithmic, and contextual readings all converge, report high confidence. If they diverge, present all three with framing and let the learner understand why a source can be "credible by one measure and problematic by another."

### Rule 2 -- Evidence before judgment

Every verdict must be backed by concrete evidence in the Grove record. No verdicts based on vibes.

### Rule 3 -- Teaching takeaway is not optional

Kafai's wrap-up is part of every workshop output. The workshop is not just evaluation; it is modeled evaluation that a learner can learn from.

## Token / time cost

- **Palfrey** -- 1 Opus invocation, ~30K tokens
- **Noble** -- 1 Sonnet invocation, ~25K tokens
- **boyd** -- 1 Opus invocation, ~30K tokens
- **Kafai** -- 1 Sonnet invocation, ~20K tokens
- **Rheingold** -- 1 Opus synthesis, ~20K tokens
- **Total** -- 125-150K tokens, 3-8 minutes wall-clock

Cheaper and faster than the analysis team. Use it whenever the question fits.

## Configuration

```yaml
name: digital-literacy-workshop-team
chair: rheingold
specialists:
  - institutional: palfrey
  - algorithmic: noble
  - social_context: boyd
pedagogy: kafai

parallel: true
timeout_minutes: 8
```

## Invocation

```
> digital-literacy-workshop-team: Evaluate this article: [URL]. Context: my uncle shared it in the family group chat. I want to understand whether to trust it and what to say back.

> digital-literacy-workshop-team: A student brought me this website as a source for a research paper. Help me walk through how to evaluate it with them. [URL] Level: educator.

> digital-literacy-workshop-team: ChatGPT gave me this historical claim: "[quote]". How should I evaluate it?
```

## Limitations

- The workshop expects a single concrete artifact. Vague or open-ended questions get routed to the analysis team.
- The workshop does not produce new research; it applies existing frameworks to the specific case.
- The workshop does not replace legal advice for defamation, fraud, or copyright disputes. Palfrey will flag these cases explicitly.
- Fast turnaround comes at the cost of depth. If the case truly requires full multi-framework analysis, the analysis team is the right choice.
