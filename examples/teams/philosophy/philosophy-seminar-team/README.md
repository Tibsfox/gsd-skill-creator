---
name: philosophy-seminar-team
type: team
category: philosophy
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/philosophy/philosophy-seminar-team/README.md
description: Full Philosophy Department seminar team for multi-domain philosophical inquiry spanning logic, ethics, existentialism, political philosophy, metaphysics, and pedagogy. Socrates classifies the query, activates relevant specialists who contribute their tradition's perspective, then synthesizes findings into a unified philosophical response with Dewey providing accessible explanation. Use for comparative philosophy (East/West), multi-tradition analysis, interdisciplinary philosophical questions, or any inquiry where the relevant tradition is unclear and multiple perspectives will yield richer understanding. Not for simple logic exercises, single-framework ethical analysis, or narrow metaphysical puzzles.
superseded_by: null
---
# Philosophy Seminar Team

Full-department multi-tradition seminar team for philosophical questions that cross traditions, resist single-framework analysis, or benefit from comparative perspectives. Runs specialists in parallel and synthesizes their independent contributions into a coherent philosophical response, analogous to how `math-investigation-team` runs multiple mathematical methods on a single problem.

## When to use this team

- **Multi-domain philosophical questions** spanning ethics, logic, metaphysics, existentialism, and political philosophy -- where no single tradition covers the full scope.
- **Comparative philosophy** (East/West) where questions benefit from both Confucian relational ethics and Kantian deontology, or Nagarjuna's emptiness alongside Aristotle's categories.
- **Interdisciplinary philosophical inquiry** where a question about justice, for example, has logical, ethical, existential, political, and metaphysical dimensions simultaneously.
- **Novel philosophical problems** (AI consciousness, climate ethics, digital identity) where the user does not know which tradition to invoke, and Socrates's classification is the right entry point.
- **Comprehensive analysis** where understanding a concept requires seeing it through multiple philosophical lenses -- phenomenological, analytic, pragmatic, and contemplative.
- **Pedagogical depth** where the question warrants both specialist analysis and an accessible synthesis for students or non-specialists.

## When NOT to use this team

- **Simple logic exercises** (syllogisms, truth tables, basic argument mapping) -- use `aristotle` directly. The seminar team's token cost is substantial.
- **Single-framework ethical analysis** where the tradition is clear -- use `ethics-committee-team` or invoke `kant`, `beauvoir`, or `confucius` directly.
- **Narrow metaphysical puzzles** with clear framing -- use `dialectic-team` for thesis-antithesis-synthesis work.
- **Pure existentialist reading** of a text or situation -- use `beauvoir` directly.
- **Beginner-level teaching** with no comparative component -- use `dewey` directly.
- **Contested binary claims** (free will vs. determinism, realism vs. anti-realism) -- use `dialectic-team` which is purpose-built for thesis-antithesis-synthesis.

## Composition

The team runs all seven Philosophy Department agents:

| Role | Agent | Tradition / Method | Model |
|------|-------|--------------------|-------|
| **Chair / Facilitator** | `socrates` | Socratic method, classification, synthesis | Opus |
| **Logic specialist** | `aristotle` | Formal logic, argument structure, categories | Opus |
| **Ethics specialist** | `kant` | Deontological ethics, duty, categorical imperative | Sonnet |
| **Existentialism specialist** | `beauvoir` | Existentialist & feminist philosophy, lived experience | Opus |
| **Political philosophy specialist** | `confucius` | Relational ethics, social harmony, political order | Sonnet |
| **Metaphysics specialist** | `nagarjuna` | Madhyamaka emptiness, tetralemma, dependent origination | Sonnet |
| **Pedagogy specialist** | `dewey` | Pragmatist education, accessible explanation | Sonnet |

Three agents run on Opus (Socrates, Aristotle, Beauvoir) because their tasks require deep reasoning -- Socrates must classify across all traditions and synthesize, Aristotle must evaluate argument validity at research level, and Beauvoir must navigate the interplay between abstract theory and concrete lived experience. Four run on Sonnet because their contributions are well-scoped within their tradition's framework.

## Orchestration flow

