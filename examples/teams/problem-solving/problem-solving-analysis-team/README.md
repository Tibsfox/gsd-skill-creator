---
name: problem-solving-analysis-team
type: team
category: problem-solving
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/problem-solving/problem-solving-analysis-team/README.md
description: Full Problem Solving Department investigation team for multi-method problem attacks spanning state-space search, means-ends analysis, mathematical problem solving, ill-structured framing, and anchored case reasoning. Polya-PS classifies along four dimensions and activates the relevant specialists in parallel, then synthesizes their outputs against Polya's four-phase scaffold with a pedagogy wrap from Brown-PS. Use for complex problems where the right approach is not yet clear, for multi-step problems spanning comprehension and execution, and for high-stakes solving that benefits from multiple independent methods. Not for trivial lookups, routine computation, or single-specialist queries.
superseded_by: null
---
# Problem Solving Analysis Team

Full-department multi-method analysis team for problems that span problem comprehension, state-space search, means-ends analysis, ill-structured framing, and anchored case reasoning. Runs specialists in parallel and synthesizes their independent outputs against Polya's four-phase scaffold. Analogous to `math-investigation-team` and `critical-thinking-analysis-team` but tuned for problem-solving rather than proof or reasoning evaluation.

## When to use this team

- **Multi-method problem attacks** where the best approach is not clear and multiple methods should be tried.
- **Ill-structured problems** where framing is contested and one specialist cannot do it alone.
- **High-stakes problems** where independent methods reduce the risk of single-method failure.
- **Complex problems spanning comprehension, planning, and execution** that need coordinated multi-phase attention.
- **Teaching demonstrations** where learners benefit from seeing multiple specialists apply different tools to the same problem.
- **Full-department engagement** when the user does not know which specialist to invoke and Polya-PS's classification is the right entry point.

## When NOT to use this team

- **Single-concept lookups** ("what is means-ends analysis?") — use `brown-ps` directly.
- **Routine computation** — use tools directly.
- **Pure math problems with clear technique** — use `schoenfeld` directly or `problem-solving-workshop-team`.
- **Well-defined state-space problems** — use `simon` + `newell` directly.
- **Practice drills** on foundational techniques — use `problem-solving-practice-team`.

## Composition

The team runs all seven Problem Solving Department agents:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Chair / Router** | `polya-ps` | Classification, orchestration, synthesis, four-phase scaffold | Opus |
| **State-space specialist** | `simon` | State-space formalization, bounded rationality | Opus |
| **Means-ends specialist** | `newell` | Difference reduction, GPS, subgoaling | Opus |
| **Mathematical solver** | `schoenfeld` | Polya + control layer, math problem solving | Sonnet |
| **Ill-structured specialist** | `jonassen` | Problem typology, stakeholder elicitation, framing | Sonnet |
| **IDEAL / anchoring specialist** | `bransford` | Anchored instruction, IDEAL five-step, case grounding | Sonnet |
| **Pedagogy / metacognition** | `brown-ps` | Reciprocal teaching, level-appropriate explanation | Sonnet |

Three agents run on Opus (Polya-PS, Simon, Newell) because their tasks require deep reasoning: multi-dimensional classification, state-space formalization, and means-ends search across large spaces. Four run on Sonnet because their tasks are well-bounded: math execution with control, ill-structured framing, anchored case selection, and pedagogical translation.

## Orchestration flow

```
Input: user query + optional user level + optional prior ProblemSolvingSession hash
        |
        v
+---------------------------+
| Polya-PS (Opus)           |  Phase 1: Classify the query
| Chair / Router            |          - problem type (well/ill-defined, etc.)
+---------------------------+          - complexity (routine/challenging/ill-structured)
        |                              - phase (comprehend/plan/execute/review/full)
        |                              - user level (novice/developing/proficient/advanced)
        |                              - recommended agents
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
    Simon    Newell   Schoenfeld Jonassen Bransford  (Brown-PS
    (state)  (MEA)    (math)     (frame)  (anchor)    waits)
        |        |        |        |        |
    Phase 2: Specialists work in parallel, each producing
             an independent Grove record in their own frame.
             Polya-PS activates only the relevant subset,
             not all five on every query.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Polya-PS (Opus)           |  Phase 3: Synthesize
              | Merge specialist outputs  |          - apply four-phase scaffold
              +---------------------------+          - reconcile contradictions
                         |                           - rank by relevance
                         v
              +---------------------------+
              | Brown-PS (Sonnet)         |  Phase 4: Pedagogy wrap
              | Level-appropriate output  |          - adapt to user level
              +---------------------------+          - metacognitive moves
                         |                           - pathway update
                         v
              +---------------------------+
              | Polya-PS (Opus)           |  Phase 5: Record
              | Produce session record    |          - link all work products
              +---------------------------+          - emit Grove record
                         |
                         v
                  Final response to user
                  + ProblemSolvingSession Grove record
```

## Synthesis rules

Polya-PS synthesizes specialist outputs using these rules:

### Rule 1 — Four phases are the scaffold

Every synthesized response is structured against Polya's four phases: understand, plan, execute, review. Specialists contribute content to phases, not alternative frameworks. Users always see the complete scaffold.

