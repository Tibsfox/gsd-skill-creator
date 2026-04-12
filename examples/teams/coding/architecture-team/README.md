---
name: architecture-team
type: team
category: coding
status: stable
origin: tibsfox
modified: false
first_seen: 2026-04-12
first_path: examples/teams/coding/architecture-team/README.md
description: Focused architecture and design team for system structure decisions, pattern selection, and design-level code review. Dijkstra leads with structured programming and SOLID principles, Kay provides OOP and component architecture, Knuth contributes algorithm-aware design, and Papert assesses learnability and onboarding impact. Use for architecture decisions, design pattern selection, refactoring strategy, system decomposition, and API design. Not for implementation-level debugging, pure algorithm analysis, or beginner-level teaching.
superseded_by: null
---
# Architecture Team

Focused team for software architecture and design decisions. Four specialists collaborate to evaluate system structure, select design patterns, guide refactoring, and ensure that architectural choices are both technically sound and practically maintainable.

## When to use this team

- **Architecture decisions** -- choosing between monolith and microservices, selecting communication patterns, defining component boundaries.
- **Design pattern selection** -- determining which GoF or architectural pattern fits a specific problem and why.
- **Refactoring strategy** -- planning a sequence of design improvements for code with structural problems (high coupling, low cohesion, god classes, tangled dependencies).
- **System decomposition** -- breaking a large system into well-defined modules or services with clear responsibilities and interfaces.
- **API design review** -- evaluating public interfaces for minimality, completeness, and resistance to misuse.
- **Design trade-off analysis** -- when multiple valid approaches exist and the team needs a structured comparison.

## When NOT to use this team

- **Implementation-level debugging** -- use Hopper directly. Architecture does not fix null pointer exceptions.
- **Pure algorithm analysis** -- use Knuth directly. Algorithm complexity is not an architecture concern (though algorithm-aware architecture is).
- **Beginner-level teaching** -- use the learning-lab-team. Architecture discussions assume intermediate-to-advanced understanding.
- **Full code review** -- use the code-review-team if you need implementation review alongside design review.
- **Computability questions** -- use Turing directly.

## Composition

| Role | Agent | Focus | Model |
|------|-------|-------|-------|
| **Design lead** | `dijkstra` | SOLID, structured programming, coupling/cohesion, correctness | Sonnet |
| **Architecture lead** | `kay` | Component boundaries, message passing, encapsulation, API design | Sonnet |
| **Algorithm advisor** | `knuth` | Algorithm-aware design, data structure selection, efficiency implications | Opus |
| **Learnability reviewer** | `papert` | Onboarding impact, documentation needs, team comprehension | Sonnet |

Knuth runs on Opus because algorithm-aware design decisions (e.g., "this data structure choice constrains the architectural options") require deep analysis. The other three run on Sonnet because their review tasks are well-scoped.

Note: Lovelace (CAPCOM) still routes queries to the architecture-team and synthesizes the final output. The team's four specialists work under Lovelace's orchestration.

## Orchestration flow

```
Input: architecture question / code for design review / trade-off analysis
        |
        v
+---------------------------+
| Lovelace (Opus)           |  Phase 1: Frame the design question
| Router                    |          - identify the decision space
+---------------------------+          - determine relevant constraints
        |
        +--------+--------+--------+
        |        |        |        |
        v        v        v        v
    Dijkstra    Kay     Knuth    (Papert
    (design)   (arch)   (algo)    waits)
        |        |        |
    Phase 2: Specialists analyze in parallel.
             Dijkstra: SOLID compliance, coupling, cohesion
             Kay: component boundaries, interfaces, encapsulation
             Knuth: algorithm implications of design choices
        |        |        |
        +--------+--------+
                 |
                 v
      +---------------------------+
      | Lovelace (Opus)           |  Phase 3: Synthesize
      | Merge design perspectives |          - reconcile disagreements
      +---------------------------+          - produce recommendation
                 |
                 v
      +---------------------------+
      | Papert (Sonnet)           |  Phase 4: Learnability assessment
      | Team impact review        |          - can the team understand this?
      +---------------------------+          - what documentation is needed?
                 |
                 v
      +---------------------------+
      | Lovelace (Opus)           |  Phase 5: Final recommendation
      | Produce CodeAnalysis      |
      +---------------------------+
                 |
                 v
          Architecture recommendation
          + CodeAnalysis Grove record
```

## Synthesis rules

### Rule 1 -- Dijkstra and Kay converge: strong recommendation

When both the design lead (Dijkstra) and the architecture lead (Kay) agree on a recommendation, it is presented as the team's strong recommendation. Their agreement means the solution is both structurally sound (Dijkstra) and architecturally clean (Kay).

### Rule 2 -- Dijkstra and Kay diverge: present both with trade-offs

