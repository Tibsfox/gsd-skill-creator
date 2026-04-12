---
name: geography-analysis-team
type: team
category: geography
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/geography/geography-analysis-team/README.md
description: Full Geography Department analysis team for multi-domain problems spanning physical, human, environmental, geopolitical, and cartographic geography. Humboldt classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Carson. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the domain is not obvious and different geographic perspectives may yield different insights. Not for routine single-domain questions.
superseded_by: null
---
# Geography Analysis Team

Full-department multi-perspective analysis team for geographic problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, following the same orchestration pattern as the math department's `math-investigation-team`.

## When to use this team

- **Multi-domain problems** spanning physical, human, environmental, geopolitical, and cartographic geography -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different geographic perspectives (e.g., "why is Bangladesh so vulnerable to flooding?" requires physical, social, environmental, and political analysis).
- **Graduate-level work** requiring coordinated input from multiple specialists.
- **Novel problems** where the user does not know which specialist to invoke, and Humboldt's classification is the right entry point.
- **Cross-domain synthesis** -- when understanding a geographic phenomenon requires seeing it through multiple lenses (physical process via Reclus, social vulnerability via Massey, environmental policy via Carson, cartographic visualization via Tobler).
- **Contested interpretations** -- when a problem has legitimate disagreement across perspectives and the user needs to see the debate.

## When NOT to use this team

- **Routine single-domain questions** -- use the specialist directly via Humboldt. "What is an oxbow lake?" does not need seven agents.
- **Pure cartographic tasks** where the content is defined and only the map needs producing -- use `tobler` directly.
- **Fieldwork planning** where the study design is straightforward -- use `fieldwork-team`.
- **Beginner-level teaching** with no research component -- use `carson` directly.

## Composition

The team runs all seven Geography Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `humboldt` | Classification, orchestration, synthesis | Opus |
| **Physical geography** | `reclus` | Earth systems, landforms, climate, hydrology | Opus |
| **Human/social geography** | `massey` | Social construction of space, power-geometry, inequality | Sonnet |
| **Cultural landscape** | `sauer` | Landscape morphology, human-environment interaction | Opus |
| **Geopolitics** | `said-g` | Critical geopolitics, postcolonial analysis, territorial conflict | Sonnet |
| **Cartography/GIS** | `tobler` | Spatial analysis, mapping, projection, visualization | Sonnet |
| **Pedagogy/Environment** | `carson` | Level-appropriate explanation, environmental communication | Sonnet |

Three agents run on Opus (Humboldt, Reclus, Sauer) because their tasks require deep integrative or historical reasoning. Four run on Sonnet because their tasks are well-defined and analytically bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior GeographySession hash
        |
        v
