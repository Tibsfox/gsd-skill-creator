---
name: environmental-analysis-team
type: team
category: environmental
status: stable
origin: tibsfox
first_seen: 2026-04-12
description: Full Environmental Department investigation team for multi-wing problems spanning ecosystems, Earth systems, human impacts, climate, sustainability, and environmental justice. Carson classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with pedagogical framing from Orr. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the wing is not obvious and different environmental perspectives may yield different insights. Not for routine reference lookups, pure pedagogy, or single-wing problems.
---
# Environmental Analysis Team

Full-department multi-method investigation team for environmental problems that span wings or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `rca-deep-team` runs multiple analysis methods on an incident.

## When to use this team

- **Multi-wing problems** spanning ecosystems, Earth systems, human impacts, climate, sustainability, and environmental justice — where no single specialist covers the full scope.
- **Research-level questions** where the wing is not obvious and the problem may yield different insights from different environmental perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a watershed problem that needs Commoner's nitrogen budget, Leopold's community-level assessment, Shiva's agricultural system analysis, and Wangari's community-intervention framing).
- **Novel problems** where the user does not know which specialist to invoke, and Carson's classification is the right entry point.
- **Cross-wing synthesis** — when understanding an environmental system requires seeing it through multiple lenses (ecological community via Leopold, biogeochemistry via Commoner, social/political via Shiva/Wangari, pedagogical via Orr).
- **Complex policy or project review** — when a proposed intervention needs ecological, biogeochemical, community, and justice analysis simultaneously.

## When NOT to use this team

- **Simple reference lookups** — ask the specialist directly. The analysis team's token cost is substantial.
- **Pure ecosystem diagnosis** where the wing is clear — use `environmental-workshop-team`.
- **Pure community implementation work** — use `environmental-practice-team`.
- **Pedagogical translation only** — use `orr` directly.
- **Single-wing problems** where the classification is obvious — route to the specialist via `carson` in single-agent mode.

## Composition

The team runs all seven Environmental Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `carson` | Classification, orchestration, synthesis | Opus |
| **Ecosystems specialist** | `leopold` | Community ecology, land ethic, biodiversity | Opus |
| **Systems / biogeochemistry specialist** | `commoner` | Biogeochemical cycles, systems diagnosis | Sonnet |
| **Biodiversity / agroecology specialist** | `shiva` | Agricultural systems, justice, biodiversity | Opus |
| **Wilderness / reference-state specialist** | `muir` | Reference conditions, protected areas | Sonnet |
| **Community / restoration specialist** | `wangari` | Community-led intervention, grassroots | Sonnet |
| **Pedagogy specialist** | `orr` | Level-appropriate explanation, learning pathways | Sonnet |

Three agents run on Opus (Carson, Leopold, Shiva) because their tasks require deep reasoning and routing judgment. Four run on Sonnet because their tasks are well-defined and bounded in scope.

## Orchestration flow

```
Input: user query + optional user level + optional geographic context + optional prior session hash
        |
        v
+---------------------------+
| Carson (Opus)             |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-wing)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (explain/assess/analyze/design/review)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Leopold  Commoner  Shiva    Muir    Wangari   (Orr
    (ecosys) (biogeo)  (agro/   (ref)   (comm)    waits)
                       justice)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Carson activates only the relevant subset — not all
             5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Carson (Opus)             |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Orr (Sonnet)              |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up questions
                         v
              +---------------------------+
              | Carson (Opus)             |  Phase 5: Record
              | Produce EnvironmentalSession |       - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + EnvironmentalSession Grove record
```

## Synthesis rules

Carson synthesizes the specialist outputs using these rules, directly analogous to the `rca-deep-team` synthesis protocol:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Commoner's nitrogen budget and Leopold's community-level diagnosis both implicate agricultural runoff), mark the finding as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Carson does not force a reconciliation. Instead:

1. State both findings with attribution ("Commoner's mass balance indicates X; Shiva's farm-level data indicates Y").
2. Check for scale mismatch: disagreement often reflects different scales, not different answers.
3. If the disagreement persists after scale check, re-delegate to the specialist whose result is less expected.
4. Report the disagreement honestly to the user.

### Rule 3 -- Reference state grounds current-state claims

When Muir provides a reference condition, it becomes the baseline against which current-state claims are measured. Any degradation claim must be framed against Muir's reference, not against unstated assumptions about "natural" conditions. This prevents the most common misreading where "degraded" simply means "different from what the analyst imagined."

### Rule 4 -- Community and justice framing are not optional extras

