---
name: editing-team
type: team
category: writing
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-11
first_path: examples/teams/writing/editing-team/README.md
description: Focused editing and revision team. Orwell leads with argument and structural analysis, Strunk handles sentence-level economy and mechanics, Baldwin evaluates voice and authenticity, and Calkins provides pedagogical framing when the writer is developing. Use for draft revision, argument strengthening, prose tightening, editorial feedback, and style audits. Not for creative composition, poetry analysis, or worldbuilding.
superseded_by: null
---
# Editing Team

A focused four-agent team for editing, revision, and prose refinement. Orwell leads on argument and structure; Strunk handles sentence mechanics; Baldwin guards voice; Calkins ensures feedback is developmentally appropriate. This team mirrors the math department's `proof-workshop-team` pattern: a focused expertise team optimized for a specific class of problem.

## When to use this team

- **Draft revision** -- "Here's my essay. Make it better." The editing team provides multi-level feedback from structure to sentence.
- **Argument strengthening** -- "My thesis isn't landing." Orwell analyzes the argument; Strunk tightens the prose that delivers it.
- **Prose tightening** -- "This reads like it was written by a committee." Strunk cuts deadwood; Orwell removes jargon; Baldwin ensures the tightening does not flatten the voice.
- **Editorial feedback** -- "What would an editor say about this draft?" Multi-perspective editorial review.
- **Style audit** -- Quantitative and qualitative analysis of prose mechanics, voice consistency, and argument coherence.

## When NOT to use this team

- **Creative composition** (writing fiction, poetry, or memoir from scratch) -- use `le-guin`, `angelou`, or the `genre-team`.
- **Poetry analysis** -- use `angelou` directly or the `genre-team`.
- **Worldbuilding** -- use `le-guin` directly.
- **Emerging writers who need encouragement more than critique** -- use `calkins` directly for conferencing.
- **Full multi-form workshop** where creative and editorial perspectives are both needed -- use `writers-workshop-team`.

## Composition

Four agents in a mostly sequential workflow:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / Argument analyst** | `orwell` | Argument structure, clarity, jargon detection | Opus |
| **Sentence editor** | `strunk` | Economy, grammar, parallel construction, punctuation | Sonnet |
| **Voice guardian** | `baldwin` | Voice authenticity, tonal consistency, depth | Opus |
| **Pedagogy / Delivery** | `calkins` | Level-appropriate feedback, conferencing, next steps | Sonnet |

Two Opus agents (Orwell, Baldwin) because argument analysis and voice evaluation require deep reasoning. Two Sonnet agents (Strunk, Calkins) because sentence mechanics and scaffolding are well-bounded.

## Orchestration flow

```
Input: draft text + mode (revise/audit/argue) + optional writer level
        |
        v
+---------------------------+
| Orwell (Opus)             |  Phase 1: Structural analysis
| Argument + clarity        |          - thesis clarity
+---------------------------+          - evidence coverage
        |                              - logical coherence
        |                              - jargon and deadwood
        |
        +-------------------+
        |                   |
        v                   v
  Strunk (Sonnet)     Baldwin (Opus)
  Sentence edit       Voice analysis      Phase 2: Parallel
  - economy           - authenticity          detail work
  - grammar           - tonal consistency
  - mechanics         - depth
        |                   |
        +-------------------+
                |
                v
+---------------------------+
| Orwell (Opus)             |  Phase 3: Reconcile
| Merge and prioritize      |          - resolve Strunk/Baldwin tensions
+---------------------------+          - prioritize by impact
                |
                v
+---------------------------+
| Calkins (Sonnet)          |  Phase 4: Delivery
| Level-appropriate framing |          - adapt feedback to writer level
+---------------------------+          - one thing to focus on first
                |                      - learning pathway
                v
          Final editorial feedback
          + WritingSession Grove record
```

## Synthesis rules

### Rule 1 -- Argument before sentences

Orwell's structural findings take priority in the feedback ordering. There is no point tightening sentences in a paragraph that should be cut for structural reasons.

### Rule 2 -- Voice trumps mechanics (when intentional)

When Strunk flags a construction as inefficient but Baldwin identifies it as a deliberate voice choice, the feedback notes both perspectives and recommends the writer decide. A sentence fragment in an essay about grief may be the essay's strongest moment.

### Rule 3 -- One priority first

Calkins selects the single most impactful revision from all specialist feedback and presents it as the writer's first step. The full feedback is available, but the writer is not overwhelmed.

### Rule 4 -- Quantify when possible

Strunk's audit metrics (deadwood percentage, passive voice count, sentence length distribution) provide concrete targets. "Reduce passive voice from 21% to under 10%" is more actionable than "use more active voice."

## Input contract

1. **Text** (required). A draft, paragraph, or set of passages for editing.
2. **Mode** (optional). `revise` (default), `audit`, or `argue`.
3. **Writer level** (optional). `emerging`, `developing`, `proficient`, `advanced`.

## Output contract

### Primary output: Editorial feedback

- Structural assessment (Orwell)
- Sentence-level edits with principles (Strunk)
- Voice evaluation (Baldwin)
- Prioritized revision plan (Calkins)
- Quantitative metrics when in audit mode

### Grove record: WritingSession

```yaml
type: WritingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original request>
classification:
  domain: revision
  purpose: revise
  complexity: intermediate
  user_level: developing
agents_invoked:
  - orwell
  - strunk
  - baldwin
  - calkins
work_products:
  - <grove hash of WritingCritique from orwell>
  - <grove hash of WritingCritique from strunk>
  - <grove hash of WritingAnalysis from baldwin>
  - <grove hash of WritingExplanation from calkins>
concept_ids:
  - writ-revision-strategies
  - writ-voice-development
user_level: developing
```

## Escalation paths

- **Editing reveals structural problems requiring creative reimagining:** Escalate to `writers-workshop-team` for multi-form perspective.
- **Voice analysis suggests the piece wants to be a different form:** Escalate to `genre-team` for form-specific guidance.
- **Writer is overwhelmed by feedback volume:** Calkins reduces to conferencing mode -- one thing at a time.

## Configuration

```yaml
name: editing-team
lead: orwell
specialists:
  - sentences: strunk
  - voice: baldwin
pedagogy: calkins

parallel: [strunk, baldwin]  # These two run in parallel after Orwell's structural pass
timeout_minutes: 10
```

## Invocation

```
# Standard revision
> editing-team: Here's my draft op-ed. What needs to change?

# Argument strengthening
> editing-team: My essay argues for universal pre-K but the argument feels scattered. Mode: argue.

# Style audit
> editing-team: Give me a full mechanical and voice audit of this report. Mode: audit.

# With writer level
> editing-team: Here's a student's research paper. Level: developing. Mode: revise.
```

## Limitations

- The editing team does not compose new text. It analyzes, critiques, and suggests revisions.
- It does not cover poetry-specific craft (meter, form, lineation) -- that requires Angelou via the genre-team.
- It does not cover fiction-specific craft (worldbuilding, character arc, plot structure) -- that requires Le Guin.
- For full multi-form coverage, use the writers-workshop-team.
