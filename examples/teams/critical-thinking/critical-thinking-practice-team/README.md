---
name: critical-thinking-practice-team
type: team
category: critical-thinking
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/critical-thinking/critical-thinking-practice-team/README.md
description: Sequential practice pipeline for developing critical thinking skills through structured drills. Dewey-ct frames the practice question and selects the target skill, de-bono generates varied example problems to work on, elder walks the learner through the structural analysis, and lipman produces the final explanation and learning-pathway update. Use for skill-building, drill-and-practice sessions, classroom preparation, and systematic development from novice to proficient. Not for evaluating live arguments, deep multi-lens audits, or ill-structured open problems.
superseded_by: null
---
# Critical Thinking Practice Team

A sequential four-agent pipeline for practice and skill development. Dewey-ct frames, de-bono varies, elder walks through, and lipman wraps. This team mirrors the `discovery-team` / `postmortem-team` pattern: a sequential pipeline where each stage builds on the previous one's output. Unlike the discovery team, this pipeline is pedagogy-focused rather than research-focused.

## When to use this team

- **Skill-building sessions** for any of the six critical thinking skills (argument-evaluation, logical-reasoning, cognitive-biases, evidence-assessment, creative-thinking, decision-making).
- **Drill-and-practice** where a learner wants to work through multiple varied examples of the same technique.
- **Classroom preparation** for a teacher building a lesson on a specific skill.
- **Systematic development** from novice to proficient, one skill at a time.
- **Calibration practice** to improve confidence matching on judgments.
- **Self-study** with feedback at each step rather than after submission.

## When NOT to use this team

- **Evaluating live arguments** that already exist and matter now — use `critical-thinking-workshop-team`.
- **Deep multi-lens audits** — use `critical-thinking-analysis-team`.
- **Ill-structured open problems** — use `critical-thinking-analysis-team` with Dewey-ct leading.
- **Pure concept lookups** — use `lipman` directly with Mode: explain.
- **Research or inquiry** where new findings are the goal — this team produces practice, not discoveries.

## Composition

Four agents, run sequentially:

| Role | Agent | Method | Model |
|------|-------|--------|-------|
| **Framer** | `dewey-ct` | Frame the practice question, select target skill, set the level | Sonnet |
| **Example generator** | `de-bono` | Generate varied practice problems at the chosen level | Sonnet |
| **Walk-through analyst** | `elder` | Walk the learner through the structural analysis step by step | Opus |
| **Pedagogy wrap** | `lipman` | Produce final explanation, pathway update, and next-steps | Sonnet |

Only one Opus agent (Elder) because the walk-through is the deepest reasoning task in the pipeline. The other three stages (framing, example generation, explanation) are well-bounded and run on Sonnet.

## Orchestration flow

```
Input: target skill + current level + optional preference for example type
        |
        v
+---------------------------+
| Dewey-ct (Sonnet)         |  Stage 1: Frame the practice
| Framer                    |          - which skill?
+---------------------------+          - current level?
        |                              - what needs practice?
        |                              - set target (e.g., "distinguish
        |                                valid from invalid modus forms")
        |                              Output: practice frame
        v
+---------------------------+
| De-bono (Sonnet)          |  Stage 2: Generate examples
| Example generator         |          - produce 3-5 varied examples
+---------------------------+          - mix difficulty
        |                              - include at least one tricky case
        |                              - label each with features
        |                              Output: practice set
        v
+---------------------------+
| Elder (Opus)              |  Stage 3: Walk through analysis
| Walk-through analyst      |          - for each example:
+---------------------------+            - reconstruct
        |                                - identify form
        |                                - apply diagnostic
        |                                - explain the answer
        |                              Output: annotated walk-through
        v
+---------------------------+
| Lipman (Sonnet)           |  Stage 4: Wrap and pathway
| Pedagogy wrap             |          - produce level-appropriate explanation
+---------------------------+          - link to college concepts
        |                              - update learning pathway
        |                              - suggest next practice target
        |                              Output: CriticalThinkingExplanation
        v
  Grove records:
  CriticalThinkingAnalysis (walk-through)
  + CriticalThinkingConstruct (practice set)
  + CriticalThinkingExplanation (wrap + pathway)
```

