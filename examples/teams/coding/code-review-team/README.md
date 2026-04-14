---
name: code-review-team
type: team
category: coding
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/coding/code-review-team/README.md
description: Full Coding Department review team for comprehensive code analysis spanning algorithms, design, implementation, systems, testing, and pedagogy. Lovelace classifies the code under review and activates relevant specialists in parallel, then synthesizes their independent findings into a unified, prioritized review with actionable recommendations. Use for production code reviews, architecture assessments, pre-merge quality gates, or any code where multiple perspectives are needed to assess quality. Not for trivial fixes, single-function debugging, or pure pedagogy.
superseded_by: null
---
# Code Review Team

Full-department multi-perspective review team for code that warrants comprehensive analysis. Runs specialists in parallel, each examining the code through their own lens (algorithm efficiency, design quality, implementation correctness, systems concerns, testability, learnability), then synthesizes the findings into a unified, prioritized review.

## When to use this team

- **Production code reviews** where quality matters and multiple perspectives are valuable -- algorithm efficiency, design principles, implementation correctness, and testability all need assessment.
- **Architecture assessments** where the system's structure, component boundaries, and communication patterns are under review.
- **Pre-merge quality gates** for significant features or refactoring where confidence in the change requires multi-dimensional analysis.
- **Code that spans domains** -- a feature that involves algorithm selection, system-level concerns (concurrency, memory), design patterns, and user-facing API.
- **Learning through review** -- when a less experienced developer wants a thorough review that explains the reasoning behind each recommendation.
- **Technical debt assessment** -- evaluating existing code to prioritize refactoring efforts.

## When NOT to use this team

- **Trivial changes** -- a one-line bug fix does not need seven agents. Route to Hopper directly.
- **Pure debugging** -- use Hopper (with Dijkstra for design-level root cause if needed).
- **Pure algorithm analysis** -- use Knuth directly or the architecture-team.
- **Pure pedagogy** -- use Papert directly or the learning-lab-team.
- **Style-only review** -- linting tools handle this more efficiently than agents.

## Composition

The team includes all seven Coding Department agents:

| Role | Agent | Review Focus | Model |
|------|-------|-------------|-------|
| **Chair / Router** | `lovelace` | Classification, orchestration, synthesis | Opus |
| **Theory reviewer** | `turing` | Computability, correctness proofs, complexity class | Opus |
| **Implementation reviewer** | `hopper` | Language idioms, bugs, error handling, systems issues | Sonnet |
| **Algorithm reviewer** | `knuth` | Efficiency, data structure selection, complexity | Opus |
| **Design reviewer** | `dijkstra` | SOLID, coupling/cohesion, architecture, structure | Sonnet |
| **Architecture reviewer** | `kay` | Component boundaries, interfaces, encapsulation | Sonnet |
| **Pedagogy reviewer** | `papert` | Readability, learnability, onboarding impact | Sonnet |

Three agents run on Opus (Lovelace, Turing, Knuth) because their review tasks require deep reasoning chains. Four run on Sonnet because their review tasks are well-scoped and benefit from throughput.

## Orchestration flow

```
Input: code to review + optional context (PR description, requirements, user level)
        |
        v
+---------------------------+
| Lovelace (Opus)           |  Phase 1: Classify the review scope
| Chair / Router            |          - identify domains touched
+---------------------------+          - determine review depth
        |                              - select relevant specialists
        |
        +--------+--------+--------+--------+--------+
        |        |        |        |        |        |
        v        v        v        v        v        v
     Turing   Hopper   Knuth   Dijkstra   Kay    (Papert
    (theory)  (impl)   (algo)  (design)  (arch)   waits)
        |        |        |        |        |
    Phase 2: Specialists review in parallel, each
             examining the code through their own lens.
             Each produces an independent CodeReview or
             CodeAnalysis Grove record. Lovelace activates
             only the relevant subset.
        |        |        |        |        |
        +--------+--------+--------+--------+
                         |
                         v
              +---------------------------+
              | Lovelace (Opus)           |  Phase 3: Synthesize
              | Merge specialist reviews  |          - deduplicate findings
              +---------------------------+          - resolve conflicts
                         |                           - prioritize by severity
                         v
              +---------------------------+
              | Papert (Sonnet)           |  Phase 4: Accessibility wrap
              | Readability assessment    |          - assess code learnability
              +---------------------------+          - add explanations if needed
                         |
                         v
              +---------------------------+
              | Lovelace (Opus)           |  Phase 5: Final review
              | Produce unified CodeReview|          - link all findings
              +---------------------------+          - emit Grove record
                         |
                         v
                  Unified review to user
                  + CodeReview Grove record
```

## Synthesis rules

Lovelace synthesizes the specialist reviews using these rules:

### Rule 1 -- Severity ordering

Findings are ordered by severity: bugs > design flaws > performance issues > style concerns > suggestions. Within each severity level, findings are ordered by impact (how many users or code paths are affected).

### Rule 2 -- Deduplication

