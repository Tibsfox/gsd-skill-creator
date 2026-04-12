---
name: problem-solving-practice-team
type: team
category: problem-solving
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/problem-solving/problem-solving-practice-team/README.md
description: Sequential practice pipeline for developing problem-solving skills through structured drills. Jonassen frames the practice question and selects the target problem type, Bransford generates varied anchored example problems, Schoenfeld walks the learner through the solve with explicit control layer, and Brown-PS produces the final explanation and learning-pathway update. Use for skill-building, drill-and-practice sessions, classroom preparation, and systematic development from novice to proficient. Not for solving live problems, open-ended investigation, or ill-structured wicked problems.
superseded_by: null
---
# Problem Solving Practice Team

A sequential four-agent pipeline for practice and skill development. Jonassen frames, Bransford anchors, Schoenfeld walks through, and Brown-PS wraps. This team mirrors the `discovery-team` and `critical-thinking-practice-team` patterns: a sequential pipeline where each stage builds on the previous one's output. Unlike the critical-thinking version, this pipeline emphasizes concrete problem-solving with explicit control-layer scaffolding.

## When to use this team

- **Skill-building sessions** for any of the six problem-solving skills (comprehension, strategy selection, mathematical, design-thinking, collaborative, metacognitive).
- **Drill-and-practice** where a learner wants to work through multiple varied examples of the same technique.
- **Classroom preparation** for a teacher building a lesson on a specific problem-solving skill.
- **Systematic development** from novice to proficient, one skill at a time.
- **Metacognitive practice** to improve monitoring and control.
- **Self-study** with scaffolding at each step rather than feedback after submission.

## When NOT to use this team

- **Solving live problems** that matter now — use `problem-solving-workshop-team`.
- **Open-ended investigation** — use `problem-solving-analysis-team`.
- **Ill-structured wicked problems** — use `problem-solving-analysis-team` with Jonassen leading.
- **Pure concept lookups** — use `brown-ps` directly with Mode: explain.
- **Research or discovery** where new findings are the goal — this team produces practice, not discoveries.

## Composition

Four agents, run sequentially:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Framer** | `jonassen` | Frame the practice question, select target type, set the level | Sonnet |
| **Example generator** | `bransford` | Generate varied anchored practice problems at the chosen level | Sonnet |
| **Walk-through analyst** | `schoenfeld` | Walk the learner through the solve with explicit control layer | Sonnet |
| **Pedagogy wrap** | `brown-ps` | Produce final explanation, pathway update, and next-steps | Sonnet |

All four agents are Sonnet. This team is the most Sonnet-heavy in the department because each stage is well-bounded and throughput matters more than the deepest reasoning. For learners who need deeper analysis, the workshop team (with Simon and Newell on Opus) is the better choice.

## Orchestration flow

```
Input: target skill + current level + optional preference for example type
        |
        v
+---------------------------+
| Jonassen (Sonnet)         |  Stage 1: Frame the practice
| Framer                    |          - which skill?
+---------------------------+          - current level?
        |                              - what needs practice?
        |                              - set target (e.g., "apply means-ends
        |                                analysis to 3 varied state-space
        |                                problems")
        |                              Output: practice frame
        v
+---------------------------+
| Bransford (Sonnet)        |  Stage 2: Generate anchored examples
| Example generator         |          - produce 3-5 varied examples
+---------------------------+          - each grounded in a concrete case
        |                              - mix difficulty
        |                              - include one case that tests transfer
        |                              Output: practice set
        v
+---------------------------+
| Schoenfeld (Sonnet)       |  Stage 3: Walk through solve with control
| Walk-through analyst      |          - for each example:
+---------------------------+            - phase 1 understand
        |                                - phase 2 plan
        |                                - phase 3 execute with monitoring
        |                                - phase 4 review
        |                              Output: annotated walk-through
        v
+---------------------------+
| Brown-PS (Sonnet)         |  Stage 4: Wrap and pathway
| Pedagogy wrap             |          - produce level-appropriate explanation
+---------------------------+          - link to college concepts
        |                              - update learning pathway
        |                              - suggest next practice target
        |                              Output: ProblemSolvingExplanation
        v
  Grove records:
  ProblemSolvingAnalysis (frame)
  + ProblemSolvingPlan (practice set)
  + ProblemSolvingTrace (walk-through)
  + ProblemSolvingExplanation (wrap + pathway)
```

