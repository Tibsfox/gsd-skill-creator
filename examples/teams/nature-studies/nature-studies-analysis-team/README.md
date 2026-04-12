---
name: nature-studies-analysis-team
type: team
category: nature-studies
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/nature-studies/nature-studies-analysis-team/README.md
description: Full Nature Studies Department analysis team for multi-wing naturalist investigations spanning identification, behavior, biogeography, and teaching. Linnaeus classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Louv. Use for research-level questions, advanced multi-wing work, or any naturalist problem where the wing is not obvious and different perspectives may yield different insights. Not for routine one-shot identification, pure habitat questions, or pure pedagogy.
superseded_by: null
---
# Nature Studies Analysis Team

Full-department multi-method analysis team for naturalist problems that span wings or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response, analogous to how `math-investigation-team` handles multi-domain mathematical problems.

## When to use this team

- **Multi-wing problems** that span identification, behavior, biogeography, and teaching -- where no single specialist covers the full scope.
- **Research-level naturalist questions** where the wing is not obvious and the problem may yield different insights from different perspectives.
- **Advanced or research-grade work** requiring coordinated input from multiple specialists (for example, a biogeographic question that needs Peterson's ID discipline, Goodall's behavioral context, and Humboldt's range reasoning).
- **Novel problems** where the user does not know which specialist to invoke, and Linnaeus's classification is the right entry point.
- **Cross-wing synthesis** -- when understanding a species or a habitat requires seeing it through multiple lenses (taxonomy via Linnaeus, life cycle via Merian, behavior via Goodall, range via Humboldt).
- **Verification of complex claims** -- when an identification needs taxonomic cross-check, behavioral verification, and biogeographic plausibility at the same time.

## When NOT to use this team

- **Simple one-shot IDs** -- use `peterson` or `audubon` directly. The analysis team's token cost is substantial.
- **Pure pedagogy** with no investigative component -- use `louv` directly.
- **Habitat questions** that are purely biogeographic -- use `von-humboldt-nat` directly or `nature-studies-workshop-team` if also identification-heavy.
- **Ongoing sit-spot or journaling** practice -- use `nature-studies-practice-team`.
- **Single-wing problems** where the classification is obvious -- route to the specialist via `linnaeus` in single-agent mode.

## Composition

The team runs all seven Nature Studies Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `linnaeus` | Classification, orchestration, synthesis | Opus |
| **Field ethology** | `goodall-nat` | Longitudinal behavior, Tinbergen framework, individual recognition | Opus |
| **Entomology / metamorphosis** | `merian` | Insect life cycles, host-plant relationships, sketch-first journaling | Opus |
| **Ornithology** | `audubon` | Bird ID, voice, field-guide description | Sonnet |
| **Biogeography** | `von-humboldt-nat` | Habitat assemblages, elevational gradients, range | Sonnet |
| **Field-guide methodology** | `peterson` | Diagnostic features, confusion species, confidence rating | Sonnet |
| **Pedagogy** | `louv` | Level adaptation, nature-based learning, entry-point design | Sonnet |

Three agents run on Opus (Linnaeus, Goodall, Merian) because their tasks require deep judgment-heavy reasoning. Four run on Sonnet because their tasks are structured and computationally bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior NatureStudiesSession hash
        |
        v
+---------------------------+
| Linnaeus (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - wing (may be multi-wing)
+---------------------------+          - type (identify/interpret/record/explain/explore)
        |                              - confidence needed (casual/checklist/research)
        |                              - user level (beginner/intermediate/advanced/research)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Peterson  Audubon  Merian  Goodall  Humboldt   (Louv
    (ID)     (bird)   (insect) (ethol)  (biogeo)    waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Linnaeus activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Linnaeus (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Louv (Sonnet)             |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Linnaeus (Opus)           |  Phase 5: Record
              | Produce NatureStudies-    |          - link all work products
              | Session                   |          - emit Grove record
              +---------------------------+
                         |
                         v
                  Final response to user
                  + NatureStudiesSession Grove record
```

## Synthesis rules

Linnaeus synthesizes the specialist outputs using these rules, directly analogous to the `math-investigation-team` synthesis protocol.

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (for example, Peterson identifies the bird as a Cooper's Hawk and Audubon independently confirms it from the vocalization), mark the conclusion as high-confidence. Cross-specialist convergence is the strongest signal available in field naturalism, where any single observation can be ambiguous.

### Rule 2 -- Diverging findings are preserved and investigated

When specialists disagree, Linnaeus does not force a reconciliation. Instead:

1. State both findings with attribution ("Peterson proposes Cooper's Hawk; Audubon notes the vocalization is not a typical Cooper's call").
2. Check for error: re-delegate to the specialist whose finding is less confident.
3. If the disagreement persists after re-checking, report honestly to the user with both candidates and the evidence for each.
4. Do not pick a winner on Linnaeus's own authority.

### Rule 3 -- Confidence is composed, not averaged

Naturalist answers frequently carry uncertainty. A "tentative ID" from Peterson combined with a "typical behavior" observation from Goodall becomes a composite confidence that is contextually reasoned, not a mechanical average. Linnaeus reports the individual confidences and the combined reasoning.

### Rule 4 -- Biogeography is the first filter

Humboldt's range and habitat context applies to almost every identification question. A plausible ID for a species not in the region is less likely than a less plausible ID for a species that is common there. Range filtering is applied at synthesis time if it was not applied at the specialist level.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Louv adapts the presentation -- simpler language, more scaffolding, worked examples for lower levels; concise technical writing for higher levels. The naturalist content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural-language naturalist question, observation report, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `research`. If omitted, Linnaeus infers from the query.
3. **Attached media** (optional). Photos, recordings, sketches, or field notes.
4. **Prior NatureStudiesSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query (ID, interpretation, record, explanation)
- States confidence explicitly for any claim that is not certain
- Credits the specialists involved
- Notes any unresolved disagreements or tentative conclusions
- Suggests follow-up observations when relevant

### Grove record: NatureStudiesSession

```yaml
type: NatureStudiesSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  wing: multi-wing
  type: explore
  confidence_needed: research-grade
  user_level: advanced
agents_invoked:
  - linnaeus
  - peterson
  - audubon
  - merian
  - goodall-nat
  - von-humboldt-nat
  - louv
work_products:
  - <grove hash of NatureStudiesAnalysis>
  - <grove hash of NatureStudiesFieldRecord>
  - <grove hash of NatureStudiesExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: advanced
confidence: high
```

Each specialist's output is also a standalone Grove record linked from the NatureStudiesSession.

## Escalation paths

### Internal escalations (within the team)

- **Peterson proposes an ID, Audubon's vocal evidence contradicts it:** Re-check both. If the contradiction persists, report both candidates with evidence for each. Vocal evidence is often more reliable than visual for closely related species.
- **Goodall interprets behavior, Merian notes the life-cycle stage changes the interpretation:** Re-route the revised problem. A larval-stage behavior and an adult-stage behavior are effectively different problems.
- **Humboldt flags the observation as out-of-range:** Treat as a potential rarity. Apply higher documentation standards and consider whether the ID needs revision.
- **Louv notes that the user's level does not match the team's output:** Run an additional adaptation pass. The team should not deliver content the user cannot use.

### External escalations (from other teams)

- **From nature-studies-workshop-team:** When an identification workshop reveals that the question is actually about behavior, habitat, or multi-wing context, escalate to the analysis team.
- **From nature-studies-practice-team:** When an accumulated observation sequence has become rich enough to warrant full analysis, escalate to the analysis team.
- **From science department:** When an ecological observation has reached the threshold where experimental validation is needed, collaborate with the science department for methodology.

### Escalation to the user

- **Genuine open question:** If the analysis reaches a conclusion that is not in any reference database and may be novel, report honestly with all evidence gathered and suggest the appropriate citizen-science contribution path.
- **Outside nature studies:** If the problem requires expertise in another domain (formal ecology, environmental policy, conservation advocacy), Linnaeus acknowledges the boundary and suggests appropriate departments.

## Token / time cost

Approximate cost per full analysis:

- **Linnaeus** -- 2 Opus invocations (classify + synthesize), ~30K tokens total
- **Specialists in parallel** -- 2 Opus (Goodall, Merian) + 3 Sonnet (Audubon, Humboldt, Peterson), ~25-50K tokens each
- **Louv** -- 1 Sonnet invocation, ~15K tokens
- **Total** -- 150-300K tokens, 4-12 minutes wall-clock

This cost is justified for multi-wing and research-level questions. For single-wing or routine questions, use the specialist directly or a focused team.

## Configuration

```yaml
name: nature-studies-analysis-team
chair: linnaeus
specialists:
  - ethology: goodall-nat
  - entomology: merian
  - ornithology: audubon
  - biogeography: von-humboldt-nat
  - methodology: peterson
pedagogy: louv

parallel: true
timeout_minutes: 12

# Linnaeus may skip specialists whose wing is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full analysis
> nature-studies-analysis-team: Investigate the relationship between declining
  monarch butterfly populations, native milkweed distribution in the Midwest,
  and the role of roadside plantings as migration waypoints. Level: research.

# Multi-wing problem
> nature-studies-analysis-team: Why are Pacific Northwest tidepool communities
  shifting? I want the ecological story, the species-level changes, the
  biogeographic reasoning, and something I can teach to a naturalist group.

# Follow-up
> nature-studies-analysis-team: (session: grove:nat456) Extend last week's
  chickadee flock analysis to include the starling interactions we have
  been seeing.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (marine biology, formal ecology, conservation genetics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time collaboration.
- The team does not access external databases beyond what each agent's tools provide (Bash for lookups, Read/Grep for reference material).
- Research-level open questions may exhaust all specialists without a resolution. The team reports this honestly rather than speculating.
