---
title: "Architecture Overview"
layer: framework
path: "framework/architecture/index.md"
summary: "How GSD Skill Creator's components fit together, from observation through the six-stage loading pipeline to agent orchestration."
cross_references:
  - path: "framework/index.md"
    relationship: "builds-on"
    description: "Part of framework layer"
  - path: "framework/architecture/core-learning.md"
    relationship: "gateway-to"
    description: "Core learning domain detail"
  - path: "framework/core-concepts.md"
    relationship: "parallel"
    description: "Conceptual overview of skills, agents, teams, patterns"
  - path: "framework/features.md"
    relationship: "parallel"
    description: "Complete feature inventory"
  - path: "principles/amiga-principle.md"
    relationship: "builds-on"
    description: "The architectural leverage principle this system embodies"
reading_levels:
  glance: "How GSD Skill Creator's components fit together, from observation through the six-stage loading pipeline to agent orchestration."
  scan:
    - "Three system layers: observation, intelligence, delivery"
    - "Six-stage loading pipeline: score, resolve, model-filter, cache-order, budget, load"
    - "Four data stores: observations, skills, agents, teams"
    - "Integration points: GSD lifecycle hooks, Claude Code context, MCP protocol"
    - "Architectural principle: leverage over power (the Amiga Principle)"
created_by_phase: "v1.34-329"
last_verified: "2026-02-25"
---

# Architecture Overview

GSD Skill Creator is organized in three layers: an observation layer that captures session
data, an intelligence layer that transforms observations into knowledge, and a delivery layer
that loads the right knowledge into the right context at the right time. This document
describes how these layers connect, how data flows through the system, and the key
architectural decisions that shape the design.

The system follows the [Amiga Principle](principles/amiga-principle.md): architectural
leverage over raw computational power. Rather than loading everything and hoping the model
figures out what is relevant, skill-creator uses a composable pipeline to select, order, and
budget skills for maximum impact within tight token constraints. Each stage in the pipeline
does one thing well, and the system's effectiveness comes from their coordination.


## System Layers

The three layers correspond to different concerns and different execution contexts.

### Observation Layer

The observation layer runs during Claude Code sessions and captures structured data about what
happens. It records commands executed, files touched, decisions made, skills activated, and
corrections applied. This data is stored as compact JSONL summaries in
`.planning/patterns/sessions.jsonl`.

The observation layer has four key properties. It is **token-efficient**, storing summaries
rather than full transcripts. It is **bounded**, with configurable retention limits (default 90
days or 1000 sessions). It is **append-only**, using JSONL format for safe concurrent writes
when multiple GSD agents run simultaneously. And it is **integrity-verified**, with SHA-256
checksums on every entry.

Observation also integrates with GSD's lifecycle through hooks. A POSIX shell post-commit hook
captures commit observations at zero runtime cost. Lifecycle hooks at phase boundaries
(plan-complete, execute-complete, verify-complete) trigger observation snapshots.

### Intelligence Layer

The intelligence layer runs on demand and transforms raw observations into actionable
knowledge. It contains three engines.

**Pattern detection** scans observations for recurring sequences. It extracts command n-grams,
file access patterns, and workflow structures, then groups them using DBSCAN clustering with
automatic epsilon tuning. Patterns meeting the occurrence threshold (default three) become
skill candidates.

**Skill generation** transforms accepted candidates into properly formatted skill files. It
pre-fills content based on the observed workflow, assigns activation triggers from the pattern
evidence, and validates the result against the official Claude Code skill format.

**Feedback analysis** tracks corrections to existing skills. When a user overrides or corrects
skill output, the system accumulates feedback. After three or more corrections, it proposes
bounded refinements constrained by the learning safety parameters. See
[Core Learning](framework/architecture/core-learning.md) for the full bounded learning
specification.

### Delivery Layer

The delivery layer runs at agent startup and determines which skills load into context. This
is the most performance-sensitive part of the system because it directly affects model quality
and token budget utilization.

The delivery layer's core mechanism is the six-stage loading pipeline.


## The Six-Stage Loading Pipeline

The pipeline replaces the original monolithic skill loading with a composable architecture.
Each stage is independently configurable, testable, and replaceable.

**Stage 1: Score.** Every installed skill is scored for relevance to the current context. The
relevance scorer examines the current working directory, recent file accesses, active tools,
and the user's stated intent. Skills with higher relevance scores are prioritized in
subsequent stages.

**Stage 2: Resolve.** Scope resolution determines which version of each skill is active. When
the same skill name exists at both user level (`~/.claude/skills/`) and project level
(`.claude/skills/`), the project-level version wins. The resolve stage produces a deduplicated
list of active skills.

**Stage 3: Model-filter.** Skills can specify model compatibility. A skill designed for Opus
might be inappropriate for Haiku. The model-filter stage removes skills that are incompatible
with the current model, preventing mismatched knowledge from degrading performance.