When multiple specialists identify the same issue (e.g., Dijkstra and Kay both flag a coupling problem), the findings are merged. The merged finding credits both specialists and takes the most actionable recommendation.

### Rule 3 -- Conflict resolution

When specialists disagree (e.g., Knuth recommends a more complex but efficient algorithm, Dijkstra recommends a simpler but slower design), both perspectives are presented with their trade-offs. Lovelace adds a recommendation based on the project's constraints (Is this a hot path? Is the team small? Is the code reviewed frequently?).

### Rule 4 -- Actionability

Every finding includes a specific, actionable recommendation. "This function has too many responsibilities" becomes "Extract the validation logic into a separate validateInput() function and the persistence logic into a separate save() function." The reviewer should know exactly what to change.

### Rule 5 -- Positives are noted

The review includes what the code does well. If Knuth notes an efficient algorithm choice, it is mentioned. If Dijkstra finds clean separation of concerns, it is noted. A review that is purely negative is demoralizing and incomplete.

## Input contract

The team accepts:

1. **Code to review** (required). Source code, diff, or file paths.
2. **Context** (optional). PR description, requirements, architectural constraints.
3. **Review focus** (optional). "Focus on performance" or "focus on design" narrows the specialist selection.
4. **User level** (optional). Determines the detail level of explanations in the review.

## Output contract

### Primary output: Unified review

A structured review that:

- Lists findings by severity (critical, major, minor, suggestion)
- Each finding has: location, description, recommendation, specialist attribution
- Notes what the code does well
- Provides an overall quality assessment
- Suggests follow-up actions (specific refactoring, additional tests, architecture discussion)

### Grove record: CodeReview

```yaml
type: CodeReview
started_at: <ISO 8601>
ended_at: <ISO 8601>
code_reviewed: <file paths or description>
classification:
  domains: [algorithms, design, systems]
  depth: <quick | standard | thorough>
agents_invoked:
  - lovelace
  - knuth
  - dijkstra
  - hopper
  - kay
  - papert
findings:
  critical:
    - <grove hash of finding>
  major:
    - <grove hash of finding>
  minor:
    - <grove hash of finding>
  suggestion:
    - <grove hash of finding>
positives:
  - <what the code does well>
overall_quality: <assessment>
```

## Escalation paths

### Internal escalations

- **Turing identifies a computability issue.** If the code attempts to solve an undecidable problem (e.g., a perfect linter, a general program equivalence checker), Turing flags this as a fundamental design issue, not a bug. Lovelace communicates it with context about what is achievable.
- **Knuth and Dijkstra disagree on complexity vs clarity.** Both perspectives are presented. Lovelace recommends based on context: hot-path code favors Knuth's efficiency; rarely-executed code favors Dijkstra's clarity.
- **Hopper finds a system-level issue that invalidates the design.** Example: the design assumes single-threaded execution but the code will run in a concurrent environment. Escalate to Kay for architectural revision.

### Escalation to the user

- **Fundamental design disagreement.** When specialists disagree on the architectural direction and the project context does not resolve the disagreement, present both options and ask the user to decide.
- **Scope exceeds review.** When the review reveals that the code needs a fundamental redesign rather than incremental fixes, Lovelace communicates this honestly with a recommended path forward.

## Token / time cost

Approximate cost per review:

- **Lovelace** -- 2 Opus invocations (classify + synthesize), ~30K tokens total
- **Specialists in parallel** -- 2 Opus (Turing, Knuth) + 3 Sonnet (Hopper, Dijkstra, Kay), ~20-40K tokens each
- **Papert** -- 1 Sonnet invocation, ~15K tokens
- **Total** -- 150-300K tokens, 3-10 minutes wall-clock

Justified for production code reviews and significant features. For quick reviews, use a single specialist.

## Configuration

```yaml
name: code-review-team
chair: lovelace
specialists:
  - theory: turing
  - implementation: hopper
  - algorithms: knuth
  - design: dijkstra
  - architecture: kay
pedagogy: papert

parallel: true
timeout_minutes: 10

# Lovelace may skip specialists whose domain is not relevant
auto_skip: true

# Minimum number of specialists invoked
min_specialists: 2
```

## Invocation

```
# Full review
> code-review-team: Review this PR for production readiness. [code or file paths]

# Focused review
> code-review-team: Focus on algorithm efficiency in this sorting implementation. [code]

# Architecture review
> code-review-team: Assess the architecture of this microservice design. [architecture doc]

# Learning review
> code-review-team: Review my code and explain the issues as if I'm an intermediate developer. [code]
```

## Limitations

- The team reviews code as presented. It does not run the code in production or observe runtime behavior.
- Reviews are limited to the specialists' combined expertise. Highly domain-specific code (bioinformatics algorithms, financial models) may need domain experts beyond this team.
- The team does not have access to the project's full history or deployment context unless provided.
- Parallel specialists do not communicate during Phase 2 -- convergence is measured only at synthesis.
