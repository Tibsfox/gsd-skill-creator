---
name: source-workshop-team
type: team
category: history
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/history/source-workshop-team/README.md
description: Focused source analysis and document interpretation team. Herodotus leads with source classification and provenance assessment, Arendt provides close political reading and ideological critique, Zinn recovers marginalized voices and silences in the source, and Montessori translates findings into level-appropriate pedagogy. Use for primary source analysis, document interpretation, evidence evaluation, source comparison, and historiographical method instruction. Not for broad comparative studies, narrative construction, or longue duree structural analysis.
superseded_by: null
---
# Source Workshop Team

A focused four-agent team for primary source analysis, document interpretation, and evidence evaluation. Herodotus leads with source classification and contextual framing; Arendt provides close political reading; Zinn recovers what the source silences; Montessori scaffolds the findings for the learner. This team mirrors the `proof-workshop-team` pattern: a focused expertise team optimized for a specific class of problem rather than broad investigation.

## When to use this team

- **Primary source analysis** -- "analyze this excerpt from Thucydides' History of the Peloponnesian War," "what does this treaty reveal about power dynamics?"
- **Document interpretation** -- close reading of speeches, legislation, correspondence, propaganda, economic records, or diplomatic texts.
- **Evidence evaluation** -- assessing reliability, bias, provenance, and corroboration of historical sources.
- **Source comparison** -- "compare these two accounts of the same event and explain the discrepancies."
- **Historiographical method instruction** -- teaching source critique techniques through worked examples with Montessori's scaffolding.
- **Silence analysis** -- identifying what a source does not say, whose voices are absent, and what that absence reveals about power and perspective.

## When NOT to use this team

- **Broad comparative studies** spanning multiple periods or civilizations -- use `history-seminar-team`.
- **Narrative construction** where the goal is a coherent story, not source critique -- use `narrative-team`.
- **Longue duree structural analysis** where individual sources matter less than macro patterns -- use `braudel` directly or `narrative-team`.
- **Simple factual extraction** ("what year does this document reference?") -- no team needed.
- **Full historiographical survey** across multiple analytical traditions -- use `history-seminar-team`.

## Composition

Four agents, run mostly sequentially with one parallel analysis step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Source classifier** | `herodotus` | Source classification, provenance, context, synthesis | Opus |
| **Political reader** | `arendt` | Close political reading, ideological critique, power analysis | Sonnet |
| **Silence analyst** | `zinn` | Marginalized voices, absences, subaltern reading, counter-narrative | Sonnet |
| **Pedagogy / Scaffolding** | `montessori` | Level-appropriate explanation, method instruction, learning pathway | Sonnet |

One Opus agent (Herodotus) because source classification and synthesis require deep contextual reasoning across periods and genres. Three Sonnet agents (Arendt, Zinn, Montessori) because their tasks are well-bounded within their analytical frameworks.

## Orchestration flow

```
Input: source text + context + mode (analyze/compare/evaluate) + optional user level
        |
        v
+---------------------------+
| Herodotus (Opus)          |  Phase 1: Classify the source
| Lead / Source classifier  |          - type (literary/legal/diplomatic/economic/
+---------------------------+            personal/visual/material)
        |                              - period and geographic origin
        |                              - author/creator identification
        |                              - intended audience
        |                              - provenance and transmission history
        |                              - known biases and limitations
        v
+---------------------------+
| Herodotus (Opus)          |  Phase 2: Contextual framing
| Historical context        |          - what was happening when this was created?
+---------------------------+          - what conventions governed this genre?
        |                              - what do we know about the author's position?
        |
        +------- parallel --------+
        |                         |
        v                         v
+------------------+   +------------------+
| Arendt (Sonnet)  |   | Zinn (Sonnet)    |  Phase 3: Parallel close reading
| Political reader |   | Silence analyst  |
| - power dynamics |   | - whose voice is |
| - ideology       |   |   absent?        |
| - institutional  |   | - what is NOT    |
|   interests      |   |   said?          |
| - language of    |   | - whose labor is |
|   authority      |   |   invisible?     |
+------------------+   +------------------+
        |                         |
        +------------+------------+
                     |
                     v
+---------------------------+
| Herodotus (Opus)          |  Phase 4: Synthesize
| Merge close readings      |          - reconcile the two readings
+---------------------------+          - assess overall reliability
                     |                 - identify corroboration needs
                     |                 - produce SourceCritique record
                     v
+---------------------------+
| Montessori (Sonnet)       |  Phase 5: Pedagogy wrap
| Level-appropriate output  |          - teach the method, not just the result
+---------------------------+          - show how to replicate this analysis
                     |                 - suggest practice sources
                     v
              SourceCritique + HistoricalExplanation
              Grove records
```