+---------------------------+
| Humboldt (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (explain/analyze/map/evaluate/fieldwork-design/compare)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Reclus   Massey    Sauer   Said-g   Tobler  (Carson
   (phys)   (human)  (cultrl) (geopol) (carto)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, analyzing the same
             problem from their disciplinary perspective. Each
             produces a Grove record. Humboldt activates only
             the relevant subset -- not all 5 are invoked on
             every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Humboldt (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile or present
              +---------------------------+            multiple perspectives
                         |                           - identify convergence
                         v                           - flag disagreements
              +---------------------------+
              | Carson (Sonnet)           |  Phase 4: Communication
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up
                         v
              +---------------------------+
              | Humboldt (Opus)           |  Phase 5: Record
              | Produce GeographySession |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + GeographySession Grove record
```

## Synthesis rules

Humboldt synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion from different perspectives (e.g., Reclus identifies physical flood risk and Massey identifies social vulnerability in the same area), mark the finding as high-confidence. Cross-perspective convergence is the strongest signal available.

### Rule 2 -- Diverging perspectives are preserved, not suppressed

Geography often involves legitimate interpretive disagreement. When specialists offer different explanations or framings, Humboldt does not force reconciliation. Instead:

1. State both perspectives with attribution ("Reclus attributes the pattern to climate change; Massey attributes it to economic restructuring").
2. Identify whether the disagreement is about facts (testable) or interpretation (perspectival).
3. If factual, re-delegate to the relevant specialist for verification.
4. If perspectival, present both honestly. Geography's strength is multi-perspectival analysis.

### Rule 3 -- Physical context grounds social analysis

When Reclus identifies a physical process that constrains or enables the social pattern under analysis, the physical context takes priority as a boundary condition. Social processes operate within physical constraints, not independently of them.

### Rule 4 -- Critical perspectives are not optional

When Said-g or Massey identifies a power dynamic or colonial legacy relevant to the analysis, this is not a footnote but a core finding. Humboldt integrates critical perspectives into the main synthesis, not a sidebar.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Carson adapts the presentation -- simpler language, more analogies, and observation-based learning for lower levels; technical writing and theoretical framing for higher levels. The geographic content does not change, only the communication strategy.

## Input contract

The team accepts:

1. **User query** (required). Natural language geographic question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`. If omitted, Humboldt infers.
3. **Prior GeographySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Shows the geographic reasoning from each relevant perspective
- Credits the specialists involved
- Notes any unresolved disagreements or alternative interpretations
- Highlights connections across physical, human, environmental, and political dimensions
- Suggests follow-up explorations

### Grove record: GeographySession

```yaml
type: GeographySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: analyze
  user_level: graduate
agents_invoked:
  - humboldt
  - reclus
  - massey
  - sauer
  - said-g
  - tobler
  - carson
work_products:
  - <grove hash of GeographicAnalysis from reclus>
  - <grove hash of GeographicAnalysis from massey>
  - <grove hash of FieldReport from sauer>
  - <grove hash of GeographicAnalysis from said-g>
  - <grove hash of SpatialModel from tobler>
  - <grove hash of GeographicExplanation from carson>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

## Escalation paths

### Internal escalations (within the team)

- **Physical-social disagreement:** When Reclus and Massey explain the same pattern differently (e.g., Reclus: "the region is dry," Massey: "the region is water-scarce due to inequitable distribution"), both perspectives are presented. The disagreement is substantive, not an error.
- **Cartographic critique:** When Said-g critiques a map choice that Tobler made, Humboldt presents both the technical rationale and the political critique.
- **Missing data:** When a specialist cannot answer because key data is unavailable, report this honestly and suggest what data would be needed.

### External escalations (to the user)

- **Genuinely open research question:** If the problem is at the frontier of geographic knowledge, report all evidence gathered and state honestly what is unknown.
- **Outside geography:** If the problem requires domain expertise outside geography (engineering, medicine, law), Humboldt acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per analysis:

- **Humboldt** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Reclus, Sauer) + 3 Sonnet (Massey, Said-g, Tobler), ~30--60K tokens each
- **Carson** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200--400K tokens, 5--15 minutes wall-clock

This cost is justified for multi-domain and research-level problems. For single-domain or routine problems, use the specialist directly.

## Configuration

```yaml
name: geography-analysis-team
chair: humboldt
specialists:
  - physical: reclus
  - human: massey
  - cultural: sauer
  - geopolitical: said-g
  - cartographic: tobler
pedagogy: carson

parallel: true
timeout_minutes: 15

# Humboldt may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full investigation
> geography-analysis-team: Why is Bangladesh one of the most climate-vulnerable
  countries in the world? Level: graduate.

# Multi-domain problem
> geography-analysis-team: Analyze the geographic dimensions of the water
  crisis in Cape Town (2017-2018). I want the physical, social, political,
  and cartographic perspectives.

# Follow-up
> geography-analysis-team: (session: grove:abc123) Now compare that with
  Chennai's water crisis.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Questions requiring specialized sub-disciplines (e.g., seismology, demography, remote sensing image processing) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at synthesis. This preserves independence but prevents real-time collaboration.
- Research-level open questions may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
