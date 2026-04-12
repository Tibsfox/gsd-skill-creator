---
name: history-seminar-team
type: team
category: history
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/history/history-seminar-team/README.md
description: Full History Department seminar team for comprehensive historical analysis, comparative studies, and multi-perspective interpretation. Herodotus classifies the query by period, geography, and analytical framework, then dispatches to relevant specialists in parallel. Specialists produce independent analyses which Herodotus synthesizes into a unified, multiperspective response with pedagogical scaffolding from Montessori. Use for research-grade historiographical questions, comparative civilizational analysis, or any inquiry where multiple historical perspectives are needed. Not for single-source document analysis or narrow narrative construction.
superseded_by: null
---
# History Seminar Team

Full-department multi-perspective investigation team for historical problems that span periods, geographies, or analytical frameworks. Runs specialists in parallel and synthesizes their independent findings into a coherent, multiperspective response. Analogous to how `math-investigation-team` runs multiple mathematical methods on a problem.

## When to use this team

- **Multi-period problems** spanning ancient, medieval, early modern, and modern history -- where no single specialist covers the full temporal scope.
- **Comparative studies** requiring analysis across civilizations, political systems, or economic structures (e.g., "compare the causes of the Roman and Ottoman declines").
- **Research-level questions** where the historiographical tradition is contested and the problem benefits from multiple analytical lenses (social, economic, political, narrative, people's history).
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a question about imperialism that needs Arendt's political analysis, Ibn-Khaldun's social-economic framework, Zinn's people's perspective, and Braudel's longue duree structural lens).
- **Novel interpretive problems** where the user does not know which analytical framework to apply, and Herodotus's classification is the right entry point.
- **Historiographical surveys** -- when understanding a historical event requires seeing it through multiple interpretive schools (Marxist, Annales, political, narrative, subaltern).
- **Cross-verification of historical claims** -- when a narrative needs source critique, structural analysis, and pedagogical review simultaneously.

## When NOT to use this team

- **Single-source document analysis** -- use `source-workshop-team`. The seminar team's token cost is substantial for focused source work.
- **Narrative construction** where the analytical framework is already chosen -- use `narrative-team`.
- **Pure pedagogy** with no research component -- use `montessori` directly.
- **Single-framework analysis** where the approach is obvious -- route to the specialist via `herodotus` in single-agent mode.
- **Simple factual queries** ("when did the French Revolution start?") -- no team needed.

## Composition

The team runs all seven History Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `herodotus` | Classification, orchestration, synthesis | Opus |
| **Social-Economic analyst** | `ibn-khaldun` | Asabiyyah cycles, trade networks, material conditions | Opus |
| **Political-Modern analyst** | `arendt` | Political theory, totalitarianism, modernity, power structures | Sonnet |
| **Longue duree analyst** | `braudel` | Multi-temporal analysis, geographic determinism, structural history | Opus |
| **Narrative-Military specialist** | `tuchman` | Narrative construction, military history, human decision-making | Sonnet |
| **People's-Social historian** | `zinn` | Bottom-up history, labor, marginalized voices, resistance movements | Sonnet |
| **Pedagogy specialist** | `montessori` | Level-appropriate explanation, learning pathways, concept scaffolding | Sonnet |

Three agents run on Opus (Herodotus, Ibn-Khaldun, Braudel) because their tasks require deep reasoning across long temporal arcs and complex causal chains. Four run on Sonnet because their tasks are well-defined within their analytical frameworks.

## Orchestration flow

```
Input: user query + optional user level + optional prior HistorySession hash
        |
        v
+---------------------------+
| Herodotus (Opus)          |  Phase 1: Classify the query
| Chair / Router            |          - period (ancient/medieval/early-modern/modern/
+---------------------------+            contemporary/cross-period)
        |                              - geography (regional/comparative/global)
        |                              - type (explain/analyze/compare/evaluate/narrate)
        |                              - analytical framework (social/economic/political/
        |                                structural/narrative/people's/mixed)
        |                              - user level (secondary/undergraduate/graduate/
        |                                professional)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
   Ibn-Khaldun Arendt  Braudel  Tuchman   Zinn   (Montessori
   (soc-econ)  (polit) (longue) (narr)   (people)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             query but producing independent analyses in
             their own framework. Each produces a Grove record.
             Herodotus activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Herodotus (Opus)          |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank findings by evidence strength
                         |                           - produce unified multiperspective
                         v                             response
              +---------------------------+
              | Montessori (Sonnet)       |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add concept scaffolding
                         |                           - suggest follow-up inquiries
                         v
              +---------------------------+
              | Herodotus (Opus)          |  Phase 5: Record
              | Produce HistorySession    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + HistorySession Grove record
```

## Synthesis rules

Herodotus synthesizes the specialist outputs using these rules, directly analogous to the `math-investigation-team` synthesis protocol:

### Rule 1 -- Converging interpretations are strengthened

When two or more specialists arrive at the same interpretation independently (e.g., Ibn-Khaldun's economic analysis and Zinn's social analysis both identify material deprivation as the driver of a revolution), mark the interpretation as high-confidence. Cross-specialist convergence is the strongest signal available.

### Rule 2 -- Diverging interpretations are preserved and investigated

When specialists disagree, Herodotus does not force a reconciliation. Instead:

1. State both interpretations with attribution ("Arendt identifies the crisis of authority as the proximate cause; Ibn-Khaldun locates the cause in the erosion of asabiyyah over three generations").
2. Evaluate evidence: which interpretation has stronger primary-source support?
3. If the disagreement reflects genuine historiographical debate, report both positions as legitimate scholarly perspectives with their respective evidence bases.
4. Report the disagreement honestly to the user as a productive tension, not a failure.

### Rule 3 -- Structure over narrative

When Braudel identifies a longue duree structural pattern that explains events which Tuchman narrates as contingent decisions (e.g., "the general lost the battle because of a flanking error" vs. "the logistical infrastructure could not sustain the campaign regardless of tactics"), the structural explanation receives priority in the synthesis. The narrative becomes the human-scale illustration of the structural claim.

### Rule 4 -- People's history is not optional

Zinn's output must always be represented in the synthesis when marginalized populations are affected by the events under analysis. If only elite-level political and military history is presented, the synthesis is incomplete. When Zinn's analysis contradicts the elite narrative, both perspectives are presented with evidence and the tension is made explicit.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included in the response regardless of user level. Montessori adapts the presentation -- simpler language, more scaffolding, chronological anchoring for lower levels; nuanced historiographical framing for higher levels. The historical content does not change, only the pedagogical approach.

### Rule 6 -- Sources must be cited

Every substantive claim in the synthesis must be traceable to a primary or secondary source. Herodotus ensures that the final response includes source citations or at minimum identifies the evidentiary basis for each major claim. Unsourced speculation is labeled as such.

## Input contract

The team accepts:

1. **User query** (required). Natural language historical question, problem, or request.
2. **User level** (optional). One of: `secondary`, `undergraduate`, `graduate`, `professional`. If omitted, Herodotus infers from the query.
3. **Prior HistorySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the query from multiple analytical perspectives
- Shows evidence and reasoning at the appropriate level of detail
- Credits the specialists and their analytical frameworks
- Notes any unresolved historiographical debates
- Suggests follow-up inquiries and further reading

### Grove record: HistorySession

```yaml
type: HistorySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  period: cross-period
  geography: comparative
  type: analyze
  analytical_framework: mixed
  user_level: graduate
agents_invoked:
  - herodotus
  - ibn-khaldun
  - arendt
  - braudel
  - tuchman
  - zinn
  - montessori
work_products:
  - <grove hash of HistoricalAnalysis>
  - <grove hash of HistoricalNarrative>
  - <grove hash of SourceCritique>
  - <grove hash of HistoricalExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

Each specialist's output is also a standalone Grove record (HistoricalAnalysis, HistoricalNarrative, SourceCritique, or HistoricalExplanation) linked from the HistorySession.

## Escalation paths

### Internal escalations (within the team)

- **Source conflict:** When two specialists cite the same source but draw opposing conclusions, Herodotus flags the conflict and routes the source to Arendt for close political reading and Zinn for subaltern reading. Both readings are preserved in the final output.
- **Periodization dispute:** When Braudel's longue duree framework assigns different period boundaries than the conventional political periodization (e.g., "the Middle Ages ended in the 14th century" vs. "the 16th century"), Herodotus acknowledges both periodizations and explains what each reveals and conceals.
- **Anachronism detection:** If any specialist applies modern categories to pre-modern societies without justification, Herodotus flags the anachronism. Ibn-Khaldun and Braudel are particularly sensitive to this -- their frameworks resist presentism.

### External escalations (from other teams)

- **From source-workshop-team:** When source analysis reveals the document touches multiple periods or analytical frameworks beyond the workshop's scope, escalate to history-seminar-team.
- **From narrative-team:** When narrative construction exposes a need for political analysis or people's history that the narrative team cannot provide, escalate to history-seminar-team.

### Escalation to the user

- **Insufficient sources:** If the question requires primary sources the team cannot access (e.g., archival materials, untranslated texts), report this honestly with recommendations for archives or databases.
- **Outside history:** If the question requires expertise outside history (economic modeling, literary criticism, archaeological method), Herodotus acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per seminar:

- **Herodotus** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Ibn-Khaldun, Braudel) + 3 Sonnet (Arendt, Tuchman, Zinn), ~30-60K tokens each
- **Montessori** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multiperspective and research-level questions. For focused source work or narrative construction, use the specialized teams.

## Configuration

```yaml
name: history-seminar-team
chair: herodotus
specialists:
  - social-economic: ibn-khaldun
  - political-modern: arendt
  - longue-duree: braudel
  - narrative-military: tuchman
  - peoples-social: zinn
pedagogy: montessori

parallel: true
timeout_minutes: 15

# Herodotus may skip specialists whose framework is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full seminar
> history-seminar-team: Analyze the causes and consequences of the fall of the
  Roman Republic, comparing elite political dysfunction with popular economic
  grievances. Level: graduate.

# Comparative study
> history-seminar-team: Compare the processes of state formation in 14th-century
  West Africa (Mali Empire) and 14th-century Western Europe. What do the
  similarities and differences reveal about universal vs. contingent factors
  in political centralization?

# Follow-up
> history-seminar-team: (session: grove:abc123) Now extend that analysis to
  include the role of trade networks and religious institutions in both regions.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., archaeometry, historical linguistics, digital humanities methods) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level. This preserves independence but prevents real-time historiographical debate.
- The team does not access external databases, archives, or digitized primary sources beyond what each agent's tools provide (Read, Grep, Bash for computation).
- Genuinely novel historical questions (e.g., newly discovered documents, ongoing events) may exceed the agents' training data. The team reports knowledge boundaries honestly rather than speculating.
- Non-Western historiographical traditions beyond Ibn-Khaldun's framework (e.g., Chinese dynastic historiography, Indian itihasa tradition) are represented only through Braudel's comparative structural lens, which may not fully capture their internal logic.