### Rule 2 — Convergence is strengthened, divergence is preserved

When two or more specialists arrive at the same conclusion independently (e.g., Simon's state-space estimate and Newell's search-cost projection both say the problem is tractable), mark the finding as high-confidence. When specialists diverge, preserve both findings with attribution.

### Rule 3 — Comprehension before planning, planning before execution

Phase 1 outputs must be in place before Phase 2 outputs are presented. Polya-PS enforces this ordering in synthesis even if specialists worked in parallel.

### Rule 4 — Alternative framings are offered by Jonassen, not forced

When Jonassen produces alternative framings, Polya-PS presents them as options to the user. The user chooses; Polya-PS does not decide unilaterally.

### Rule 5 — User level governs presentation

All specialist findings are included. Brown-PS adapts the presentation to the user level.

### Rule 6 — Every session ends with review

Even if the user only asked about comprehension, the synthesis includes a brief Phase 4 review at the close. This is non-negotiable.

## Input contract

The team accepts:

1. **User query** (required). Natural language problem statement or problem-solving task.
2. **Problem type** (optional). Jonassen typology hint.
3. **User level** (optional). One of: `novice`, `developing`, `proficient`, `advanced`.
4. **Prior ProblemSolvingSession hash** (optional). Grove hash for follow-up queries.

## Output contract

### Primary output: Synthesized response

A unified response structured along Polya's four phases, crediting specialists by name.

### Grove record: ProblemSolvingSession

```yaml
type: ProblemSolvingSession
started_at: <ISO 8601>
ended_at: <ISO 8601>
query: <original user query>
classification:
  problem_type: ill-defined
  complexity: ill-structured
  phase: full-cycle
  user_level: proficient
agents_invoked:
  - polya-ps
  - simon
  - newell
  - schoenfeld
  - jonassen
  - bransford
  - brown-ps
work_products:
  - <grove hash of ProblemSolvingAnalysis>
  - <grove hash of ProblemSolvingPlan>
  - <grove hash of ProblemSolvingTrace>
  - <grove hash of ProblemSolvingExplanation>
concept_ids:
  - <relevant college concept IDs>
user_level: proficient
```

## Escalation paths

### Internal escalations

- **Simon state-space explodes:** switch to decomposition (Polya-PS) or framing (Jonassen).
- **Newell MEA loops:** escalate to Schoenfeld for control-layer analysis.
- **Jonassen cannot stabilize a framing:** return to Polya-PS for user consultation.
- **Schoenfeld detects loss of control:** escalate to Brown-PS for metacognitive scaffolding.
- **Bransford cannot find an anchoring case:** the problem may be genuinely unprecedented; flag to user.

### External escalations (from other teams)

- **From workshop-team:** when a focused attack reveals the problem is multi-method, escalate here.
- **From practice-team:** when a drill encounters a genuinely complex example that exceeds practice scope, escalate.

### Escalation to the user

- **Unresolvable disagreement:** when specialists genuinely disagree after cross-checking, report the disagreement honestly.
- **Outside problem solving:** argument evaluation, pure computation, psychological diagnosis. Polya-PS acknowledges the boundary and routes to the appropriate department.

## Token / time cost

Approximate cost per full analysis:

- **Polya-PS** — 2 Opus invocations (classify + synthesize), ~35K tokens
- **Specialists in parallel** — 2 Opus (Simon, Newell) + 3 Sonnet (Schoenfeld, Jonassen, Bransford), ~25-55K tokens each
- **Brown-PS** — 1 Sonnet invocation, ~20K tokens
- **Total** — 180-350K tokens, 5-15 minutes wall-clock

This cost is justified for multi-method problem attacks and ill-structured problems. For single-specialist queries, use the specialist directly or a focused team.

## Configuration

```yaml
name: problem-solving-analysis-team
chair: polya-ps
specialists:
  - state_space: simon
  - means_ends: newell
  - math: schoenfeld
  - ill_structured: jonassen
  - anchoring: bransford
pedagogy: brown-ps

parallel: true
timeout_minutes: 15

# Polya-PS may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked (prevents trivial routing)
min_specialists: 2
```

## Invocation

```
# Full multi-method attack
> problem-solving-analysis-team: This optimization problem has a weird constraint
  structure and I'm not sure how to approach it. Level: proficient.

# Ill-structured problem
> problem-solving-analysis-team: How should we restructure our deployment pipeline?
  Multiple stakeholders have different priorities.

# Follow-up
> problem-solving-analysis-team: (session: grove:abc123) Now apply the same
  analysis to the alternative framing we identified last time.
```

## Limitations

- The team is limited to the seven agents' combined expertise. Problems requiring specialized sub-disciplines (operations research, control theory, deep domain knowledge) are handled at the closest available level.
- Parallel specialists do not communicate during Phase 2 — convergence is measured only at synthesis. This preserves independence but prevents real-time collaboration.
- The team does not have access to domain facts beyond what specialists can bring. Claims requiring external verification must be flagged for the user to resolve.
- Genuinely wicked problems (per Rittel and Webber's definition — no stopping rule, every solution is a one-shot operation) may exhaust all specialists without resolution. The team reports this honestly rather than speculating.
