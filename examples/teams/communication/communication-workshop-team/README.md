---
name: communication-workshop-team
type: team
category: communication
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/communication/communication-workshop-team/README.md
description: Full Communication Department workshop team for multi-domain problems spanning speaking, listening, persuasion, interpersonal dynamics, conflict, and media analysis. Aristotle-C classifies the query along four dimensions and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, level-appropriate response with pedagogical scaffolding from Freire. Use for research-level questions, graduate-level work requiring coordinated specialist input, or any communication problem where the domain is not obvious and different perspectives may yield different insights. Not for routine coaching, pure speech preparation, or pure media analysis.
superseded_by: null
---
# Communication Workshop Team

Full-department multi-perspective workshop team for communication problems that span domains or resist classification. Runs specialists in parallel and synthesizes their independent findings into a coherent response.

## When to use this team

- **Multi-domain problems** spanning speaking, persuasion, interpersonal dynamics, media, and conflict -- where no single specialist covers the full scope.
- **Research-level questions** where the domain is not obvious and the problem may yield different insights from different communication perspectives.
- **Graduate-level work** requiring coordinated input from multiple specialists (e.g., analyzing a political campaign's communication strategy across speeches, media, and interpersonal dynamics).
- **Novel problems** where the user does not know which specialist to invoke, and Aristotle-C's classification is the right entry point.
- **Cross-domain synthesis** -- when understanding a communication phenomenon requires seeing it through multiple lenses (rhetorical structure via King, conversational dynamics via Tannen, media effects via McLuhan).
- **Comprehensive evaluation** -- when a communication artifact needs assessment across delivery, argument, audience connection, media platform, and power dynamics simultaneously.

## When NOT to use this team

- **Simple speech coaching** -- use `douglass` directly.
- **Pure argument construction** where the domain is clear -- use `debate-team`.
- **Pure media analysis** -- use `media-analysis-team`.
- **Beginner-level teaching** with no research component -- use `freire` directly.
- **Single-domain problems** where the classification is obvious -- route to the specialist via `aristotle-c` in single-agent mode.

## Composition

The team runs all seven Communication Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `aristotle-c` | Classification, orchestration, synthesis | Opus |
| **Speaking specialist** | `douglass` | Speech delivery, oral advocacy, presentation coaching | Opus |
| **Argument specialist** | `wollstonecraft` | Persuasive writing, argument mapping, fallacy detection | Sonnet |
| **Rhetoric specialist** | `king` | Audience connection, rhetorical structure, leadership communication | Opus |
| **Interpersonal specialist** | `tannen` | Conversational dynamics, cross-cultural communication, style analysis | Sonnet |
| **Media specialist** | `mcluhan` | Media ecology, platform analysis, medium/message relationship | Sonnet |
| **Pedagogy specialist** | `freire` | Dialogical education, power analysis, facilitation design | Sonnet |

Three agents run on Opus (Aristotle-C, Douglass, King) because their tasks require deep reasoning and rhetorical sensitivity. Four run on Sonnet because their tasks are well-scoped and analytically systematic.

## Orchestration flow

```
Input: user query + optional user level + optional prior CommunicationSession hash
        |
        v
+---------------------------+
| Aristotle-C (Opus)        |  Phase 1: Classify the query
| Chair / Router             |          - domain (may be multi-domain)
+---------------------------+          - complexity (routine/challenging/research-level)
        |                              - type (practice/analyze/explain/create/evaluate)
        |                              - user level (beginner/intermediate/advanced/graduate)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Douglass  Wollstone- King    Tannen  McLuhan  (Freire
    (speak)   craft(arg) (rhet)  (interp) (media)  waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, analyzing the same
             problem from their own framework. Each produces
             a Grove record. Aristotle-C activates only the
             relevant subset -- not all 5 are invoked on
             every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Aristotle-C (Opus)        |  Phase 3: Synthesize
              | Merge specialist outputs  |          - reconcile tensions
              +---------------------------+          - rank findings by relevance
                         |                           - produce unified response
                         v
              +---------------------------+
              | Freire (Sonnet)           |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - add learning pathway
                         |                           - suggest follow-up explorations
                         v
              +---------------------------+
              | Aristotle-C (Opus)        |  Phase 5: Record
              | Produce CommunicationSession |      - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + CommunicationSession Grove record
```

## Synthesis rules

### Rule 1 -- Converging analyses are strengthened

When two or more specialists arrive at the same insight independently (e.g., Tannen identifies a style mismatch and McLuhan identifies a platform effect that amplifies it), mark the insight as high-confidence.

### Rule 2 -- Complementary analyses are woven together

Communication problems are inherently multi-dimensional. Douglass's delivery analysis, Wollstonecraft's argument evaluation, King's audience connection assessment, and McLuhan's medium analysis are typically complementary rather than competing. The synthesis weaves them into a multi-layered response.

### Rule 3 -- Tensions are preserved and explored

When specialists disagree (e.g., King recommends an emotional appeal that Wollstonecraft considers a logical weakness), Aristotle-C does not force reconciliation. Instead: present both perspectives with attribution, explain the tension, and help the user decide based on their specific context.

### Rule 4 -- Power dynamics are always surfaced

Freire's power analysis is never treated as optional decoration. If the problem involves communication between parties with unequal power (which most do), the power dimension is included in the synthesis.

### Rule 5 -- User level governs presentation, not content

All specialist findings are included regardless of user level. Freire adapts the presentation -- simpler language and more scaffolding for lower levels, concise analysis for higher levels. The communication content does not change, only the framing.

## Input contract

1. **User query** (required). Natural language communication question, problem, or request.
2. **User level** (optional). One of: `beginner`, `intermediate`, `advanced`, `graduate`.
3. **Prior CommunicationSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that directly answers the query, credits the specialists involved, notes any unresolved tensions, and suggests follow-up explorations.

### Grove record: CommunicationSession

```yaml
type: CommunicationSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  domain: multi-domain
  complexity: research-level
  type: analyze
  user_level: graduate
agents_invoked:
  - aristotle-c
  - douglass
  - wollstonecraft
  - king
  - tannen
  - mcluhan
  - freire
work_products:
  - <grove hash of CommunicationAnalysis>
  - <grove hash of SpeechDraft>
  - <grove hash of ArgumentMap>
  - <grove hash of CommunicationExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: graduate
```

## Configuration

```yaml
name: communication-workshop-team
chair: aristotle-c
specialists:
  - speaking: douglass
  - argument: wollstonecraft
  - rhetoric: king
  - interpersonal: tannen
  - media: mcluhan
pedagogy: freire

parallel: true
timeout_minutes: 15

auto_skip: true
min_specialists: 2
```

## Invocation

```
# Full workshop analysis
> communication-workshop-team: Analyze the communication strategy of the 2008
  Obama presidential campaign across speeches, media, and interpersonal
  outreach. Level: graduate.

# Multi-domain problem
> communication-workshop-team: Why do some leaders inspire loyalty through
  communication while others create resentment? I want the rhetorical analysis,
  the interpersonal dynamics, the media strategy, and the power dynamics.

# Follow-up
> communication-workshop-team: (session: grove:abc123) Now compare that to the
  2016 campaign's communication strategy.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (e.g., computational linguistics, advanced statistics on media effects) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at the synthesis level.
- Research-level open questions may receive analyses from multiple perspectives without definitive resolution. The team reports this honestly.