## Phase details

### Phase 1 -- Source classification (Herodotus)

Herodotus examines the source and produces a classification card:

```yaml
source_type: <literary/legal/diplomatic/economic/personal/visual/material>
period: <approximate date or range>
geography: <place of origin>
author: <identified or unknown>
intended_audience: <who was meant to read/hear/see this>
provenance: <how we got this source -- transmission chain>
genre_conventions: <what rules governed this kind of document>
known_biases: <author's position, patron, institutional loyalty>
preservation_context: <why this survived when others did not>
```

### Phase 2 -- Contextual framing (Herodotus)

Herodotus places the source in its historical moment. This phase produces the interpretive frame that Arendt and Zinn will read against:

- What political, economic, and social conditions prevailed?
- What other sources from this period survive for cross-reference?
- What scholarly debate surrounds this source or its context?
- What translation or editorial issues affect the text we have?

### Phase 3 -- Parallel close reading (Arendt + Zinn)

Two independent analytical readings run in parallel:

**Arendt (political reading):**
- What power relations does the source reveal or construct?
- What political vocabulary does it deploy, and what does that vocabulary presuppose?
- How does it position authority, legitimacy, and obedience?
- What ideological work is the source performing -- what does it want to be true?
- Does the source distinguish between power and violence, public and private, political and social?

**Zinn (silence analysis):**
- Whose perspective is absent from this source?
- What labor, suffering, or resistance is invisible in the text?
- If the source describes an event, who experienced it differently from the author?
- What would a servant, enslaved person, worker, woman, or colonized person say about the same events?
- Does the source naturalize hierarchies that were contested at the time?

### Phase 4 -- Synthesis (Herodotus)

Herodotus merges the classification, context, and two close readings into a unified SourceCritique:

- Where Arendt and Zinn converge, the finding is high-confidence
- Where they diverge, both readings are preserved with explanation
- Overall reliability assessment: how much can this source be trusted, and for what questions?
- Corroboration recommendations: what other sources would strengthen or challenge these readings?

### Phase 5 -- Pedagogy (Montessori)

Montessori takes the SourceCritique and produces a HistoricalExplanation that:

- Teaches the method of source critique, not just the results of this particular analysis
- Shows the student how to replicate the analysis on a different source
- Provides a simplified version of the analytical framework appropriate to the user's level
- Suggests practice sources of similar type and difficulty for independent work
- Connects to the college history department concept graph (source-analysis skill, historical-perspectives skill)

## Input contract

The team accepts:

1. **Source text** (required). The document, excerpt, image description, or artifact to analyze.
2. **Context** (optional but recommended). Any known information about origin, date, author.
3. **Mode** (required). One of:
   - `analyze` -- full source critique of a single source
   - `compare` -- comparative analysis of two or more sources
   - `evaluate` -- assess reliability and evidentiary value for a specific historical question
4. **User level** (optional). One of: `secondary`, `undergraduate`, `graduate`, `professional`.

### Mode: compare

In compare mode, the orchestration adds a comparison phase:

```
Input: two or more source texts + context
        |
        v
Herodotus -- classify each source independently
        |
Arendt + Zinn -- parallel close reading of each source
        |
Herodotus -- comparative synthesis
            - where do the sources agree?
            - where do they contradict?
            - what explains the discrepancies (different author position,
              different genre conventions, different audience)?
            - which source is more reliable for which questions?
        |
Montessori -- teach comparative source method
```

### Mode: evaluate

In evaluate mode, the analysis is focused on a specific historical question:

```
Input: source text + the historical question the source might answer
        |
        v
Herodotus -- classify and assess: can this source answer this question?
        |
Arendt + Zinn -- focused reading: what does the source reveal about
                 this question, and what does it conceal?
        |
Herodotus -- evidentiary verdict: strong/moderate/weak/inadmissible
             with justification
        |
Montessori -- explain the evaluation criteria
```

## Output contract

### Mode: analyze

Two Grove records:

**SourceCritique:**
```yaml
type: SourceCritique
source_type: legal
period: "1215 CE"
geography: England
author: "baronial faction / royal chancery"
classification:
  reliability: moderate
  bias_direction: elite-aristocratic
  corroboration_available: true
political_reading:
  agent: arendt
  summary: <power analysis>
silence_reading:
  agent: zinn
  summary: <absence analysis>
synthesis: <unified assessment>
corroboration_needs: [<list of recommended cross-references>]
concept_ids: [...]
agent: herodotus
```

