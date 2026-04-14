---
name: environmental-workshop-team
type: team
category: environmental
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/environmental/environmental-workshop-team/README.md
description: Focused ecosystem analysis and impact assessment team. Leopold leads with ecological community diagnosis, Muir provides reference-state grounding, Commoner cross-checks biogeochemical mass balance, and Orr translates findings into level-appropriate explanations. Use for ecosystem diagnosis, impact assessment against reference conditions, ecological community analysis, and the scientific basis for conservation decisions. Not for pure community implementation, pure pedagogy, or multi-wing problems that need the full analysis team.
superseded_by: null
---
# Environmental Workshop Team

A focused four-agent team for ecosystem diagnosis, reference-state assessment, and ecological community analysis. Leopold leads; Muir grounds the analysis in reference conditions; Commoner cross-checks biogeochemistry and mass balance; Orr translates the result for the target audience. This team mirrors the `rca-triage-team` pattern: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Ecosystem diagnosis** — "What is the current ecological state of this watershed / forest / coastal system?"
- **Impact assessment against reference condition** — "How has this landscape changed from its pre-disturbance state, and what does that mean ecologically?"
- **Conservation strategy evaluation** — "Given this ecosystem's condition, what conservation actions make sense?"
- **Restoration target setting** — "What reference condition should we restore toward, and is it feasible?"
- **Ecological community analysis** — "How is this community structured, what are the keystone species, what disturbance regime does it depend on?"
- **Baseline characterization for impact assessment** — producing the ecological baseline that a project-level EIA will measure against.

## When NOT to use this team

- **Community implementation planning** — use `environmental-practice-team`. Workshop team assumes the question is "what is going on ecologically," not "how do we implement an intervention."
- **Pure pedagogy or lesson design** — use `orr` directly. Workshop team includes Orr for translation, not as the primary deliverable.
- **Multi-wing problems** — use `environmental-analysis-team`. Workshop focuses on ecosystem/biogeochemistry/reference wings.
- **Pure policy or justice analysis** — use `shiva` or `wangari` directly, or use `environmental-analysis-team` for broader framing.
- **Climate physics or attribution** — none of the workshop team is the primary specialist for climate physics; route to `commoner` or `environmental-analysis-team`.

## Composition

Four agents, run in a partly sequential, partly parallel flow:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Ecologist** | `leopold` | Community diagnosis, trophic structure, succession, land-ethic framing | Opus |
| **Reference / Conservation advisor** | `muir` | Reference-state characterization, protected-area data, restoration targets | Sonnet |
| **Systems / Biogeochemistry cross-check** | `commoner` | Biogeochemical mass balance, systems coupling, unintended consequences | Sonnet |
| **Pedagogy / Translation** | `orr` | Level-appropriate explanation, place-based framing | Sonnet |

One Opus agent (Leopold) because ecological community diagnosis is the judgment-heavy work in the team. Three Sonnet agents because their roles are well-bounded — reference characterization, mass balance, and pedagogical translation are structural rather than open-ended.

## Orchestration flow

```
Input: ecosystem / landscape / subject + context + mode (diagnose/assess/recommend)
        |
        v
+---------------------------+
| Leopold (Opus)            |  Phase 1: Initial community diagnosis
| Lead / Ecologist          |          - parse the subject and context
+---------------------------+          - identify ecological community level
        |                              - produce a draft diagnosis
        v
+---------------------------+
| Muir (Sonnet)             |  Phase 2: Reference grounding
| Reference advisor         |          - provide reference-state characterization
+---------------------------+          - flag where current diverges from reference
        |                              - note data limitations
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Commoner (Sonnet)|   | Leopold (Opus)   |  Phase 3: Verification
| Mass balance     |   | Integration      |          (parallel)
| cross-check      |   | with reference   |
| - N, P, C budgets|   | data from Muir   |
| - coupling       |   | - adjust diagnosis|
| - unintended     |   |   if reference   |
|   consequences   |   |   shifts framing |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Leopold (Opus)            |  Phase 4: Finalize
| Incorporate findings      |          - address Commoner's mass balance findings
+---------------------------+          - produce final EnvironmentalAnalysis
                     |                 - include ethical framing if in frame mode
                     v
+---------------------------+
| Orr (Sonnet)              |  Phase 5: Translate
| Level-appropriate output  |          - produce learner-ready explanation
+---------------------------+          - add place-based hooks
                     |                 - suggest follow-up questions
                     v
              EnvironmentalAnalysis + EnvironmentalExplanation
              Grove records
```

