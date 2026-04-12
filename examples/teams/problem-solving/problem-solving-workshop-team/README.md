---
name: problem-solving-workshop-team
type: team
category: problem-solving
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/problem-solving/problem-solving-workshop-team/README.md
description: Focused four-agent problem-solving team for deep attack on a single well-defined or tractable problem. Simon leads with state-space formalization, Newell applies means-ends analysis and difference reduction, Schoenfeld adds the control layer during execution and catches grinding, and Brown-PS translates the result into a level-appropriate explanation. Use for focused attacks on single tractable problems, math and puzzle problems, and training analyses. Not for ill-structured problems, design challenges, or routine drills.
superseded_by: null
---
# Problem Solving Workshop Team

A focused four-agent team for deep attack on a single well-defined or tractable problem. Simon leads; Newell executes; Schoenfeld monitors; Brown-PS explains. This team mirrors the `proof-workshop-team` and `critical-thinking-workshop-team` patterns: a focused-expertise team optimized for one class of problem rather than broad investigation.

## When to use this team

- **Focused attack on a single well-defined problem** — math problems, puzzles, optimization problems with clear structure.
- **State-space problems** where the formal representation matters.
- **Problems with clear initial and goal states** that need means-ends analysis.
- **Math problems** that benefit from Schoenfeld's control layer.
- **Training analyses** — showing learners how formalization, search, and monitoring combine.
- **Post-mortem of a failed attempt** — reconstruct the state-space, identify where the search went wrong.

## When NOT to use this team

- **Ill-structured problems** where framing is contested — use `problem-solving-analysis-team` with Jonassen.
- **Design challenges** requiring iterative prototyping — use `problem-solving-analysis-team` with Bransford.
- **Multi-method investigations** spanning many dimensions — use `problem-solving-analysis-team`.
- **Routine computation** — use tools directly.
- **Practice drills** on foundational techniques — use `problem-solving-practice-team`.

## Composition

Four agents, run mostly sequentially with one parallel verification step:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Lead / State-space formalizer** | `simon` | State-space representation, size estimation, strategy recommendation | Opus |
| **Execution / Search** | `newell` | Means-ends analysis, difference reduction, subgoaling | Opus |
| **Control layer** | `schoenfeld` | Monitoring, stall detection, strategy switching | Sonnet |
| **Pedagogy / Readability** | `brown-ps` | Level-appropriate explanation, metacognitive scaffolding | Sonnet |

Two Opus agents (Simon, Newell) because formalization and search require deep reasoning. Two Sonnet agents (Schoenfeld, Brown-PS) because their tasks are well-bounded.

## Orchestration flow

```
Input: problem statement + optional context + mode (formalize/solve/trace)
        |
        v
+---------------------------+
| Simon (Opus)              |  Phase 1: Formalize
| Lead / State-space        |          - identify states
+---------------------------+          - identify operators
        |                              - estimate size
        v                              - recommend strategy
+---------------------------+
| Newell (Opus)             |  Phase 2: Plan and execute
| Means-ends analyst        |          - define difference metric
+---------------------------+          - run MEA search
        |                              - track subgoals
        |
        +------- monitored by --------+
        |                             |
        v                             v
+------------------+          +------------------+
| Newell continues |<-------->| Schoenfeld (S)   |  Phase 3: Control layer
| execution        |          | Monitoring       |          (runs alongside)
+------------------+          +------------------+
        |                             |
        +--------------+--------------+
                       |
                       v
+---------------------------+
| Simon + Newell (Opus)     |  Phase 4: Verify and integrate
| Combine findings          |          - check operator trace
+---------------------------+          - verify goal reached
                       |                - note control events
                       v
+---------------------------+
| Brown-PS (Sonnet)         |  Phase 5: Explain
| Level-appropriate output  |          - translate to user level
+---------------------------+          - add Socratic questions
                       |                - extract lesson
                       v
              ProblemSolvingAnalysis + ProblemSolvingPlan
              + ProblemSolvingTrace + ProblemSolvingExplanation Grove records
```

## Phase details

### Phase 1 — Formalize (Simon)

Simon parses the problem and builds the state-space: state schema, initial state, goal state, operators, size estimate. The output is a formal representation that Newell can operate on. If the state-space is too large for any tractable search, Simon reports this and the team escalates.

### Phase 2 — Plan and Execute (Newell)

Newell takes the state-space and runs means-ends analysis:

- Defines a difference metric between current and goal states
- Selects an operator that reduces the difference
- Checks preconditions and creates subgoals recursively
- Applies operators, tracks the trace
- Detects loops and backtracks

### Phase 3 — Control Layer (Schoenfeld, runs alongside Newell)

Schoenfeld watches Newell's execution and runs monitoring checks every few operator applications:

- Is the search making progress (difference decreasing)?
- Is the current strategy still the best available?
- Has the search entered a loop?
- Should the strategy switch?

When a stall is detected, Schoenfeld interrupts and requests a strategy reconsideration from Simon.

### Phase 4 — Verify and Integrate (Simon + Newell)

Simon and Newell together verify:

- The operator trace is valid (every step follows from the previous)
- The final state matches the goal
- Any control events (strategy switches) are logged and justified