Environmental questions that affect communities receive explicit distributional framing from Shiva or Wangari whenever the question has community-level dimensions. Carson does not treat this framing as a stylistic add-on; it is part of the analysis, on the same footing as biogeochemistry or community ecology.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Orr adapts the presentation — simpler language, more scaffolding, place-based examples for lower levels; concise technical writing for higher levels. The environmental content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language environmental question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Carson infers from the query.
3. **Geographic context** (optional). Region, biome, or specific location.
4. **Prior EnvironmentalSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows the reasoning at the appropriate level of detail
- Credits the specialists involved
- Notes any unresolved disagreements or contested findings
- Suggests follow-up explorations or adjacent questions

### Grove record: EnvironmentalSession

```yaml
type: EnvironmentalSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-wing
  complexity: research-level
  type: analyze
  user_level: graduate
geographic_context: <optional>
agents_invoked:
  - carson
  - leopold
  - commoner
  - shiva
  - muir
  - wangari
  - orr
work_products:
  - <grove hash of EnvironmentalAnalysis>
  - <grove hash of EnvironmentalAssessment>
  - <grove hash of EnvironmentalReview>
  - <grove hash of EnvironmentalExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (EnvironmentalAnalysis, EnvironmentalAssessment, EnvironmentalReview, or EnvironmentalExplanation) linked from the EnvironmentalSession.

## Escalation paths

### Internal escalations (within the team)

- **Commoner finds systems imbalance, Leopold cannot confirm community-level consequences:** The systems finding stands, the community-level prediction is flagged as uncertain. Report both with their confidence levels.
- **Shiva's distributional analysis disagrees with Wangari's community assessment:** Often a scale mismatch (system-wide vs. community-specific). Reconcile by specifying the scale, or report both with scale attribution.
- **Muir reports insufficient reference data:** The assessment mode cannot run without a reference. Escalate to ask whether a modeled reference or an analog-site reference is acceptable.
- **Orr finds the content untranslatable at target level:** Re-delegate to specialists to simplify the analysis, or escalate level upward.

### External escalations (from other teams)

- **From environmental-workshop-team:** When a focused ecosystem problem reveals multi-wing dimensions, escalate to environmental-analysis-team.
- **From environmental-practice-team:** When a community implementation question requires broader scientific analysis, escalate here.

### Escalation to the user

- **Contested scientific question:** If specialists converge on "the literature is divided," Carson reports this honestly with the range of positions and the methodological choices driving the divergence.
- **Outside environmental science:** If the problem requires public health epidemiology, legal interpretation, or economic modeling beyond the agents' scope, Carson acknowledges the boundary and suggests appropriate resources.
- **Irreducible uncertainty:** Some environmental questions involve irreducible uncertainty about the future. Carson reports this explicitly rather than generating false precision.

## Token / time cost

Approximate cost per full investigation:

- **Carson** — 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** — 2 Opus (Leopold, Shiva) + 3 Sonnet (Commoner, Muir, Wangari), ~30-60K tokens each
- **Orr** — 1 Sonnet invocation, ~20K tokens
- **Total** — 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-wing and research-level problems. For single-wing or routine problems, use the specialist directly or a focused team.

## Configuration

```yaml
name: environmental-analysis-team
chair: carson
specialists:
  - ecosystems: leopold
  - biogeochemistry: commoner
  - agroecology_justice: shiva
  - reference_state: muir
  - community_restoration: wangari
pedagogy: orr

parallel: true
timeout_minutes: 15

# Carson may skip specialists whose wing is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> environmental-analysis-team: Investigate the relationship between Midwest corn
  agriculture, Gulf of Mexico hypoxia, and coastal fishing communities in Louisiana.
  Level: graduate.

# Multi-wing problem
> environmental-analysis-team: Why does my region's drinking water have rising nitrate
  levels? I want the ecological explanation, the biogeochemical budget, the agricultural
  system context, and a lesson plan I can use with my class.

# Policy review
> environmental-analysis-team: Review the proposed carbon offset afforestation project
  on indigenous-managed grasslands in northern Kenya. Level: advanced.

# Follow-up
> environmental-analysis-team: (session: grove:abc123) Extend the analysis to consider
  climate scenarios through 2050.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., atmospheric chemistry, marine biology of a specific taxon, environmental toxicology at the molecular level) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external computational resources beyond what each agent's tools provide (Read/Grep/Bash for text and simple computation).
- Research-level open questions (e.g., specific feedback magnitudes in future climate states) may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