**HistoricalExplanation:**
```yaml
type: HistoricalExplanation
target_level: undergraduate
critique_hash: <grove hash of SourceCritique>
explanation: <level-appropriate walkthrough of the analysis>
method_instruction: <how to do this kind of analysis yourself>
practice_sources: [<suggested sources for independent work>]
concept_ids: [...]
agent: montessori
```

### Mode: compare

A SourceCritique for each source plus a comparative HistoricalAnalysis linking them.

### Mode: evaluate

A SourceCritique with an evidentiary verdict field and a HistoricalExplanation focused on the evaluation criteria.

## Escalation paths

### Source exceeds workshop scope (Herodotus)

If the source analysis reveals that answering the question requires multiple analytical frameworks beyond political and social reading:

1. Herodotus completes the source classification and initial readings.
2. The partial analysis is packaged as a SourceCritique with `status: partial`.
3. Escalate to `history-seminar-team` with the partial work attached, so Ibn-Khaldun and Braudel can add economic-structural and longue duree perspectives.

### Source requires narrative contextualization

If the source cannot be understood without extensive narrative framing (e.g., a battle report that only makes sense within a campaign narrative):

1. Complete the source critique.
2. Recommend `narrative-team` for the contextual narrative, with the SourceCritique linked as a work product.

### Source language or materiality issues

If the source has significant translation, paleographic, or material problems that the team cannot resolve:

1. Document the issues in the SourceCritique.
2. Report honestly to the user with recommendations for specialist consultation (epigrapher, paleographer, translator).

### From other teams

- **From history-seminar-team:** When the seminar identifies a key source that needs detailed critique before the broader analysis can proceed, delegate to source-workshop-team.
- **From narrative-team:** When narrative construction encounters a source of uncertain reliability, delegate the source evaluation here.

## Token / time cost

Approximate cost per source analysis:

- **Herodotus** -- 3 Opus invocations (classify, context, synthesize), ~50-70K tokens total
- **Arendt** -- 1 Sonnet invocation (political reading), ~20-30K tokens
- **Zinn** -- 1 Sonnet invocation (silence analysis), ~20-30K tokens
- **Montessori** -- 1 Sonnet invocation (pedagogy), ~15-25K tokens
- **Total** -- 105-155K tokens, 3-8 minutes wall-clock

Lighter than `history-seminar-team` because only four agents are involved and Phase 3 is the only parallel step.

## Configuration

```yaml
name: source-workshop-team
lead: herodotus
political_reader: arendt
silence_analyst: zinn
pedagogy: montessori

# Zinn's silence analysis can be skipped for purely technical source evaluation
skip_silence: false

# Default comparison mode analyzes up to 4 sources
max_compare_sources: 4

# Montessori output level (auto-detected if not set)
user_level: auto
```

## Invocation

```
# Analyze a primary source
> source-workshop-team: Analyze this excerpt from the Seneca Falls Declaration
  of Sentiments (1848). What does it reveal about the political strategy of the
  early women's suffrage movement? Mode: analyze. Level: undergraduate.

# Compare sources
> source-workshop-team: Compare Herodotus's account of Thermopylae with the
  archaeological evidence from the site. Where do they agree and diverge?
  Mode: compare. Level: graduate.

# Evaluate evidentiary value
> source-workshop-team: Can Ibn Battuta's Rihla be used as reliable evidence
  for the economic conditions of 14th-century Mali? Mode: evaluate.
  Level: professional.

# Follow-up from seminar
> source-workshop-team: The seminar team identified this Venetian diplomatic
  dispatch as a key source for understanding Ottoman-European trade relations.
  (session: grove:abc123) Full critique needed. Mode: analyze.
```

## Limitations

- The team analyzes sources in translation; it cannot perform original-language philological analysis.
- Visual and material sources (artifacts, architecture, images) are analyzed through textual description, not direct visual inspection.
- The team does not access archival databases or digitized collections beyond what each agent's tools provide.
- Silence analysis (Zinn) is inherently speculative -- it reasons about what a source does not say. Montessori ensures the student understands the epistemological difference between evidence-based claims and informed inference about absence.
- The team works best with sources that have significant scholarly context. For recently discovered or unpublished materials, the contextual framing (Phase 2) may be thin.
