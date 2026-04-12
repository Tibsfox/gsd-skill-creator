---
name: engineering-review-team
type: team
category: engineering
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/engineering/engineering-review-team/README.md
description: Full Engineering Department review team for multi-domain design reviews, safety analyses, and complex problems spanning structural, electrical, aerospace, mechanical, materials, and pedagogical domains. Brunel classifies the query and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response. Use for design reviews (SRR, PDR, CDR), safety-critical analysis, professional-level multi-disciplinary problems, or any engineering question where the domain is not obvious and different engineering perspectives may yield different insights.
superseded_by: null
---
# Engineering Review Team

Full-department multi-disciplinary review team for engineering problems that span domains or require comprehensive design review. Runs specialists in parallel and synthesizes their independent findings into a coherent response with safety analysis and design recommendations.

## When to use this team

- **Design reviews** (SRR, PDR, CDR) where structural, electrical, mechanical, materials, and systems perspectives are all needed.
- **Safety-critical analysis** where multiple failure modes from different domains must be evaluated simultaneously.
- **Multi-domain problems** spanning structural, electrical, aerospace, mechanical, and materials engineering -- where no single specialist covers the full scope.
- **Professional-level design problems** with incomplete information, competing constraints, and real-world trade-offs.
- **Cross-domain synthesis** -- when understanding an engineered system requires seeing it through multiple lenses (structural capacity via Roebling, electrical systems via Tesla, thermal behavior via Watt, manufacturability via Lovelace-E).
- **Failure investigation** requiring root cause analysis across multiple engineering disciplines.

## When NOT to use this team

- **Single-domain analysis** where the classification is obvious -- route to the specialist via Brunel in single-agent mode.
- **Simple calculations** -- use the appropriate specialist directly. The review team's token cost is substantial.
- **Pure pedagogy** with no review component -- use polya-e directly.
- **Rapid concept development** -- use the design-sprint-team instead.
- **Systems engineering focus** -- use the systems-team instead.

## Composition

The team runs all seven Engineering Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `brunel` | Classification, orchestration, synthesis, design review leadership | Opus |
| **Electrical / Systems** | `tesla` | Circuit analysis, power systems, control systems, EMC | Opus |
| **Structural / Civil** | `roebling` | Statics, stress analysis, structural design, failure modes | Sonnet |
| **Aerospace / Computational** | `johnson-k` | Orbital mechanics, trajectory, systems engineering, verification | Opus |
| **Mechanical / Thermal** | `watt` | Thermodynamics, heat transfer, mechanisms, fluid systems | Sonnet |
| **Materials / Manufacturing** | `lovelace-e` | Material selection, fabrication, quality control | Sonnet |
| **Pedagogy** | `polya-e` | Level-appropriate explanation, learning pathways | Sonnet |

Three agents run on Opus (Brunel, Tesla, Johnson-K) because their tasks require deep cross-domain reasoning. Four run on Sonnet because their tasks are well-defined and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior EngineeringSession hash
        |
        v
+---------------------------+
| Brunel (Opus)             |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/professional)
        |                              - type (analyze/design/explain/review/verify)
        |                              - user level (beginner/intermediate/advanced/professional)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Tesla   Roebling  Johnson-K   Watt  Lovelace-E (Polya-E
     (elec)  (struct)  (aero/sys) (mech)  (matl)     waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Brunel activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Brunel (Opus)             |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - identify cross-domain risks
                         |                           - produce unified assessment
                         v
              +---------------------------+
              | Polya-E (Sonnet)          |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning context
                         |
                         v
              +---------------------------+
              | Brunel (Opus)             |  Phase 5: Record
              | Produce EngineeringSession|          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + EngineeringSession Grove record
```

## Synthesis rules

### Rule 1 -- Safety findings take priority

Any finding related to safety, structural adequacy, or failure modes is presented first and most prominently, regardless of which specialist produced it. Safety concerns are never buried in technical detail.

### Rule 2 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Roebling and Watt both identify thermal expansion as the critical load case), the finding is marked high-confidence.

### Rule 3 -- Diverging findings are preserved and investigated

When specialists disagree, Brunel does not force reconciliation. Both findings are reported with attribution. If the disagreement is safety-relevant, it is escalated for resolution before a recommendation is issued.

### Rule 4 -- Manufacturability is always checked

Lovelace-E's assessment of whether the design can actually be built is included regardless of the original query domain. A design that cannot be manufactured is not a design.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Polya-E adapts the presentation. Professional users get concise technical language; beginners get scaffolded explanations. The engineering content does not change.

## Input contract

1. **User query** (required). Engineering question, design problem, or review request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `professional`.
3. **Prior EngineeringSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the query
- Leads with safety findings if any
- Shows analysis at the appropriate level
- Credits the specialists involved
- Notes applicable codes and standards
- Identifies unresolved issues or trade-offs
- Suggests next steps

### Grove record: EngineeringSession

```yaml
type: EngineeringSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: professional
  type: review
  user_level: advanced
agents_invoked:
  - brunel
  - tesla
  - roebling
  - johnson-k
  - watt
  - lovelace-e
  - polya-e
work_products:
  - <grove hash of EngineeringAnalysis>
  - <grove hash of EngineeringDesign>
  - <grove hash of EngineeringReview>
  - <grove hash of EngineeringExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: advanced
```

## Escalation paths

### Internal escalations

- **Safety disagreement:** If two specialists disagree on a safety-critical finding, Brunel escalates to the full team for discussion. No safety finding is overridden by a single specialist.
- **Manufacturability conflict:** If Lovelace-E identifies a fabrication impossibility that invalidates a design, the design is sent back to the originating specialist for redesign.
- **Code conflict:** If different codes apply and produce different requirements, Johnson-K (systems) resolves by identifying the governing code.

### External escalation to the user

- **Professional-level safety:** If the problem involves real-world safety-critical design, Brunel notes that AI-generated analysis does not replace licensed professional engineer review.
- **Outside engineering:** If the problem requires expertise outside engineering, Brunel acknowledges the boundary.

## Token / time cost

Approximate cost per review:

- **Brunel** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Tesla, Johnson-K) + 3 Sonnet (Roebling, Watt, Lovelace-E), ~30-60K tokens each
- **Polya-E** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

## Configuration

```yaml
name: engineering-review-team
chair: brunel
specialists:
  - electrical: tesla
  - structural: roebling
  - aerospace: johnson-k
  - mechanical: watt
  - materials: lovelace-e
pedagogy: polya-e

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full design review
> engineering-review-team: Review this bridge design for a 30-meter pedestrian
  crossing. [design details]

# Multi-domain analysis
> engineering-review-team: Why did the Tacoma Narrows Bridge collapse? I want
  the structural analysis, the aerodynamic explanation, and the design process
  failures. Level: advanced.

# Safety investigation
> engineering-review-team: Analyze the failure modes for a pressurized water
  reactor containment vessel. Level: professional.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Highly specialized sub-disciplines (geotechnical, naval architecture, biomedical) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2. Cross-domain insights emerge only at synthesis.
- The team does not replace licensed professional engineer review for real-world safety-critical design.
- Professional-level problems may have regulatory and jurisdictional requirements that the team cannot address.