**Stage 4: Cache-order.** Skills are ordered to maximize prompt cache hits. The cacheTier
metadata (values 0-9) determines load order across rapid sequential agent spawns. Skills with
lower cache tiers load first. Because Claude Code maintains a five-minute prompt cache,
consistent ordering across spawns means the cached portion of the prompt grows over time.

**Stage 5: Budget.** The budget stage enforces token limits. Critical skills load first.
Standard skills load next if budget remains. Optional skills load last. Skills exceeding the
per-skill character limit (default 15,000 characters) are flagged as oversized. The total
budget defaults to 2-5% of the context window and can be configured per agent profile.

**Stage 6: Load.** The final stage reads skill files from disk and assembles them into the
prompt. Skills that passed all previous stages are loaded in their cache-tier order. Skills
that were filtered, exceeded budget, or were deprioritized are logged as deferred for
diagnostic purposes.


## Data Architecture

Four data stores support the system's operations. Each uses a format chosen for its specific
access patterns.

### Observations (JSONL)

Observation data lives in `.planning/patterns/sessions.jsonl`. The JSONL format (one JSON
object per line) supports append-only writes, safe concurrent access from multiple agents, and
stream parsing for large files. Each entry includes a SHA-256 checksum for integrity
verification. Retention is bounded by configurable time and count limits.

### Skills (Markdown)

Skills live in `.claude/skills/` (project level) or `~/.claude/skills/` (user level). Each
skill is a directory containing a `SKILL.md` file with YAML frontmatter and optional reference
materials and scripts. The markdown format is human-readable, version-trackable through git,
and directly consumable by Claude Code.

### Agents (Markdown)

Agents live in `.claude/agents/`. Each agent is a markdown file specifying included skills,
model preference, tool permissions, and behavioral instructions. Agents follow Claude Code's
agent format with skill-creator extensions namespaced under
`metadata.extensions.gsd-skill-creator`.

### Teams (YAML)

Teams are defined as YAML configurations specifying topology pattern, participating agents,
communication channels, and coordination rules. The YAML format supports validation against a
schema and machine-readable processing for the orchestrator.


## Integration Points

The architecture connects to its environment through four integration points.

### GSD Lifecycle Hooks

GSD's hook system triggers skill-creator operations at lifecycle boundaries. The PostToolUse
hook auto-compresses research documents when RESEARCH.md is written. Phase completion hooks
trigger observation snapshots. The integration is event-driven: skill-creator responds to GSD
events without GSD needing to know about skill-creator's internals.

### Claude Code Context

Skills load into Claude Code's context window through the standard skill loading mechanism.
Skill-creator does not modify Claude Code's behavior. It produces skill files in the official
format and places them where Claude Code expects to find them. The six-stage pipeline
determines *which* skills are placed, but Claude Code's native loading handles the placement.

### MCP Protocol

The Model Context Protocol integration exposes skill-creator capabilities as MCP tools and
resources. A Rust-based Host Manager handles server lifecycles. A Gateway Server provides 19
tools over Streamable HTTP with per-tool scope enforcement. The Agent Bridge enables agents to
act as both MCP servers and clients, with staging gates on all communication paths.

### Filesystem Message Bus

For multi-agent coordination within GSD's Den operations, a filesystem-based message bus
provides eight priority levels with ISA encoding. Messages are files with structured names
that encode sender, recipient, priority, and sequence. The Dispatcher reads the filesystem
directly rather than maintaining in-memory state, which prevents filter interference with
broadcast routing.


## Architectural Decisions

Several decisions shape the system's character and are worth understanding for anyone working
with or extending the framework.

**Composable pipeline over monolithic loader.** The six-stage pipeline was introduced in v1.8
to replace a monolithic skill loading function. Each stage can be tested independently, and
new stages can be inserted without modifying existing ones. This decision has paid for itself
in every subsequent version.

**Filesystem as coordination substrate.** All inter-component communication uses the
filesystem: JSONL for observations, markdown for skills, YAML for teams, structured filenames
for bus messages. This eliminates the need for background daemons, network protocols, or
shared memory. Components can be written in any language that can read and write files.

**Bounded learning as architectural constraint.** The learning safety parameters (20% max
change, seven-day cooldown, three-correction threshold, 60% cumulative drift limit) are not
configuration options. They are architectural constraints baked into the refinement pipeline.
This prevents well-intentioned configuration changes from creating systems that drift beyond
recognition.

**Deny by default for security.** The MCP security pipeline, the staging hygiene engine, and
the access control system all default to denial. Unknown tools require admin scope. Unknown
content is quarantined. Trust decays over time. This means new features must explicitly earn
trust rather than inheriting it by default.

For the detailed specification of the core learning domain, including all six capabilities and
their bounded learning parameters, see
[Core Learning](framework/architecture/core-learning.md).