```
Input: user query + optional context + optional prior PhilosophySession hash
        |
        v
+---------------------------+
| Socrates (Opus)           |  Phase 1: Classify the query
| Chair / Facilitator       |          - traditions involved (may be multi-tradition)
+---------------------------+          - depth (introductory/undergraduate/graduate/research)
        |                              - type (analyze/argue/compare/explain/explore)
        |                              - dimensions (ethical/logical/metaphysical/political/existential)
        |                              - recommended agents (subset or all)
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
   Aristotle   Kant   Beauvoir  Confucius  Nagarjuna (Dewey
   (logic)    (ethics) (exist)  (politic)  (metaph)   waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, reading the same
             question but contributing their tradition's
             perspective independently. Each produces a
             Grove record. Socrates activates only the
             relevant subset -- not all 5 are invoked on
             every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Socrates (Opus)           |  Phase 3: Synthesize
              | Cross-tradition synthesis |          - identify convergences
              +---------------------------+          - preserve genuine disagreements
                         |                           - map the philosophical landscape
                         v
              +---------------------------+
              | Dewey (Sonnet)            |  Phase 4: Pedagogy wrap
              | Accessible explanation   |          - adapt to audience level
              +---------------------------+          - provide learning pathway
                         |                           - suggest further reading
                         v
              +---------------------------+
              | Socrates (Opus)           |  Phase 5: Record
              | Produce PhilosophySession|          - link all contributions
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + PhilosophySession Grove record
```

## Synthesis rules

Socrates synthesizes the specialist contributions using these rules:

### Rule 1 -- Convergence across traditions is philosophically significant

When two or more specialists from different traditions arrive at the same conclusion independently (e.g., Kant's categorical imperative and Confucius's ren both condemn an action), mark the convergence as philosophically significant. Cross-tradition convergence is not proof of correctness but evidence of deep structure worth noting.

### Rule 2 -- Genuine disagreements are preserved, not resolved

When traditions genuinely disagree (e.g., Kant holds a duty is absolute while Beauvoir argues it must be situated in lived experience), Socrates does not force reconciliation. Instead:

1. State both positions with attribution and their strongest formulations.
2. Identify the root of the disagreement (different axioms, different conceptions of personhood, different epistemological commitments).
3. Map the space of the disagreement -- what would need to be true for each position to hold.
4. Report the disagreement honestly as a genuine philosophical tension.

### Rule 3 -- Lived experience grounds abstraction

When Beauvoir identifies that an abstract argument (from Aristotle, Kant, or Nagarjuna) collapses or distorts when applied to concrete lived experience, the experiential critique takes priority in the synthesis. Abstract arguments must survive contact with the world they claim to describe.

### Rule 4 -- Logical structure constrains all positions

When Aristotle identifies a logical flaw (invalid inference, equivocation, circular reasoning) in any specialist's contribution, the flaw is noted and the affected conclusion is flagged. No tradition is exempt from logical accountability, though Nagarjuna's tetralemma-based arguments are evaluated on their own logical terms.

### Rule 5 -- Audience level governs presentation, not content

All specialist contributions are included in the response regardless of audience level. Dewey adapts the presentation -- more scaffolding, clearer definitions, and concrete examples for lower levels; precise technical language and primary source references for higher levels. The philosophical content does not change, only the framing.

## Input contract

The team accepts:

1. **User query** (required). Natural language philosophical question, dilemma, concept, or text for analysis.
2. **Context** (optional). Background situation, text being studied, or specific philosophical tradition to emphasize.
3. **Prior PhilosophySession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response that:

- Directly addresses the query from multiple philosophical perspectives
- Maps convergences and divergences across traditions
- Credits the traditions and thinkers involved
- Notes genuine unresolved tensions between frameworks
- Provides an accessible summary and suggests further reading

### Grove records

The team produces the following Grove record types:

```yaml
type: PhilosophySession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  traditions: [deontological, existentialist, confucian, analytic, madhyamaka]
  depth: graduate
  type: compare
  dimensions: [ethical, metaphysical, political]
agents_invoked:
  - socrates
  - aristotle
  - kant
  - beauvoir
  - confucius
  - nagarjuna
  - dewey
work_products:
  - <grove hash of PhilosophyArgument>
  - <grove hash of PhilosophyAnalysis>
  - <grove hash of PhilosophyExplanation>
concept_ids:
  - <relevant college concept IDs>
depth: graduate
```

Individual specialist outputs are standalone Grove records:

- **PhilosophyArgument** -- formal argument with premises, inference steps, and conclusion (Aristotle, Kant)
- **PhilosophyAnalysis** -- tradition-grounded analysis of a concept or situation (Beauvoir, Confucius, Nagarjuna)
- **PhilosophyExplanation** -- pedagogically structured explanation (Dewey)
- **PhilosophyDilemma** -- structured moral or philosophical dilemma with framework-specific responses (cross-agent)

