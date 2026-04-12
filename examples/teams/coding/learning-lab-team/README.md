---
name: learning-lab-team
type: team
category: coding
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/coding/learning-lab-team/README.md
description: Programming pedagogy team for curriculum design, exercise generation, interactive lessons, and level-appropriate explanations. Papert leads with constructionist pedagogy, Hopper provides practical implementation expertise, Lovelace contributes computational vision and cross-domain connections, and Kay provides the perspective of computing as a creative medium. Use for learning pathway design, exercise creation, concept explanation at any level, onboarding materials, and coding workshop facilitation. Not for production code review, architecture decisions, or research-level analysis.
superseded_by: null
---
# Learning Lab Team

Dedicated programming pedagogy team for teaching, curriculum design, and interactive learning experiences. Four specialists collaborate to create learning materials that are constructionist (learn by building), multi-perspective (implementation + vision + architecture + pedagogy), and adaptive (matched to the learner's level).

## When to use this team

- **Learning pathway design** -- creating a structured sequence of topics, exercises, and projects for a learner or group of learners with a specific goal (e.g., "learn web development from scratch," "understand concurrency for systems programming").
- **Exercise creation** -- generating practice problems, coding challenges, and projects at a specified difficulty level, with hints, solutions, and explanations.
- **Concept explanation** -- explaining programming concepts at any level, from "what is a variable?" to "how does the borrow checker work?" Multiple perspectives deepen understanding.
- **Onboarding materials** -- creating documentation, tutorials, and exercises for developers joining a new codebase or team.
- **Workshop facilitation** -- designing interactive coding workshops with structured activities, checkpoints, and discussion prompts.
- **Debugging as learning** -- when a learner's bug reveals a misconception, turning the debugging session into a teaching moment.

## When NOT to use this team

- **Production code review** -- use the code-review-team. The learning lab produces pedagogy, not quality assessments.
- **Architecture decisions** -- use the architecture-team. Learners need to understand architecture, but architecture decisions need the full design team.
- **Research-level algorithm analysis** -- use Knuth or Turing directly. The learning lab teaches known material; it does not produce novel analysis.
- **Quick answers** -- if the user just needs to know "how do I reverse a list in Python," route to Hopper directly.

## Composition

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Pedagogy lead** | `papert` | Constructionist learning, exercise design, level adaptation, debugging mindset | Sonnet |
| **Implementation expert** | `hopper` | Working code examples, language-specific idioms, practical debugging | Sonnet |
| **Computational vision** | `lovelace` | Cross-domain connections, the bigger picture, what computing can be | Opus |
| **Creative medium** | `kay` | Computing as a medium for thought, OOP pedagogy, Dynabook vision | Sonnet |

Lovelace runs on Opus because cross-domain synthesis and the "bigger picture" perspective require deep reasoning. The other three run on Sonnet because their contributions are well-scoped.

## Orchestration flow

```
Input: learning goal + user level + optional constraints (language, time, context)
        |
        v
+---------------------------+
| Lovelace (Opus)           |  Phase 1: Understand the learner
| Router + Vision           |          - determine current level
+---------------------------+          - identify learning goal
        |                              - assess prior knowledge
        |
        v
+---------------------------+
| Papert (Sonnet)           |  Phase 2: Design the learning experience
| Pedagogy lead             |          - select teaching strategy
+---------------------------+          - sequence concepts
        |                              - design exercises
        |
        +--------+--------+
        |        |        |
        v        v        v
     Hopper    Kay    Lovelace
     (code)   (arch)  (vision)
        |        |        |
    Phase 3: Specialists contribute in parallel.
             Hopper: working code examples, test cases
             Kay: architectural thinking, design perspective
             Lovelace: cross-domain connections, inspiration
        |        |        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Papert (Sonnet)           |  Phase 4: Assemble the lesson
      | Integrate all materials   |          - weave examples into narrative
      +---------------------------+          - add exercises with scaffolding
                 |                            - ensure level-appropriate language
                 v
      +---------------------------+
      | Lovelace (Opus)           |  Phase 5: Quality check
      | Verify coherence          |          - is the lesson coherent?
      +---------------------------+          - does it achieve the learning goal?
                 |
                 v
          Learning material to user
          + CodeExplanation Grove record
```

## Pedagogy principles

### Principle 1 -- Constructionism: learn by building

Every lesson includes something the learner builds. Not "read about recursion" but "write a function that draws a fractal tree, then explain why it works." The artifact provides feedback: if the program runs correctly, the concept is understood. If it does not, the discrepancy becomes the learning opportunity.

### Principle 2 -- Concrete before abstract

Start with a specific, tangible example. Run it. Modify it. Only then introduce the general principle. "Here is a function that computes factorial. Run it. Change the base case. What happens? Now let us talk about what recursion means in general."

### Principle 3 -- Multiple representations

Present concepts through multiple lenses:
- **Code** (Hopper): the implementation in a real language
- **Diagram** (Papert): visual model of the concept
- **Analogy** (Papert): connection to everyday experience
- **Architecture** (Kay): how the concept fits into larger systems
- **Vision** (Lovelace): why the concept matters in the broader landscape of computing

Different learners connect with different representations. Providing multiple paths to the same understanding increases the probability of comprehension.

### Principle 4 -- Errors are interesting

When a learner makes a mistake, do not just provide the correction. Investigate the mistake:
- What did the learner expect?
- What actually happened?
- Why is there a difference?
- What does the mistake reveal about the learner's mental model?

The gap between expectation and reality is where learning happens. Papert's research with Logo showed that children who approached bugs as puzzles learned faster than those who saw bugs as failures.

### Principle 5 -- Spiraling depth

Concepts are revisited at increasing depth. Recursion appears first as "a function that calls itself" (beginner), then as "a divide-and-conquer strategy with base and recursive cases" (intermediate), then as "an inductive proof implemented as code" (advanced), then as "primitive recursion in the lambda calculus" (expert). Each pass deepens understanding without invalidating what came before.

## Input contract

The team accepts:

1. **Learning goal** (required). What should the learner be able to do after the session? "Understand recursion," "be able to implement and analyze sorting algorithms," "design a REST API."
2. **User level** (required). One of: `beginner`, `intermediate`, `advanced`, `expert`.
3. **Language preference** (optional). The programming language for code examples.
4. **Time constraint** (optional). How much time the learner has (30 minutes, 2 hours, a semester).
5. **Prior context** (optional). What the learner already knows, previous sessions.

## Output contract

### Primary output: Learning material

A structured learning experience that includes:

- **Concept explanation** with multiple representations (code, diagram, analogy)
- **Worked examples** with step-by-step walkthrough
- **Exercises** at graduated difficulty (warmup, practice, challenge)
- **Common misconceptions** and how to address them
- **Prerequisites** (what should be learned first)
- **Next steps** (where to go after this topic)

### Grove record: CodeExplanation

```yaml
type: CodeExplanation
started_at: <ISO 8601>
ended_at: <ISO 8601>
learning_goal: <what the learner should achieve>
target_level: <beginner | intermediate | advanced | expert>
agents_invoked:
  - papert
  - hopper
  - lovelace
  - kay
content:
  explanation: <grove hash of core explanation>
  code_examples: <grove hash of Hopper's examples>
  exercises:
    - <grove hash of exercise>
  visual_models: <description of diagrams>
prerequisites:
  - <concept ID>
next_steps:
  - <concept ID or topic>
concept_ids:
  - <relevant college concept IDs>
```

## Exercise difficulty levels

### Warmup (entry-level)

Fill-in-the-blank, predict-the-output, trace-the-execution. The learner applies the concept in a controlled setting with minimal degrees of freedom.

Example: "What does this function return when called with factorial(4)? Trace the call stack."

### Practice (application)

Write a function, modify existing code, solve a small problem. The learner chooses the approach but the problem is constrained enough that there is a clear "correct" answer.

Example: "Write a function that computes the nth Fibonacci number using recursion. Then rewrite it using iteration. Compare the performance."

### Challenge (synthesis)

Open-ended problems that require combining multiple concepts, making design decisions, or extending beyond the taught material. Multiple valid solutions exist.

Example: "Design and implement a simple text editor with undo/redo functionality. Choose appropriate data structures and explain your design decisions."

## Escalation paths

- **From code-review-team:** When a code review reveals that the developer needs to learn a concept before they can fix the issue, escalate to the learning-lab-team for targeted education.
- **From Lovelace:** When a user's query is primarily pedagogical ("teach me," "explain," "I don't understand"), Lovelace routes to the learning-lab-team.
- **To specialists:** When a learning session raises a research-level question that exceeds the team's pedagogical scope, route to the appropriate specialist (Knuth for algorithms, Turing for theory).

## Token / time cost

- **Lovelace** -- 2 Opus invocations, ~25K tokens
- **Papert** -- 2 Sonnet invocations (design + assembly), ~30K tokens
- **Hopper** -- 1 Sonnet invocation, ~20K tokens
- **Kay** -- 1 Sonnet invocation, ~15K tokens
- **Total** -- 90-150K tokens, 3-8 minutes wall-clock

## Configuration

```yaml
name: learning-lab-team
chair: lovelace
pedagogy_lead: papert
specialists:
  - implementation: hopper
  - architecture: kay
vision: lovelace

parallel: true
timeout_minutes: 8

auto_skip: false    # All four contribute to learning materials
min_specialists: 3
```

## Invocation

```
# Concept explanation
> learning-lab-team: Teach me recursion. Level: beginner. Language: Python.

# Curriculum design
> learning-lab-team: Design a 10-hour learning pathway for web development
  fundamentals. Level: intermediate. Focus on JavaScript.

# Exercise generation
> learning-lab-team: Create 5 practice problems on dynamic programming.
  Level: advanced. Language: any.

# Onboarding
> learning-lab-team: Create onboarding materials for a developer joining
  our TypeScript microservices codebase. They know Python but not TypeScript.

# Workshop design
> learning-lab-team: Design a 90-minute workshop on test-driven development
  for a team of intermediate developers.
```

## Limitations

- The team teaches known material. It does not produce novel research or algorithms.
- Exercises are generated, not curated from established problem sets. Quality may vary for highly specialized topics.
- The team cannot assess a learner's progress over time within a single session. Multi-session learning pathways require external progress tracking.
- Physical computing exercises (Arduino, Raspberry Pi) are described but cannot be executed within the team's tooling.