Dijkstra favors mathematical structure and correctness; Kay favors flexibility and message passing. When they disagree (e.g., Dijkstra recommends a statically-typed interface hierarchy, Kay recommends loose message-passing), both perspectives are presented with explicit trade-offs. The recommendation depends on context: static systems favor Dijkstra; dynamic systems favor Kay.

### Rule 3 -- Knuth's efficiency constraints

Knuth may identify that a design decision has efficiency implications that the other specialists did not consider. For example: "Kay's recommended component boundary requires serializing this data structure across a network boundary, which adds O(n) overhead per request." This constraint is elevated to the recommendation if it materially affects performance.

### Rule 4 -- Papert's learnability veto

If Papert determines that a recommended architecture is too complex for the team to understand and maintain, this is a legitimate concern that modifies the recommendation. A perfect architecture that nobody on the team can work with is worse than a good-enough architecture that the team can maintain. This is not a hard veto -- it is a factor in the final recommendation.

### Rule 5 -- Constraints bound the solution space

Architecture recommendations are bounded by stated constraints: team size, deployment environment, performance requirements, expected rate of change, existing code base. A recommendation that ignores constraints is useless.

## Input contract

The team accepts:

1. **Architecture question** (required). Natural language description of the design decision, system under review, or trade-off to analyze.
2. **Code or architecture documents** (optional). Source code, diagrams, or documentation for review.
3. **Constraints** (optional). Team size, performance requirements, deployment target, timeline.
4. **User level** (optional). Determines the depth of explanation.

## Output contract

### Primary output: Architecture recommendation

A structured recommendation that:

- Frames the design decision clearly
- Presents the recommended approach with rationale
- Notes alternative approaches and why they were not chosen
- Identifies risks and mitigation strategies
- Includes an implementation plan (sequence of changes if refactoring existing code)
- Notes documentation and onboarding needs (from Papert)

### Grove record: CodeAnalysis

```yaml
type: CodeAnalysis
domain: architecture
question: <the design question or system under review>
recommendation:
  approach: <recommended architectural approach>
  pattern: <design pattern, if applicable>
  rationale: <why this approach>
  constraints_satisfied: <which constraints are met>
alternatives:
  - approach: <alternative>
    rejected_because: <reason>
trade_offs:
  - dimension: <performance | flexibility | simplicity | team capacity>
    assessment: <how the recommendation performs on this dimension>
implementation_plan:
  - step: 1
    action: <what to do>
    risk: <what could go wrong>
learnability_assessment: <Papert's evaluation of team impact>
agents_invoked:
  - dijkstra
  - kay
  - knuth
  - papert
```

## Escalation paths

- **From code-review-team:** When a code review reveals architectural problems too significant for inline fixes, escalate to the architecture-team for a dedicated design assessment.
- **To code-review-team:** After an architecture decision is made and implemented, route the implementation to code-review-team for comprehensive quality verification.
- **To the user:** When the architecture decision requires business context (budget, timeline, hiring plans) that the team does not have, escalate with a structured set of questions.

## Token / time cost

- **Lovelace** -- 2 Opus invocations, ~25K tokens
- **Specialists** -- 1 Opus (Knuth) + 2 Sonnet (Dijkstra, Kay), ~20-35K tokens each
- **Papert** -- 1 Sonnet invocation, ~15K tokens
- **Total** -- 100-200K tokens, 3-8 minutes wall-clock

## Configuration

```yaml
name: architecture-team
chair: lovelace
specialists:
  - design: dijkstra
  - architecture: kay
  - algorithms: knuth
learnability: papert

parallel: true
timeout_minutes: 8

auto_skip: false    # All four specialists contribute to architecture decisions
min_specialists: 3
```

## Invocation

```
# Architecture decision
> architecture-team: We need to choose between a monolithic API and microservices
  for a team of 4 developers building a SaaS product. Expected traffic: 1000 req/s.

# Design pattern selection
> architecture-team: Should we use the Repository pattern or Active Record for
  our data access layer? We use TypeScript with PostgreSQL.

# Refactoring strategy
> architecture-team: This 3000-line class handles user management, authentication,
  billing, and notifications. How should we decompose it? [code]

# API design review
> architecture-team: Review this REST API design for our resource management service.
  [API spec]
```

## Limitations

- The team focuses on design, not implementation. It recommends architectures but does not write the code. Implementation goes to Hopper via the code-review-team or direct routing.
- Architecture recommendations are bounded by the specialists' knowledge of current technology. Highly specialized domains (embedded real-time, quantum computing architectures) may exceed the team's expertise.
- The team assumes the constraints provided are complete. Missing constraints (undisclosed performance requirements, unstated regulatory compliance needs) can invalidate recommendations.
