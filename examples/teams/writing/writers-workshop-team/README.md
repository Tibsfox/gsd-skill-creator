---
name: writers-workshop-team
type: team
category: writing
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/writing/writers-workshop-team/README.md
description: Full Writing Department workshop team for multi-form problems spanning fiction, poetry, essay, research, and revision. Woolf classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent perspectives into a unified, level-appropriate response with pedagogical framing from Calkins. Use for research-level writing questions, advanced creative projects requiring coordinated specialist input, or any writing task where the form is not obvious and different craft perspectives may yield different insights. Not for routine editing, single-form composition, or pure mechanics.
superseded_by: null
---
# Writers Workshop Team

Full-department multi-perspective workshop team for writing problems that span forms or resist classification. Runs specialists in parallel and synthesizes their independent perspectives into a coherent response. The writing equivalent of the math department's `math-investigation-team`.

## When to use this team

- **Multi-form problems** spanning fiction, poetry, essay, revision, and style -- where no single specialist covers the full scope.
- **Advanced creative projects** where the writer is working across genres or experimenting with hybrid forms (lyric essay, verse novel, prose poetry).
- **Complex revision** where a piece needs attention to argument (Orwell), economy (Strunk), voice (Baldwin), form (Le Guin or Angelou), and process (Calkins) simultaneously.
- **Novel problems** where the user does not know which specialist to invoke, and Woolf's classification is the right entry point.
- **Writing development assessments** that require multiple specialist perspectives on a writer's growth.
- **Curriculum design** for writing programs that integrate multiple forms and skills.

## When NOT to use this team

- **Simple editing** -- use `strunk` directly. The workshop team's token cost is substantial.
- **Single-form composition** where the domain is clear -- use the domain specialist directly or the `editing-team` / `genre-team`.
- **Pure mechanics** (grammar, punctuation) -- use `strunk` directly.
- **Emerging-level instruction** with no multi-form component -- use `calkins` directly.

## Composition

The team runs all seven Writing Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `woolf` | Classification, orchestration, synthesis | Opus |
| **Essay / Voice** | `baldwin` | Nonfiction craft, moral clarity, voice development | Opus |
| **Poetry / Memoir** | `angelou` | Poetic form, sound, rhythm, embodied voice | Sonnet |
| **Clarity / Argument** | `orwell` | Argument structure, jargon elimination, expository clarity | Opus |
| **Fiction / Worldbuilding** | `le-guin` | Narrative structure, speculative construction, form-content relationship | Sonnet |
| **Mechanics / Style** | `strunk` | Sentence editing, economy, grammar, parallel construction | Sonnet |
| **Pedagogy** | `calkins` | Scaffolding, workshop structure, conferencing, assessment | Sonnet |

Three agents run on Opus (Woolf, Baldwin, Orwell) because their tasks require deep reasoning -- synthesis across forms, voice development, and argument analysis. Four run on Sonnet because their tasks are well-defined and bounded.

## Orchestration flow

```
Input: user query + optional user level + optional prior WritingSession hash
        |
        v
+---------------------------+
| Woolf (Opus)              |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-form)
+---------------------------+          - purpose (create/analyze/revise/explain/explore)
        |                              - complexity (foundational/intermediate/advanced)
        |                              - user level (emerging/developing/proficient/advanced)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Baldwin   Angelou  Orwell   Le Guin   Strunk  (Calkins
    (essay)   (poetry) (clarity)(fiction) (mechan)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             submission but producing independent analyses in
             their own framework. Each produces a Grove record.
             Woolf activates only the relevant subset --
             not all 5 are invoked on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Woolf (Opus)              |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile contradictions
              +---------------------------+          - rank perspectives by relevance
                         |                           - produce unified response
                         v
              +---------------------------+
              | Calkins (Sonnet)          |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to writer level
              +---------------------------+          - add learning pathway
                         |                           - suggest next steps
                         v
              +---------------------------+
              | Woolf (Opus)              |  Phase 5: Record
              | Produce WritingSession    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + WritingSession Grove record
```

## Synthesis rules

Woolf synthesizes specialist outputs using these rules:

### Rule 1 -- Converging feedback is strengthened

When two or more specialists identify the same issue independently (e.g., both Baldwin and Orwell flag a weak thesis), the issue is marked high-priority. Cross-specialist convergence is the strongest signal.

### Rule 2 -- Diverging feedback is preserved and contextualized

