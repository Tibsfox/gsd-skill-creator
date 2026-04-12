---
name: environmental-practice-team
type: team
category: environmental
status: stable
origin: tibsfox
first_seen: 2026-04-12
description: Community-scale restoration and sustainability practice pipeline. Wangari leads with community implementation design, Shiva provides agroecology and biodiversity context, Commoner cross-checks the biogeochemical and systems feasibility, and Orr produces community training and education materials. Use for restoration program design, sustainability implementation, community-scale intervention planning, and the translation of scientific findings into community-ready action. Not for pure ecosystem diagnosis or multi-wing research questions.
---
# Environmental Practice Team

A focused four-agent team for community-scale restoration, sustainability implementation, and intervention planning. Wangari leads; Shiva provides agroecological and biodiversity context; Commoner verifies the systems-level feasibility and unintended consequences; Orr produces training and education materials for community implementation. This team mirrors the `rca-postmortem-team` pattern: a pipeline optimized for turning findings into action and documentation.

## When to use this team

- **Restoration program design** — "We want to restore this degraded watershed / forest / grassland. How do we do it?"
- **Sustainability intervention planning** — "We want to shift this agricultural system / this community / this operation toward lower environmental impact. What's the plan?"
- **Community-led conservation program** — "How do we organize a tree-planting / watershed / seed-saving / wetland restoration program in this community?"
- **Translation of findings into action** — when specialist analysis has established the "what" and the user now needs "how."
- **Community training and education design** — when program materials need to teach community members the skills the program requires.
- **Project documentation** — creating the program documentation that will persist past the initial funding or project phase.

## When NOT to use this team

- **Pure ecological diagnosis** — use `environmental-workshop-team`. Practice team assumes the diagnosis is known or is not the primary question.
- **Pure policy review** — use `environmental-analysis-team`. Practice team is implementation-focused.
- **Research-level questions** — use `environmental-analysis-team`. Practice team operates on established science.
- **Pure pedagogy with no implementation angle** — use `orr` directly.
- **Single-community case analysis without intervention** — use `shiva` or `wangari` directly.

## Composition

Four agents, run as a pipeline from design through documentation:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Implementation designer** | `wangari` | Community-scale intervention design, outcome-linked structures | Sonnet |
| **Agroecology / Biodiversity advisor** | `shiva` | System context, distributional analysis, biodiversity consequences | Opus |
| **Systems feasibility cross-check** | `commoner` | Mass balance, unintended consequences, system coupling | Sonnet |
| **Training / Pedagogy producer** | `orr` | Community training materials, educational explanations | Sonnet |

One Opus agent (Shiva) because distributional analysis and system evaluation are judgment-heavy. Three Sonnet agents because community implementation design, mass balance checks, and training material production are structured rather than open-ended.

## Orchestration flow

```
Input: community context + intervention target + scale + mode (design/evaluate/review)
        |
        v
+---------------------------+
| Shiva (Opus)              |  Phase 1: System context
| Agroecology advisor       |          - characterize the current system
+---------------------------+          - identify biodiversity and distributional stakes
        |                              - flag constraints (political, ecological, economic)
        v
+---------------------------+
| Wangari (Sonnet)          |  Phase 2: Program design
| Implementation designer   |          - design community-scale intervention
+---------------------------+          - organizing unit, payment structure, leadership
        |                              - monitoring and decision rights
        v
+---------------------------+
| Commoner (Sonnet)         |  Phase 3: Feasibility check
| Systems cross-check       |          - mass balance of proposed intervention
+---------------------------+          - unintended consequences
        |                              - scale coupling check
        v
+---------------------------+
| Wangari (Sonnet)          |  Phase 4: Revise and finalize
| Incorporate findings      |          - address Commoner's findings
+---------------------------+          - produce final program design
        |
        v
+---------------------------+
| Orr (Sonnet)              |  Phase 5: Training materials
| Community training        |          - produce facilitator guides, participant
+---------------------------+            handouts, monitoring checklists
        |                              - adapt for literacy level and language context
        v
              EnvironmentalAssessment (Wangari) +
              EnvironmentalAnalysis (Shiva) +
              EnvironmentalAnalysis (Commoner) +
              EnvironmentalExplanation (Orr training materials)
              Grove records
```