## Stage details

### Stage 1 — Framing (Dewey-ct)

Dewey-ct clarifies what the user wants to practice. "I want to get better at critical thinking" is too vague. "I want to recognize affirming-the-consequent in news arguments" is a practice frame. Dewey-ct negotiates specificity with the learner and produces a concrete frame:

```yaml
skill: logical-reasoning
sub-skill: recognizing affirming-the-consequent and denying-the-antecedent
current_level: developing
target_outcome: "Learner can correctly identify these two fallacies in 4 of 5 examples after the session"
example_type: news excerpts, not textbook syllogisms
```

### Stage 2 — Example Generation (De-bono)

De-bono generates 3-5 practice examples matching the frame. Variety is essential: easy cases, hard cases, borderline cases, and at least one case where the form is correct to avoid "find the fallacy" bias. Each example is labeled with its features:

```yaml
examples:
  - id: 1
    text: "If it were raining, the streets would be wet. The streets are wet. So it must be raining."
    target_form: affirming_the_consequent
    difficulty: easy
  - id: 2
    text: "If the law were effective, crime would be down. The law was passed and crime is down. The law is effective."
    target_form: affirming_the_consequent
    difficulty: medium
    note: "Correlation-causation distraction"
  - id: 3
    text: "If I had studied, I would have passed. I passed. So I studied."
    target_form: affirming_the_consequent
    difficulty: medium
  - id: 4
    text: "If the drug works, the patient's symptoms will improve. The patient's symptoms improved. The drug works."
    target_form: affirming_the_consequent
    difficulty: hard
    note: "Strong intuitive pull toward the fallacy"
  - id: 5
    text: "If the hypothesis is wrong, the experiment will not replicate. The experiment did not replicate. The hypothesis is wrong."
    target_form: modus_tollens
    difficulty: medium
    note: "Valid — included to prevent pattern-matching on 'find the fallacy'"
```

### Stage 3 — Walk-Through Analysis (Elder)

Elder works through each example step by step, showing how the analysis proceeds. This is the core learning activity:

```yaml
walk_through:
  - example_id: 1
    reconstruction: |
      P1. If it is raining, then the streets are wet.
      P2. The streets are wet.
      C.  It is raining.
    form: "If P then Q; Q; therefore P"
    verdict: invalid
    form_name: affirming_the_consequent
    explanation: |
      The streets could be wet for many reasons — a truck sprayed them, a
      pipe broke, a fire hydrant is open, the cleaning crew came through.
      The fact that one cause (rain) would produce the effect (wet streets)
      does not mean the observed effect must come from that cause.
      The valid move from "streets are wet" would go the other way:
      if the streets were NOT wet, we could conclude it was NOT raining.
      That is modus tollens, which is valid.
```

Elder walks through all examples, pausing for questions. The pipeline may branch if the learner gets stuck on a specific example, in which case Elder produces additional scaffolding before moving on.

### Stage 4 — Wrap and Pathway (Lipman)

Lipman produces the final explanation, links the practice to the college concept graph, and proposes the next practice target. If the learner achieved the target outcome (4 of 5 correct), advance to the next concept. If not, recommend more practice at the same level.

```yaml
session_summary:
  skill_practiced: logical-reasoning
  target_outcome: 4 of 5 correct
  actual_outcome: 4 of 5
  verdict: advance
  next_concept: crit-inductive-reasoning
  rationale: "Learner demonstrated reliable recognition of affirming the consequent. Inductive reasoning is the natural next step since it requires the learner to distinguish deductive validity from inductive strength."
suggested_next_session:
  skill: logical-reasoning
  sub-skill: distinguishing deductive from inductive arguments
  example_count: 5
  estimated_time: "30-45 minutes"
```

## Input contract

The team accepts:

1. **Target skill** (optional). One of the six skill names. If omitted, Dewey-ct will negotiate with the learner.
2. **Current level** (required). One of: `novice`, `developing`, `proficient`, `advanced`.
3. **Example type preference** (optional). "Textbook," "news," "conversational," "research papers." Defaults to mixed.
4. **Target outcome** (optional). Specific accuracy or behavior target. Defaults to "4 of 5 correct at current level."

## Output contract

Three Grove records plus a final summary:

- **CriticalThinkingConstruct** — the practice set from de-bono
- **CriticalThinkingAnalysis** — the walk-through from elder
- **CriticalThinkingExplanation** — the wrap and pathway from lipman

Plus the session summary above, which Paul records as a CriticalThinkingSession Grove record for continuity across practice sessions.

## Escalation paths

### Learner gets stuck mid-walk-through

If the learner cannot follow Elder's reconstruction, the pipeline branches:

1. Elder produces additional scaffolding at one level below the target (e.g., simpler examples of the same form).
2. Lipman generates a Socratic dialogue that leads the learner to the insight.
3. Return to the original example once the prerequisite is in place.

### Learner finds the session too easy

If all examples are correct on the first pass and the learner requests harder material:

1. De-bono generates a new set at one level above.
2. Elder walks through the new set.
3. The session continues at the elevated level.

### Target skill outside the six skills

If the learner asks to practice something outside the six skills (e.g., formal logic proof theory), the team escalates to `critical-thinking-analysis-team` for routing to an appropriate specialist or for honest acknowledgment that the topic is outside scope.

### From other teams

- **From analysis-team:** When analysis reveals that the learner's underlying issue is practice-related (they know the concept but cannot apply it), delegate here for drill sessions.
- **From workshop-team:** When a workshop session reveals a systematic error pattern, delegate here for targeted practice on that pattern.

## Token / time cost

Approximate cost per practice session:

- **Dewey-ct** — 1 Sonnet invocation (framing), ~15-25K tokens
- **De-bono** — 1 Sonnet invocation (example generation), ~20-30K tokens
- **Elder** — 1 Opus invocation (walk-through), ~50-80K tokens (the longest single call)
- **Lipman** — 1 Sonnet invocation (wrap), ~20-30K tokens
- **Total** — 105-165K tokens, 5-10 minutes wall-clock

The practice team is slightly heavier than the workshop team because the walk-through stage is content-intensive.

## Configuration

```yaml
name: critical-thinking-practice-team
framer: dewey-ct
example_generator: de-bono
walk_through: elder
pedagogy: lipman

# Number of practice examples per session
example_count: 5

# Include at least one valid example to prevent "find the fallacy" bias
include_valid_examples: true

# Auto-advance on meeting target outcome
auto_advance: true

# Target outcome
target_accuracy: 0.8
```

## Invocation

```
# Standard practice session
> critical-thinking-practice-team: I want to practice recognizing confirmation
  bias in real editorials. Level: developing.

# With specific sub-skill
> critical-thinking-practice-team: Drill me on distinguishing deductive validity
  from inductive strength. 5 examples, mixed difficulty. Level: proficient.

# Classroom preparation
> critical-thinking-practice-team: I'm a teacher preparing a lesson on evidence
  assessment. Generate a practice set and walk-through I can use with a
  developing-level class.

# Follow-up
> critical-thinking-practice-team: Continue yesterday's session on logical
  reasoning. I'm still shaky on modus tollens. (session: grove:abc123)
```

## Limitations

- The team practices against generated examples, not live arguments. Real-world material may include ambiguities the practice set does not capture.
- Walk-through quality depends on Elder's ability to explain at the learner's level; Lipman handles final translation but the core walk-through is Elder's.
- The team does not track cross-session progress automatically — that is Paul's job via CriticalThinkingSession records.
- Very advanced learners may outgrow the example difficulty range quickly; the pipeline escalates to analysis-team for genuinely research-level material.
- Practice without the learner's active engagement produces little value. The team cannot force engagement; it can only scaffold it.
