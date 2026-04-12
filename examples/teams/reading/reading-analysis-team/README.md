---
name: reading-analysis-team
type: team
category: reading
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/reading/reading-analysis-team/README.md
description: Full Reading Department analysis team for multi-domain problems spanning decoding, comprehension, literary analysis, critical reading, and information literacy. Austen classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with scaffolding from Clay. Use for advanced literary analysis requiring multiple perspectives, multi-domain reading questions, research-level interpretation, or problems where the reading domain is not obvious. Not for routine comprehension, pure decoding, or single-domain questions.
superseded_by: null
---
# Reading Analysis Team

Full-department multi-method analysis team for reading problems that span domains or require the broadest possible expertise. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-domain problems** spanning decoding, comprehension, literary analysis, critical reading, and information literacy -- where no single specialist covers the full scope.
- **Advanced literary analysis** requiring multiple critical perspectives (Morrison on voice + Borges on intertextuality + Achebe on representation).
- **Research-level interpretation** where the question may yield different insights from different analytical frameworks.
- **Novel reading problems** where the user does not know which specialist to invoke.
- **Cross-domain synthesis** -- when understanding a text requires seeing it through multiple lenses (linguistic structure via Chomsky-R, reader response via Rosenblatt, cultural critique via Achebe).
- **Comprehensive text analysis** -- when a text needs formal, cultural, intertextual, and pedagogical treatment simultaneously.

## When NOT to use this team

- **Routine comprehension** -- use `rosenblatt` directly or via `austen`.
- **Pure decoding or phonics** -- use `clay` + `chomsky-r` via the `literacy-team`.
- **Single-domain analysis** where the approach is clear -- route to the specialist via `austen` in single-agent mode.
- **Beginning readers** whose needs are primarily foundational -- use `literacy-team`.

## Composition

The team runs all seven Reading Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `austen` | Classification, orchestration, synthesis | Opus |
| **Literary analysis** | `morrison` | Narrative voice, race, representation, craft | Opus |
| **Intertextuality** | `borges` | Allusion, influence, metafiction, genre | Sonnet |
| **Critical reading** | `achebe` | Postcolonial analysis, bias, source evaluation, world literature | Opus |
| **Reader response** | `rosenblatt` | Transactional theory, comprehension, reader experience | Sonnet |
| **Linguistics** | `chomsky-r` | Language structure, morphology, syntax, decoding | Sonnet |
| **Pedagogy** | `clay` | Assessment, scaffolding, instructional design | Sonnet |

Three agents run on Opus (Austen, Morrison, Achebe) because their tasks require deep interpretive reasoning. Four run on Sonnet because their tasks are well-defined and analytically bounded.

## Orchestration flow

```
Input: user query + optional reader level + optional prior ReadingSession hash
        |
        v
+---------------------------+
| Austen (Opus)             |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - text type (literary/informational/etc.)
        |                              - complexity (foundational/intermediate/advanced)
        |                              - reader level (emergent/developing/proficient/advanced)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Morrison  Borges   Achebe  Rosenblatt Chomsky-R (Clay
    (voice)   (inter)  (crit)  (response) (struct)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             text but producing independent findings in
             their own framework. Each produces a Grove record.
             Austen activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Austen (Opus)             |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile or preserve tensions
              +---------------------------+          - rank findings by confidence
                         |                           - produce unified response
                         v
              +---------------------------+
              | Clay (Sonnet)             |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to reader level
              +---------------------------+          - add scaffolding if needed
                         |                           - suggest follow-up reading
                         v
              +---------------------------+
              | Austen (Opus)             |  Phase 5: Record
              | Produce ReadingSession    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ReadingSession Grove record
```

## Synthesis rules

Austen synthesizes the specialist outputs using these rules:

### Rule 1 -- Converging interpretations are strengthened