## Stage details

### Stage 1 — Framing (Jonassen)

Jonassen clarifies what the user wants to practice. "I want to get better at problem solving" is too vague. "I want to apply means-ends analysis to state-space puzzles at the developing level" is a practice frame. Jonassen negotiates specificity with the learner:

```yaml
skill: strategy-selection
sub-skill: means-ends analysis
current_level: developing
target_outcome: "Learner can correctly apply MEA to 3 of 4 varied state-space problems after the session"
example_type: puzzle problems (8-puzzle variants, missionaries-and-cannibals, monkey-and-bananas)
```

### Stage 2 — Example Generation (Bransford)

Bransford generates 3-5 anchored practice examples matching the frame. Variety is essential: each example is grounded in a specific concrete case, and at least one is a transfer example (same structure, different surface):

```yaml
examples:
  - id: 1
    anchoring_case: "8-puzzle in initial state 1-2-3 / 4-_-5 / 7-8-6"
    target: "reach 1-2-3 / 4-5-_ / 7-8-6"
    difficulty: easy
    target_technique: means-ends analysis
  - id: 2
    anchoring_case: "Monkey in room with box and bananas hanging from ceiling"
    target: "monkey holding bananas"
    difficulty: medium
    target_technique: means-ends analysis with subgoaling
  - id: 3
    anchoring_case: "Tower of Hanoi with 4 disks"
    target: "all disks on target peg"
    difficulty: medium
    target_technique: recursion + means-ends
  - id: 4
    anchoring_case: "Missionaries and cannibals river crossing, 3 of each"
    target: "all on opposite bank, no cannibal majority at any time"
    difficulty: hard
    target_technique: means-ends with constraint satisfaction
    note: "Transfer example — surface differs from 8-puzzle but same deep structure"
```

### Stage 3 — Walk-Through with Control (Schoenfeld)

Schoenfeld works through each example step by step, making Polya's four phases explicit and running monitoring checks at each stage:

```yaml
walk_through:
  - example_id: 1
    phase_1_understand:
      restatement: "8-puzzle in configuration X, goal configuration Y, single tile swap to reach goal."
      knowns: "tile positions, blank position, goal positions"
      unknowns: "sequence of moves"
    phase_2_plan:
      strategies_considered: ["means-ends analysis", "breadth-first search"]
      selected: "means-ends analysis"
      rationale: "Difference is small (1 swap); MEA will find it directly."
    phase_3_execute:
      difference: "tile 6 needs to move from position (2,0) to (2,2)"
      operator_selected: "slide tile 6 left" - precondition not met (blank not at (2,2))
      subgoal: "move blank to (2,2)"
      sub_operator: "slide blank right" - precondition met, apply
      back_to_main: "slide tile 6 left" - now precondition met, apply
      final_state: reached
      monitoring_check_at_step_3: "on plan, making progress, continue"
    phase_4_review:
      answer_verified: true
      lesson: "When the goal is adjacent to current, MEA finds it in 1-2 steps without much subgoaling."
```

Schoenfeld walks through all examples, pausing for questions. The pipeline branches if the learner gets stuck, in which case Schoenfeld produces additional scaffolding before moving on.

### Stage 4 — Wrap and Pathway (Brown-PS)

Brown-PS produces the final explanation, links the practice to the college concept graph, and proposes the next practice target:

```yaml
session_summary:
  skill_practiced: strategy-selection
  sub_skill: means-ends analysis
  target_outcome: 3 of 4 correct
  actual_outcome: 3 of 4
  verdict: advance
  next_concept: prob-working-backwards
  rationale: "Learner demonstrated reliable MEA on varied problems including a transfer case. Working-backwards is the natural next step since it uses the same state-space mental model but runs the search from the other end."
suggested_next_session:
  skill: strategy-selection
  sub_skill: working backwards
  example_count: 4
  estimated_time: "25-40 minutes"
```

## Input contract

The team accepts:

1. **Target skill** (optional). One of the six skill names. If omitted, Jonassen will negotiate.
2. **Current level** (required). One of: `novice`, `developing`, `proficient`, `advanced`.
3. **Example type preference** (optional). "Puzzle," "math," "real-world," "design." Defaults to mixed.
4. **Target outcome** (optional). Specific accuracy or behavior target. Defaults to "3 of 4 correct at current level."

## Output contract

Four Grove records plus a final summary:

- **ProblemSolvingAnalysis** — the practice frame from Jonassen
- **ProblemSolvingPlan** — the anchored example set from Bransford
- **ProblemSolvingTrace** — the walk-through from Schoenfeld
- **ProblemSolvingExplanation** — the wrap and pathway from Brown-PS

Plus the session summary above, which Polya-PS records as a ProblemSolvingSession Grove record for continuity across practice sessions.

## Escalation paths

### Learner gets stuck mid-walk-through

If the learner cannot follow Schoenfeld's walk-through, the pipeline branches:

1. Schoenfeld produces additional scaffolding at one level below the target.
2. Brown-PS generates a Socratic dialogue that leads the learner to the insight.
3. Return to the original example once the prerequisite is in place.

### Learner finds the session too easy

If all examples are correct on the first pass and the learner requests harder material:

1. Bransford generates a new set at one level above.
2. Schoenfeld walks through the new set.
3. The session continues at the elevated level.

### Target skill outside the six skills

If the learner asks to practice something outside the six skills (e.g., formal theorem proving, specialized algorithm design), the team escalates to `problem-solving-analysis-team` for routing or for honest acknowledgment that the topic is outside scope.

### From other teams

- **From analysis-team:** when analysis reveals the learner's issue is practice-related (they know the concept but cannot apply it), delegate here for drills.
- **From workshop-team:** when a workshop session reveals a systematic error pattern, delegate here for targeted practice.

## Token / time cost

Approximate cost per practice session:

- **Jonassen** — 1 Sonnet invocation (framing), ~15-25K tokens
- **Bransford** — 1 Sonnet invocation (example generation), ~20-30K tokens
- **Schoenfeld** — 1 Sonnet invocation (walk-through with control), ~40-60K tokens (longest single call)
- **Brown-PS** — 1 Sonnet invocation (wrap), ~20-30K tokens
- **Total** — 95-145K tokens, 5-10 minutes wall-clock

The practice team is lighter than the workshop team because all four agents are Sonnet and the walk-through is content-dense but well-bounded.

## Configuration

```yaml
name: problem-solving-practice-team
framer: jonassen
example_generator: bransford
walk_through: schoenfeld
pedagogy: brown-ps

# Number of practice examples per session
example_count: 4

# Include at least one transfer example
include_transfer_example: true

# Auto-advance on meeting target outcome
auto_advance: true

# Target outcome
target_accuracy: 0.75
```

## Invocation

```
# Standard practice session
> problem-solving-practice-team: I want to practice means-ends analysis on
  state-space puzzles. Level: developing.

# With specific sub-skill
> problem-solving-practice-team: Drill me on Polya's look-back phase — I keep
  forgetting to verify. 4 problems, mixed types. Level: proficient.

# Classroom preparation
> problem-solving-practice-team: I'm a teacher preparing a lesson on problem
  comprehension. Generate a practice set and walk-through I can use with a
  developing-level class.

# Follow-up
> problem-solving-practice-team: Continue yesterday's session on strategy
  selection. I'm still shaky on when to pick working-backwards over MEA.
  (session: grove:abc123)
```

## Limitations

- The team practices against generated or anchored examples, not live problems. Real-world material may include ambiguities the practice set does not capture.
- Walk-through quality depends on Schoenfeld's ability to explain at the learner's level; Brown-PS handles final translation but the core walk-through is Schoenfeld's.
- The team does not track cross-session progress automatically — that is Polya-PS's job via ProblemSolvingSession records.
- Very advanced learners may outgrow the example difficulty range quickly; the pipeline escalates to analysis-team for genuinely research-level material.
- Practice without active engagement produces little value. The team cannot force engagement; it can only scaffold it.