## Phase details

### Phase 1 -- System context (Shiva)

Shiva characterizes the agricultural, ecological, and social system the intervention will act on. Outputs include:

- Current agricultural or ecological system and its dynamics
- Biodiversity and agrobiodiversity baseline
- Distributional analysis — who currently benefits, who currently bears costs
- Political and economic constraints on intervention
- Historical interventions in the same community or comparable communities — what worked and what failed

Shiva's output becomes the input to Wangari's design. It prevents the most common failure mode of community interventions: parachuting a design into a context the designer did not understand.

### Phase 2 -- Program design (Wangari)

Wangari designs the intervention using Shiva's context. The design covers:

- Ecological target (what will change and by how much)
- Organizing unit (household / group / village / network)
- Leadership structure and decision rights
- Payment structure (outcome-linked by default)
- Monitoring plan (ecological and social)
- Gender dimensions
- Risks and mitigations
- Funding structure and sustainability after initial phase

### Phase 3 -- Feasibility check (Commoner)

Commoner runs the proposed intervention through a systems feasibility check:

- **Mass balance** — Do the ecological targets balance? Is the proposed N or C flux achievable?
- **Unintended consequences** — What does the intervention displace? Where do its outputs go?
- **Scale coupling** — Is the intervention scale matched to the problem scale? A household-scale intervention against a watershed-scale problem won't work.
- **Four laws check** — everything connected? everything goes somewhere? no free lunch? The laws are Commoner's structured prompt for unintended consequences.

Commoner's output is an EnvironmentalAnalysis of the intervention's feasibility, flagging concerns for Wangari to address in Phase 4.

### Phase 4 -- Revise and finalize (Wangari)

Wangari incorporates Commoner's findings:

- Scale corrections (e.g., increase organizing unit from household to group if mass balance demands it)
- Payment structure adjustments (e.g., tie to a biogeochemical outcome that Commoner suggested)
- Risk mitigation additions (e.g., contingency for an unintended consequence Commoner flagged)

The final design is recorded as an EnvironmentalAssessment with full program details.

### Phase 5 -- Training materials (Orr)

Orr produces the educational materials the program needs for implementation:

- **Facilitator guides** — how the program's trainers will teach participants
- **Participant handouts** — materials participants take home and reference
- **Monitoring checklists** — what participants will measure and record
- **Community meeting discussion prompts** — for ongoing program governance

These are level-calibrated to the community's education and literacy context. Orr's place-based default means examples are drawn from the community's own landscape rather than from abstract or distant ones.

## Synthesis rules

The practice team's synthesis is pipeline-shaped, not parallel. The rules are:

1. **Shiva's system context frames everything.** The final program must be consistent with Shiva's Phase 1 characterization. If Wangari's design contradicts Shiva's context, the design is wrong.
2. **Commoner's feasibility check is authoritative.** If Commoner flags a mass balance problem, Wangari must address it before the design is finalized. Commoner can block a design that does not balance.
3. **Wangari owns the program architecture.** Implementation details — organizing unit, payment structure, leadership — are Wangari's call. Shiva and Commoner inform; Wangari decides.
4. **Orr does not substitute for implementation expertise.** Training materials are a product, not a replacement for on-the-ground facilitators. Orr's output is written to support trained community members, not to replace them.
5. **Every output disaggregates by gender and land tenure.** Standard discipline from both Shiva and Wangari — applied automatically to every deliverable.

## Input contract

The team accepts:

1. **Community or context** (required). The community, landscape, or system the intervention will act on.
2. **Intervention target** (required). What the intervention is supposed to achieve.
3. **Scale** (required). Field, farm, community, watershed, landscape.
4. **Mode** (required). One of: `design`, `evaluate`, `review`.
5. **Data** (optional). Ecological baseline, household surveys, prior project records, funding constraints.
6. **Literacy and language context** (optional, for Orr's training materials). Defaults to community adult literacy as reported in context.

## Output contract

### Primary outputs

- **EnvironmentalAnalysis (Shiva)** — system context for the intervention
- **EnvironmentalAssessment (Wangari)** — final program design
- **EnvironmentalAnalysis (Commoner)** — systems feasibility analysis
- **EnvironmentalExplanation (Orr)** — training and community materials

### Example Grove record set

```yaml
# Shiva's system context
type: EnvironmentalAnalysis
subject: "Agricultural system, upper Tana basin, Kenya"
analysis_type: agricultural_system_analysis
# ... context, actors, constraints ...

# Wangari's program design
type: EnvironmentalAssessment
subject: "Watershed reforestation program, upper Tana basin, Kenya"
assessment_type: community_program_design
# ... ecological target, social architecture, monitoring, risks ...

# Commoner's feasibility check
type: EnvironmentalAnalysis
subject: "Systems feasibility of proposed Tana basin reforestation"
analysis_type: intervention_evaluation
# ... mass balance, coupling, unintended consequences ...

# Orr's training materials
type: EnvironmentalExplanation
subject: "Facilitator guide and participant materials, Tana basin reforestation"
target_level: public
# ... facilitator guide, participant handouts, monitoring checklists ...
```

## Escalation paths

### Internal escalations

- **Shiva finds context makes intervention infeasible:** Wangari cannot design around a fundamental context mismatch. Escalate to user: either accept the infeasibility finding and redesign the intervention goal, or accept the risk and proceed.
- **Commoner finds a feasibility-blocking mass balance problem:** Wangari must revise. If revision is impossible within the intervention's constraints, escalate to user.
- **Orr finds a training material target the program design does not support:** Escalate to Wangari to adjust the program, or raise with the user to resolve.

### External escalations (to other teams)

- **To environmental-analysis-team:** When the implementation question reveals research-level uncertainty (e.g., "we need to know the watershed-scale N budget to size the intervention, but no budget exists"), escalate to the analysis team.
- **To environmental-workshop-team:** When a pure ecological diagnosis is needed before implementation design can proceed.

## Token / time cost

Approximate cost per practice-team cycle:

- **Shiva** — 1 Opus invocation, ~60K tokens
- **Wangari** — 2 Sonnet invocations (initial + revised), ~60K tokens
- **Commoner** — 1 Sonnet invocation, ~30K tokens
- **Orr** — 1 Sonnet invocation (can be larger for extensive materials), ~40K tokens
- **Total** — 180-220K tokens, 5-10 minutes wall-clock

Comparable cost to the workshop team, slightly more than a single-specialist call, and substantially less than the full analysis team.

## Configuration

```yaml
name: environmental-practice-team
lead: wangari
advisors:
  - context: shiva
  - feasibility: commoner
materials: orr

sequential: true  # Phase 1 -> 2 -> 3 -> 4 -> 5
timeout_minutes: 12
```

## Invocation

```
# Program design
> environmental-practice-team: Design a watershed reforestation program for the upper
  Tana basin, Kenya, using women's groups as the organizing unit. Mode: design.

# Agroecology transition
> environmental-practice-team: Design a transition from monoculture Bt cotton to
  cotton-pigeonpea intercrop for Maharashtra dryland smallholders. Mode: design.

# Review an existing proposal
> environmental-practice-team: Review the NGO-led mangrove restoration proposal for
  Tanzanian coastal villages and produce a revised design addressing the gaps.
  Mode: review.

# Sustainability implementation
> environmental-practice-team: Design a community-scale plan to shift this farming
  cooperative toward lower nitrogen inputs while maintaining household income.
  Mode: design.
```

## Limitations

- The team is implementation-focused; it assumes the scientific basis for the intervention is established. When the basis is uncertain, route to the analysis team first.
- Community-specific adaptations (language, local custom, specific history) require human facilitators on the ground. The team's output is design and materials, not substitute for community engagement.
- Outcome predictions are model-based; actual outcomes depend on implementation quality, political context, and circumstance. The team does not guarantee outcomes it designs for.
- Training materials generated by Orr are starting points for local adaptation, not finished products for direct distribution.
