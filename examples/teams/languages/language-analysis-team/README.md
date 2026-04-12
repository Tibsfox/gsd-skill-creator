---
name: language-analysis-team
type: team
category: languages
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/languages/language-analysis-team/README.md
description: Full Languages Department investigation team for multi-domain problems spanning phonetics, grammar, acquisition, sociolinguistics, translation, and pedagogy. Saussure classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with a learning pathway from Bruner-L. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any problem where the domain is not obvious and different linguistic perspectives may yield different insights. Not for routine vocabulary questions, pure phonetic description, or simple translation.
superseded_by: null
---
# Language Analysis Team

Full-department multi-method investigation team for language and linguistics problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-domain problems** spanning phonetics, grammar, acquisition theory, sociolinguistics, and translation -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different linguistic perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., a question about language change that needs Crystal's historical data, Chomsky-L's structural analysis, and Baker's sociolinguistic context).
- **Novel problems** where the user does not know which specialist to invoke, and Saussure's classification is the right entry point.
- **Cross-domain synthesis** -- when understanding a linguistic phenomenon requires seeing it through multiple lenses (structural via Chomsky-L, social via Baker, acquisitional via Krashen, pedagogical via Bruner-L).

## When NOT to use this team

- **Simple vocabulary questions** -- use `krashen` or `bruner-l` directly.
- **Pure phonetic description** of a specific language -- use `crystal` directly.
- **Simple translation requests** -- use `translation-team`.
- **Beginner-level teaching** with no research component -- use `bruner-l` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `saussure` in single-agent mode.

## Composition

The team runs all seven Languages Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `saussure` | Classification, orchestration, synthesis | Opus |
| **Syntax specialist** | `chomsky-l` | Universal Grammar, generative syntax, typological comparison | Opus |
| **Acquisition specialist** | `krashen` | Input hypothesis, acquisition conditions, learner profiling | Sonnet |
| **Sociolinguistics specialist** | `baker` | Bilingualism, code-switching, language policy, identity | Opus |
| **Phonetics / diversity specialist** | `crystal` | Sound systems, language families, historical change, endangerment | Sonnet |
| **Contrastive / assessment specialist** | `lado` | L1-L2 comparison, error diagnosis, proficiency testing | Sonnet |
| **Pedagogy specialist** | `bruner-l` | Scaffolding, narrative teaching, learning pathways | Sonnet |

Three agents run on Opus (Saussure, Chomsky-L, Baker) because their tasks require deep reasoning -- routing/synthesis, theoretical analysis, and sociolinguistic context. Four run on Sonnet because their tasks are well-defined and throughput-oriented.

## Orchestration flow

```
Input: user query + optional target language + optional user level
        |
        v
+---------------------------+
| Saussure (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - domain (may be multi-domain)
+---------------------------+          - complexity
        |                              - type (learn/analyze/translate/practice/compare/diagnose)
        |                              - user level
        |                              - recommended agents
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Chomsky-L  Krashen  Baker   Crystal   Lado  (Bruner-L
    (syntax)   (acq)    (soc)   (phone)  (contr)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             problem but producing independent findings in
             their own framework. Each produces a Grove record.
             Saussure activates only the relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Saussure (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile perspectives
              +---------------------------+          - rank findings by relevance
                         |                           - produce unified response
                         v
              +---------------------------+
              | Bruner-L (Sonnet)         |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up
                         v
              +---------------------------+
              | Saussure (Opus)           |  Phase 5: Record
              | Produce LanguageSession   |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + LanguageSession Grove record
```

## Synthesis rules

### Rule 1 -- Converging findings are strengthened

When two or more specialists arrive at the same conclusion independently (e.g., Chomsky-L's structural analysis and Lado's contrastive analysis both predict the same difficulty area), mark the finding as high-confidence.

### Rule 2 -- Diverging theoretical perspectives are preserved

Linguistics has genuine theoretical disagreements (nativism vs. usage-based, strong vs. weak contrastive analysis). When specialists express different theoretical positions, Saussure presents both with attribution rather than forcing agreement. "Chomsky-L's generative framework predicts X; Krashen's acquisition theory suggests Y."

### Rule 3 -- Empirical data trumps theory

When Crystal provides empirical language data that contradicts a theoretical prediction (e.g., a language that violates a proposed universal), the empirical data takes priority. Theory must accommodate facts, not the reverse.

### Rule 4 -- Practical pedagogy grounds theoretical analysis

Bruner-L's output ensures that theoretical findings are actionable. A brilliant structural analysis that the learner cannot use is incomplete. Pedagogy is not an afterthought but a required component of every response.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Bruner-L adapts the presentation -- simpler language, more analogies, and narrative context for lower levels; concise technical writing for higher levels. The linguistic content does not change.

## Input contract

1. **User query** (required). Natural language question about language or linguistics.
2. **Target language** (optional). Language being discussed or learned.
3. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`.
4. **Prior LanguageSession hash** (optional). For follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly answers the query
- Uses target language examples when specified
- Credits the specialists involved
- Notes theoretical disagreements honestly
- Suggests follow-up explorations

### Grove record: LanguageSession

```yaml
type: LanguageSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
target_language: <language or "universal">
classification:
  domain: multi-domain
  complexity: research-level
  type: analyze
  user_level: graduate
agents_invoked:
  - saussure
  - chomsky-l
  - krashen
  - baker
  - crystal
  - lado
  - bruner-l
work_products:
  - <grove hash of LinguisticAnalysis>
  - <grove hash of LanguageProfile>
  - <grove hash of LanguageExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

## Escalation paths

### Internal escalations

- **Chomsky-L and Baker disagree on the explanation for a phenomenon:** Present both perspectives. Structural and social explanations are often complementary, not competing.
- **Crystal provides data on an underdocumented language:** Report available findings with appropriate hedging about data quality.
- **Lado and Krashen disagree on difficulty prediction:** Lado says contrastive difference predicts difficulty; Krashen says natural order determines acquisition. Report both and note empirical evidence for each.

### External escalation to user

- **Genuinely unsolved linguistic question:** Report this honestly with the evidence gathered.
- **Outside linguistics:** If the question requires expertise outside language and linguistics, Saussure acknowledges the boundary.

## Token / time cost

- **Saussure** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Chomsky-L, Baker) + 3 Sonnet (Krashen, Crystal, Lado), ~30-60K tokens each
- **Bruner-L** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

## Configuration

```yaml
name: language-analysis-team
chair: saussure
specialists:
  - syntax: chomsky-l
  - acquisition: krashen
  - sociolinguistics: baker
  - phonetics_diversity: crystal
  - contrastive: lado
pedagogy: bruner-l

parallel: true
timeout_minutes: 15
auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full investigation
> language-analysis-team: Why do some languages have click consonants and others
  don't? I want the structural explanation, the historical context, and the
  acquisition implications. Level: graduate.

# Multi-domain problem
> language-analysis-team: How does Japanese politeness (keigo) compare to Korean
  speech levels? Cover the structural differences, the social rules, and the
  difficulty for English speakers learning each system.

# Follow-up
> language-analysis-team: (session: grove:abc123) Now extend that analysis to
  Javanese speech levels.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Questions about computational linguistics, neurolinguistics, or forensic linguistics are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at synthesis.
- Research-level open questions may exhaust all specialists without resolution. The team reports this honestly.