## Phase details

### Phase 1 -- Initial diagnosis (Leopold)

Leopold reads the subject, context, and any attached data, then produces a draft community diagnosis covering:

```yaml
subject: <what is being analyzed>
ecological_level: <individual/population/community/ecosystem/landscape>
trophic_structure: <producers, consumers, decomposers>
keystone_or_foundation_species: <list>
disturbance_regime: <fire, flood, windthrow intervals>
current_successional_state: <early/mid/late seral>
preliminary_concerns: <what Leopold sees as worth investigating further>
```

This is a draft, not the final product. It becomes an input to Muir's reference check.

### Phase 2 -- Reference grounding (Muir)

Muir provides a reference-state characterization for the same subject at the appropriate biome and scale. Muir uses his source hierarchy — intact analogs first, then paleoecology, then historical records — and flags data quality explicitly. Output is an EnvironmentalAssessment with reference condition details.

Muir's output may change Leopold's framing. A current state that looked "degraded" at first glance may actually be close to reference for the system's natural variability range; conversely, a state that looked "OK" may be far from reference for species composition or structural attributes. Leopold incorporates these corrections in Phase 4.

### Phase 3 -- Mass balance and systems check (Commoner, parallel with integration)

Commoner runs a biogeochemical mass balance on the subject at the scale Leopold and Muir are working in. This catches several types of error:

- Productivity claims that are inconsistent with regional NPP
- Nutrient-cycling claims that do not balance on a watershed basis
- Coupling effects that alter the ecological diagnosis (e.g., a forest that looks healthy but has a nitrogen-saturated soil)
- Unintended consequence signals — a "recovery trajectory" that Commoner recognizes as a biogeochemical disequilibrium

In parallel, Leopold integrates Muir's reference data into the draft diagnosis, adjusting framing where the reference suggests the initial read was off.

### Phase 4 -- Finalize (Leopold)

Leopold produces the final EnvironmentalAnalysis, incorporating Muir's reference data and Commoner's mass balance findings. If the mode is `frame` (land-ethic framing), the analysis includes the integrity/stability/beauty criterion applied to the current state.

### Phase 5 -- Translate (Orr)

Orr takes Leopold's final analysis and produces an EnvironmentalExplanation at the target level. This is the deliverable for users who need the analysis in teaching-ready form. For advanced or graduate users, Orr's translation may be minimal (just formatting and context); for beginner or public users, it may involve substantial restructuring.

## Synthesis rules

The workshop team's synthesis is simpler than the analysis team's — only four agents, mostly sequential. The rules are:

1. **Leopold leads.** The primary product is Leopold's EnvironmentalAnalysis. Muir and Commoner are advisors, not equal voices.
2. **Muir's reference data is authoritative for reference claims.** If Leopold and Muir disagree about reference condition, Muir wins.
3. **Commoner's mass balance is authoritative for biogeochemistry.** If Leopold and Commoner disagree about nutrient cycling, Commoner wins.
4. **Leopold's ethical framing is authoritative when frame mode is active.** Muir and Commoner do not do ethical framing; when the question requires it, Leopold delivers it.
5. **Orr's translation is authoritative for level-appropriate language.** Leopold writes for a specialist audience; Orr adapts for the actual target.

## Input contract

The team accepts:

1. **Subject** (required). Ecosystem, landscape, species assemblage, or ecological question.
2. **Context** (required). Geographic location, biome, available data, disturbance history.
3. **Mode** (required). One of: `diagnose`, `assess`, `frame`, `recommend`.
4. **Target audience level** (optional, for Orr's translation). Defaults to `advanced` if not specified.
5. **Data** (optional). Species lists, abundance data, monitoring records.

## Output contract

### Primary outputs

- **EnvironmentalAnalysis** — Leopold's final community diagnosis (always produced).
- **EnvironmentalAssessment** — Muir's reference-state characterization (always produced).
- **EnvironmentalExplanation** — Orr's level-adapted translation (always produced).

### Optional outputs

- **EnvironmentalReview** — If the mode is `frame` or `recommend`, Leopold produces an ethical framing or conservation recommendation.

### Example Grove record set

```yaml
# Leopold's analysis (primary)
type: EnvironmentalAnalysis
subject: "Lower Cedar River riparian corridor, Washington state"
analysis_type: community_diagnosis
# ... full diagnosis ...

# Muir's reference (grounding)
type: EnvironmentalAssessment
subject: "Reference condition, lowland Puget Sound riparian"
reference_sources: [...]
# ... full reference characterization ...

# Orr's translation (delivery-ready)
type: EnvironmentalExplanation
subject: "What is happening to the Cedar River riparian corridor?"
target_level: high_school
# ... level-adapted explanation ...
```

## Escalation paths

### Internal escalations

- **Muir cannot find adequate reference data:** Escalate to ask whether to accept a modeled reference (lower-confidence), an analog-site reference from a different region, or halt until better data is available.
- **Commoner finds a biogeochemical imbalance Leopold did not anticipate:** Leopold's diagnosis is revised. If the revision is substantial, Orr's translation is regenerated.
- **Orr cannot translate at the target level without losing content:** Escalate to ask whether to raise the target level or accept a more scaffolded translation that covers less ground.

### External escalations (to other teams)

- **To environmental-analysis-team:** When a workshop diagnosis reveals wings outside the team's scope (e.g., human-impact justice dimensions, community implementation questions, or climate attribution), escalate to the full analysis team.
- **To environmental-practice-team:** When the user's real question turns out to be "how do we implement a restoration," escalate to practice.

## Token / time cost

Approximate cost per workshop session:

- **Leopold** — 2 Opus invocations (initial + final), ~50K tokens
- **Muir** — 1 Sonnet invocation, ~30K tokens
- **Commoner** — 1 Sonnet invocation, ~30K tokens
- **Orr** — 1 Sonnet invocation, ~25K tokens
- **Total** — 130-180K tokens, 3-8 minutes wall-clock

Cheaper and faster than the full analysis team because it uses one Opus agent instead of three, and runs sequentially rather than fully parallel. Appropriate for focused ecosystem questions.

## Configuration

```yaml
name: environmental-workshop-team
lead: leopold
advisors:
  - reference: muir
  - biogeochemistry: commoner
translator: orr

sequential: partial  # Phase 1 -> Phase 2, Phase 3 parallel with integration, then 4 -> 5
timeout_minutes: 10
```

## Invocation

```
# Ecosystem diagnosis
> environmental-workshop-team: Diagnose the ecological state of the Lower Cedar River
  riparian corridor (Washington state), including reference-state comparison. Mode: diagnose.

# Impact assessment against reference
> environmental-workshop-team: Assess the current state of Capitol State Forest compared
  to old-growth reference conditions. Mode: assess. Target audience level: advanced.

# Conservation recommendation
> environmental-workshop-team: Recommend a conservation strategy for the upper South Fork
  of the Skagit, including restoration targets. Mode: recommend.

# Land-ethic framing
> environmental-workshop-team: Frame the proposed forest-to-vineyard conversion on 120 ha
  of oak savanna near Healdsburg, California. Mode: frame.
```