## Escalation paths

### Internal escalations (within the team)

- **Aristotle finds logical flaw in another specialist's argument:** The affected specialist is notified. If the flaw is in the argument's structure (not a tradition-specific reasoning style like Nagarjuna's tetralemma), the specialist must reformulate or concede. Socrates adjudicates disputes about whether a reasoning style is legitimately non-classical.
- **Beauvoir's existential critique undermines an abstract argument:** The abstract argument is flagged. The specialist who produced it may defend or revise. Socrates weighs both and reports the tension.
- **Confucius and Kant disagree on a relational vs. universal duty:** Both positions are preserved. Socrates maps the disagreement to its root (individual autonomy vs. relational self, universal vs. particularist ethics) and presents both as live options.
- **Nagarjuna deconstructs a premise shared by multiple specialists:** If the deconstruction is logically valid (even in non-classical terms), all arguments depending on that premise are re-examined. Socrates reports which conclusions survive and which do not.

### External escalations (from other teams)

- **From ethics-committee-team:** When an ethical analysis reveals that the dilemma has deep metaphysical or logical dimensions beyond applied ethics, escalate to philosophy-seminar-team for full multi-tradition treatment.
- **From dialectic-team:** When a thesis-antithesis-synthesis cycle reveals that the question spans more than three perspectives and needs the full department, escalate to philosophy-seminar-team.

### Escalation to the user

- **Genuinely open philosophical question:** If the question appears to be a live, unresolved problem in philosophy (personal identity, hard problem of consciousness, the is-ought gap), report this honestly with all perspectives gathered and the state of the debate.
- **Outside philosophy:** If the question requires empirical domain expertise (neuroscience, economics, legal analysis), Socrates acknowledges the boundary and suggests appropriate resources. Philosophy can frame the question but cannot replace empirical investigation.

## Token / time cost

Approximate cost per seminar:

- **Socrates** -- 2 Opus invocations (classify + synthesize), ~40K tokens total
- **Specialists in parallel** -- 2 Opus (Aristotle, Beauvoir) + 3 Sonnet (Kant, Confucius, Nagarjuna), ~25-50K tokens each
- **Dewey** -- 1 Sonnet invocation, ~20K tokens
- **Total** -- 200-400K tokens, 5-15 minutes wall-clock

This cost is justified for multi-tradition and comparative philosophical questions. For single-tradition or applied ethics questions, use the specialist directly or a focused team.

## Configuration

```yaml
name: philosophy-seminar-team
chair: socrates
specialists:
  - logic: aristotle
  - ethics: kant
  - existentialism: beauvoir
  - political: confucius
  - metaphysics: nagarjuna
pedagogy: dewey

parallel: true
timeout_minutes: 15

# Socrates may skip specialists whose tradition is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full seminar -- comparative philosophy
> philosophy-seminar-team: Compare Eastern and Western conceptions of the self.
  How do Confucian relational selfhood, Buddhist anatta, Kantian
  transcendental ego, and Beauvoir's situated freedom relate to each
  other? Level: graduate.

# Multi-tradition analysis
> philosophy-seminar-team: Is there a universal foundation for human rights,
  or are rights culturally constructed? I want the deontological,
  existentialist, Confucian, and metaphysical perspectives, plus an
  explanation I can use in an undergraduate seminar.

# Follow-up
> philosophy-seminar-team: (session: grove:abc123) Now extend that analysis
  to consider how AI personhood would challenge each tradition's
  conception of rights-bearing subjects.
```

## Limitations

- The team is limited to the seven agents' combined philosophical expertise. Highly specialized sub-disciplines (philosophy of mathematics, philosophy of physics, analytic aesthetics) are handled at the closest available level of generality.
- Parallel specialists do not communicate during Phase 2 -- convergence and divergence are measured only at the synthesis level. This preserves independence but prevents real-time dialectical exchange.
- The team does not access external reference databases beyond what each agent's tools provide (Read/Grep for texts, Bash for computation). Primary source quotation depends on the model's training data.
- The team works in the Western analytic/continental and selected Eastern traditions represented by its agents. Traditions not represented (African philosophy, Indigenous philosophy, Islamic philosophy) are acknowledged as gaps when relevant.
- Genuinely open philosophical questions may exhaust all specialists without resolution. The team reports this honestly rather than manufacturing false consensus.