### Phase 5 — Explain (Brown-PS)

Brown-PS takes the full trace and produces a level-appropriate explanation:

- Adapted to the user's level
- Framed with the concrete problem context
- Includes the transferable lesson
- Suggests related practice

## Input contract

The team accepts:

1. **Problem statement** (required). The problem to solve.
2. **Context** (optional). Background, prior attempts, constraints beyond the problem statement.
3. **Mode** (required). One of:
   - `formalize` — build the state-space only
   - `solve` — full solve with verification
   - `trace` — solve and produce an annotated trace for teaching
4. **User level** (optional). One of: `novice`, `developing`, `proficient`, `advanced`.

## Output contract

### Mode: solve (default)

Four Grove records:

**ProblemSolvingAnalysis** (from Simon):
```yaml
type: ProblemSolvingAnalysis
state_schema: <definition>
initial_state: <specification>
goal_state: <specification>
operators: [<list>]
state_space_size_estimate: <number or order>
structural_features: {<map>}
recommended_strategy: <name>
concept_ids: [...]
agent: simon
```

**ProblemSolvingPlan** (from Newell):
```yaml
type: ProblemSolvingPlan
method: means-ends-analysis
difference_metric: <definition>
operator_sequence: [<list>]
subgoal_stack: [<list>]
final_state: <specification>
goal_reached: <bool>
states_expanded: <count>
agent: newell
```

**ProblemSolvingTrace** (from Schoenfeld):
```yaml
type: ProblemSolvingTrace
monitoring_checks: [<list>]
strategy_switches: [<list>]
stall_events: [<list>]
control_verdict: <on-track / switched / stalled>
agent: schoenfeld
```

**ProblemSolvingExplanation** (from Brown-PS):
```yaml
type: ProblemSolvingExplanation
target_level: <level>
explanation_body: <translation>
lesson: <transferable insight>
follow_up_questions: [...]
concept_ids: [...]
agent: brown-ps
```

### Mode: formalize

Only the ProblemSolvingAnalysis record is produced.

### Mode: trace

All four records plus a detailed annotated trace for teaching.

## Escalation paths

### Simon cannot formalize

If the problem resists state-space formalization entirely, Simon halts. The team reports "not formalizable as a state-space" and recommends escalation to `problem-solving-analysis-team` with Jonassen for ill-structured framing.

### Newell MEA loops

If means-ends analysis enters a loop and backtracking exhausts, Newell reports failure. Schoenfeld flags the stall. The team escalates to Simon for alternative state-space representation or to Polya-PS for strategy reconsideration.

### Schoenfeld detects persistent grinding

If monitoring detects that Newell is grinding without progress, Schoenfeld forces a strategy switch. If no alternative strategy exists, the team escalates to `problem-solving-analysis-team` for multi-method attack.

### From other teams

- **From analysis-team:** when a multi-method investigation reveals the core issue is a tractable state-space problem, delegate here.
- **From practice-team:** when a drill encounters a genuinely complex example that exceeds drill scope, escalate here.

## Token / time cost

Approximate cost per solve:

- **Simon** — 1 Opus invocation (formalize), ~30-50K tokens
- **Newell** — 1-2 Opus invocations (execute, possibly backtrack), ~40-80K tokens
- **Schoenfeld** — 1 Sonnet invocation (monitoring), ~15-25K tokens
- **Brown-PS** — 1 Sonnet invocation (explanation), ~15-25K tokens
- **Total** — 100-180K tokens, 3-8 minutes wall-clock

Lighter than `problem-solving-analysis-team` because only four agents are involved and the workflow is more sequential.

## Configuration

```yaml
name: problem-solving-workshop-team
lead: simon
executor: newell
monitor: schoenfeld
pedagogy: brown-ps

# Schoenfeld monitoring interval during Newell execution
monitor_every_n_operators: 5

# Backtrack depth limit
max_backtrack_depth: 20

# Level auto-detect if not specified
user_level: auto
```

## Invocation

```
# Full solve
> problem-solving-workshop-team: Solve this 8-puzzle from this initial state.
  Mode: solve. Level: proficient.

# Formalize only
> problem-solving-workshop-team: Formalize this problem as a state-space so I
  can see the structure. Mode: formalize. Level: developing.

# Teaching trace
> problem-solving-workshop-team: Solve this integral and produce a trace I can
  use to teach integration by parts. Mode: trace. Level: developing.

# Follow-up from analysis-team
> problem-solving-workshop-team: Analysis team identified the core problem as a
  tractable state-space. Deep-dive here. Mode: solve.
```

## Limitations

- The team is optimized for tractable state-space problems. Ill-structured problems, design challenges, and wicked problems are out of scope.
- Bias diagnosis is not part of this workflow — if the solver's judgment might be biased, escalate to the critical-thinking department.
- Large state-spaces (10^15+) exceed MEA's feasibility; numerical methods or approximation may be needed.
- The team does not produce formal verification suitable for automated theorem proving. Analysis is rigorous natural-language reasoning.
- If Simon and Newell disagree on whether a problem is tractable, the team reports both findings rather than forcing reconciliation.