When specialists disagree (e.g., Strunk says "cut this sentence" but Baldwin says "this sentence is the essay's heartbeat"), Woolf does not force resolution. Instead:

1. State both perspectives with attribution.
2. Explain the principle behind each perspective.
3. Let the writer decide. Writing is not math -- there are genuine trade-offs between economy and voice, compression and resonance.

### Rule 3 -- Voice over mechanics

When voice and mechanical correctness conflict (e.g., a sentence fragment that serves the writer's rhythm), voice takes precedence. Strunk and Orwell may flag the irregularity; Baldwin and Angelou may endorse it. Woolf notes both and favors the reading that serves the piece's purpose.

### Rule 4 -- Process over product in pedagogical contexts

When the user is developing as a writer, Calkins's developmental perspective takes priority over specialist perfection. The question is not "is this piece publishable?" but "is this writer growing?"

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Calkins adapts the presentation -- simpler framing, more examples, smaller next steps for emerging writers; concise craft language for advanced writers.

## Input contract

The team accepts:

1. **User query** (required). Natural language writing question, draft, or request.
2. **User level** (optional). `emerging`, `developing`, `proficient`, `advanced`. If omitted, Woolf infers.
3. **Prior WritingSession hash** (optional). For follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the writing question or task
- Shows craft reasoning at the appropriate level
- Credits the specialists involved
- Notes any trade-offs where specialists disagreed
- Suggests next steps

### Grove record: WritingSession

```yaml
type: WritingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-form
  purpose: revise
  complexity: advanced
  user_level: proficient
agents_invoked:
  - woolf
  - baldwin
  - orwell
  - strunk
  - le-guin
  - angelou
  - calkins
work_products:
  - <grove hash of WritingCritique>
  - <grove hash of WritingAnalysis>
  - <grove hash of WritingExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: proficient
```

## Escalation paths

### Internal escalations

- **Baldwin and Orwell disagree on voice vs. clarity:** Woolf presents both perspectives. The writer decides. This is a genuine craft tension, not an error.
- **Strunk flags errors that Angelou endorses as intentional:** Context determines the verdict. In a poem, intentional rule-breaking is craft. In a research paper, it is an error.
- **Le Guin identifies a structural problem that requires rethinking the entire piece:** Woolf flags this as a major revision and suggests the writer address structure before sentence-level editing.

### External escalations

- **From editing-team:** When editing reveals the piece needs multi-form attention (e.g., an essay that wants to be a lyric essay), escalate to writers-workshop-team.
- **From genre-team:** When a creative piece requires argument analysis or research integration, escalate to writers-workshop-team.

### Escalation to the user

- **Genuinely divided feedback:** When specialists produce irreconcilable advice, report this honestly. Writing involves real trade-offs.
- **Outside writing:** If the task requires domain expertise outside writing (mathematical proof, scientific methodology), Woolf acknowledges the boundary.

## Token / time cost

Approximate cost per workshop:

- **Woolf** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Baldwin, Orwell) + 3 Sonnet (Angelou, Le Guin, Strunk), ~30-60K tokens each
- **Calkins** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

Justified for multi-form, advanced, and developmentally complex problems. For focused tasks, use specialists directly or focused teams.

## Configuration

```yaml
name: writers-workshop-team
chair: woolf
specialists:
  - essay: baldwin
  - poetry: angelou
  - clarity: orwell
  - fiction: le-guin
  - mechanics: strunk
pedagogy: calkins

parallel: true
timeout_minutes: 15

# Woolf may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked
min_specialists: 2
```

## Invocation

```
# Full workshop
> writers-workshop-team: I'm writing a lyric essay that braids memoir with
  literary criticism. Here's my draft. I need feedback on structure, voice,
  and whether the hybrid form is working. Level: advanced.

# Multi-form analysis
> writers-workshop-team: Analyze how Claudia Rankine's Citizen uses poetry,
  essay, and visual art together. What makes the hybrid work?

# Curriculum design
> writers-workshop-team: Design a 6-week writing unit that moves students
  from personal narrative through poetry to argumentative essay. Level: developing.

# Follow-up
> writers-workshop-team: (session: grove:abc123) Now focus on the voice
  in section 3. It feels different from the rest.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Specialized writing domains (screenwriting, technical writing, grant writing) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at synthesis.
- The team does not access external resources beyond what each agent's tools provide.
- Advanced experimental forms may exceed all specialists' experience. The team reports this honestly.
