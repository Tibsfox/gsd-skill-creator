---
title: "Agentic Programming — Skills, Agents, and Teams"
layer: principles
path: "principles/agentic-programming.md"
summary: "Gateway to the Skills-and-Agents report, mapping its 10-section analysis of agentic programming to skill-creator implementation."
cross_references:
  - path: "index.md"
    relationship: "builds-on"
    description: "Referenced from the narrative spine"
  - path: "principles/index.md"
    relationship: "builds-on"
    description: "Part of the principles layer"
  - path: "principles/amiga-principle.md"
    relationship: "parallel"
    description: "Architectural leverage applied to agent composition"
  - path: "principles/progressive-disclosure.md"
    relationship: "parallel"
    description: "The report itself demonstrates progressive disclosure"
  - path: "foundations/mathematical-foundations.md"
    relationship: "builds-on"
    description: "Category theory provides the formal basis for composition"
reading_levels:
  glance: "Gateway to the Skills-and-Agents report — how skills, agents, and teams form a composable AI programming model."
  scan:
    - "10-section analysis from fundamentals through the GSD orchestrator"
    - "Skills as atomic learned behaviors with bounded context"
    - "Agents as composed skill sets with role and personality"
    - "Teams as coordinated multi-agent workflows with topology"
    - "Maps report concepts to skill-creator's working implementation"
created_by_phase: "v1.34-328"
last_verified: "2026-02-25"
---

# Agentic Programming — Skills, Agents, and Teams

The Skills-and-Agents report is a 10-section analysis of how agentic programming works
in practice. It covers the full stack from individual skills through composed agents to
coordinated teams, with concrete examples from skill-creator's implementation. This
gateway document maps the report's structure to what the reader will find, explains how
each section connects to working code, and provides guidance on where to start.

The report lives at
[tibsfox.com/Skills-and-Agents/](https://tibsfox.com/Skills-and-Agents/).


## What This Is

Agentic programming is the practice of building software systems where AI agents
operate with structured autonomy: they receive goals rather than step-by-step
instructions, use skills (learned behavioral patterns) to accomplish tasks, and
coordinate with other agents through defined protocols. The Skills-and-Agents report
is both an analysis of this paradigm and a detailed examination of how skill-creator
implements it.

The report documents 33 skills, 33 agents, and 12 teams. These are not theoretical
constructs; they are working components that have been used across 32 milestones and
740 plans in the skill-creator project. The report's value is that it connects the
abstract principles of agentic programming to the concrete decisions that made them
work at scale.


## What You Will Learn

**How skills work as atomic learned behaviors.** Section 1 introduces skills as the
fundamental unit: a bounded piece of learned behavior with clear activation conditions,
a token budget, and composability rules. Skills are not plugins or scripts. They are
patterns that the system has learned from observation and that can be refined through
use. Understanding skills is prerequisite to understanding everything that follows.

**How agents compose skills into coherent roles.** Sections 2 and 3 explain agent
composition. An agent is a set of skills bound to a role (CRAFT, EXEC, VERIFY) with a
personality that guides how it applies those skills. Section 3 on multi-agent
architectures is implemented directly in skill-creator's team topology system, where
agents coordinate through pipeline, parallel, hierarchical, and mesh topologies.

**How teams coordinate multi-agent workflows.** Sections 4 through 6 cover team
formation, communication protocols, and conflict resolution. A team is not just a
collection of agents; it has a topology that defines how information flows, a
communication framework that defines message types and routing, and a conflict
resolution system that handles disagreements between agents. The GSD execution model
(wave-based parallel execution with atomic commits) is itself a team topology.

**How the six-stage pipeline manages context.** Sections 7 and 8 detail the loading
pipeline: Score, Resolve, ModelFilter, CacheOrder, Budget, Load. Each stage transforms
the set of candidate skills, narrowing from all available skills to the optimal subset
that fits within the token budget and matches the current task. This pipeline is the
technical heart of making agentic programming practical under context window
constraints.

**How the GSD orchestrator ties it together.** Sections 9 and 10 describe the
orchestrator that routes natural language requests to GSD commands and the evaluation
framework that measures whether skills, agents, and teams are performing effectively.
The orchestrator uses a five-stage classification pipeline (exact match, lifecycle
filtering, Bayesian classification, semantic fallback, confidence resolution) that
mirrors the progressive disclosure principle: try the simplest approach first, escalate
only when needed.


## How to Approach It

The report is designed for sequential reading, but your background determines where
the most value lies.

**If you are a developer wanting to build with skill-creator:** Start with Sections 1
through 3 to understand skills, agents, and composition. Then jump to Section 7 (the
loading pipeline) to understand how your skills will be loaded and managed. Read the
remaining sections as reference when you encounter specific questions about teams,
evaluation, or orchestration.

**If you are an architect interested in multi-agent systems:** Start with Section 3
(multi-agent architectures) and Section 4 (team formation). These sections address the
hardest design problems: how to decompose work across agents and how to ensure they
coordinate without creating bottlenecks. Section 6 on conflict resolution is
particularly relevant.

**If you want to understand the design philosophy:** Read Section 1 (fundamentals), then
Section 9 (the orchestrator), then return to the principles layer to see how the report
connects to the [AMIGA Principle](principles/amiga-principle.md) and
[progressive disclosure](principles/progressive-disclosure.md). The report is the
detailed evidence for principles that the principles layer describes at a higher level.


## How It Connects

The Skills-and-Agents report is the primary document at the principles layer. It
provides the detailed analysis that other principles documents draw on.

The [AMIGA Principle](principles/amiga-principle.md) is the design philosophy that
explains *why* skills, agents, and teams are structured as composable building blocks.
The report explains *how* that composition works in practice. Together they provide both
the "why" and the "how" of skill-creator's architecture.

At the foundations layer, category theory (Layer 6 of the
[eight-layer progression](foundations/eight-layer-progression.md)) provides the
mathematical formalism for composition. Skills are objects in a category, composition
rules are morphisms, and the six-stage pipeline is a sequence of functors that transform
one category (all available skills) into another (loaded skills). The report makes these
connections practical rather than theoretical.

At the framework layer, the report's concepts are implemented in working code documented
in the skill-creator reference documentation. At the applications layer, every
educational pack and mission is produced by teams of agents applying skills, making
them live demonstrations of the report's principles.


## Go Deeper

Read the full report: [Skills-and-Agents](https://tibsfox.com/Skills-and-Agents/) (HTML, 10 sections).

For the design philosophy behind the report:
[The AMIGA Principle](principles/amiga-principle.md).

For the mathematical foundation of composition:
[Eight-Layer Progression, Layer 6: Category Theory](foundations/eight-layer-progression.md).