When two or more specialists arrive at the same interpretive conclusion independently (e.g., Morrison identifies a text's silencing of a character and Achebe identifies the same pattern through postcolonial analysis), mark the interpretation as high-confidence.

### Rule 2 -- Diverging interpretations are preserved

When specialists offer different readings, Austen does not force reconciliation. Literary texts legitimately support multiple interpretations. Instead:

1. Present both interpretations with attribution.
2. Identify the analytical framework that produces each reading.
3. Note whether the interpretations are complementary (seeing different aspects) or contradictory (incompatible claims about the same aspect).
4. If contradictory, examine which reading accounts for more of the text's evidence.

### Rule 3 -- Critical perspective enriches formal analysis

When Achebe identifies a representational issue that Morrison's or Borges's formal analysis did not address, the critical perspective does not override but enriches. A text's formal brilliance and its representational failures coexist.

### Rule 4 -- Reader experience is data

Rosenblatt's account of how the text positions the reader is not soft interpretation but analytical evidence. A text that produces discomfort in certain readers and comfort in others reveals something about its construction.

### Rule 5 -- Reader level governs presentation, not content

All specialist findings are included regardless of reader level. Clay adapts the presentation -- simpler language, more scaffolding, worked examples for lower levels; concise analytical writing for higher levels.

## Input contract

The team accepts:

1. **User query** (required). Natural language question about reading, text, or literature.
2. **Reader level** (optional). One of: `emergent`, `developing`, `proficient`, `advanced`.
3. **Prior ReadingSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the query
- Shows analytical work at the appropriate depth
- Credits the specialists involved
- Notes where multiple valid interpretations exist
- Suggests follow-up reading or exploration

### Grove record: ReadingSession

```yaml
type: ReadingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  text_type: literary
  complexity: advanced
  reader_level: proficient
agents_invoked:
  - austen
  - morrison
  - borges
  - achebe
  - rosenblatt
  - chomsky-r
  - clay
work_products:
  - <grove hash of LiteraryInterpretation>
  - <grove hash of ReadingAnalysis>
  - <grove hash of TextAnnotation>
  - <grove hash of ReadingExplanation>
concept_ids:
  - <relevant college concept IDs>
reader_level: proficient
```

## Escalation paths

### Internal escalations

- **Linguistic complexity blocks interpretation:** Chomsky-R parses the syntax and morphology so literary agents can focus on meaning.
- **Reader skill level is a barrier:** Clay designs scaffolding to make the text accessible without simplifying the analytical content.
- **Cultural context is missing:** Achebe identifies what cultural knowledge is needed; Austen decides whether to provide it or to ask the user.

### External escalations

- **Outside reading:** If the query requires domain expertise outside reading (mathematical content, scientific methodology), Austen acknowledges the boundary and suggests appropriate resources.

## Token / time cost

Approximate cost per analysis:

- **Austen** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Morrison, Achebe) + 3 Sonnet (Borges, Rosenblatt, Chomsky-R), ~30-60K tokens each
- **Clay** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

## Configuration

```yaml
name: reading-analysis-team
chair: austen
specialists:
  - literary_analysis: morrison
  - intertextuality: borges
  - critical_reading: achebe
  - reader_response: rosenblatt
  - linguistics: chomsky-r
pedagogy: clay

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full analysis
> reading-analysis-team: Analyze the opening of Beloved through every available
  critical lens. Level: advanced.

# Multi-domain problem
> reading-analysis-team: Why do my students struggle to understand Shakespeare?
  Is it vocabulary, syntax, cultural distance, or something else?

# Cross-cultural comparison
> reading-analysis-team: Compare the narrative strategies in Things Fall Apart
  and One Hundred Years of Solitude. What do they share? Where do they diverge?

# Follow-up
> reading-analysis-team: (session: grove:abc123) Now extend that analysis to
  how each novel handles the passage of time.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Texts requiring specialized linguistic sub-disciplines (e.g., computational stylistics, corpus linguistics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at synthesis.
- The team does not access external text databases beyond what each agent's tools provide.
- Genuinely ambiguous literary texts may produce multiple valid but incompatible readings. The team reports this honestly rather than forcing resolution.
