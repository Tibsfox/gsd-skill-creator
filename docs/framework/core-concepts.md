---
title: "Core Concepts"
layer: framework
path: "framework/core-concepts.md"
summary: "The four building blocks of GSD Skill Creator: skills, agents, teams, and patterns, and how they connect."
cross_references:
  - path: "framework/index.md"
    relationship: "builds-on"
    description: "Part of framework layer"
  - path: "framework/getting-started.md"
    relationship: "parallel"
    description: "Hands-on introduction to these concepts"
  - path: "framework/architecture/core-learning.md"
    relationship: "parallel"
    description: "Technical implementation of these concepts"
  - path: "principles/agentic-programming.md"
    relationship: "builds-on"
    description: "The design thinking behind skills and agents"
reading_levels:
  glance: "The four building blocks of GSD Skill Creator: skills, agents, teams, and patterns, and how they connect."
  scan:
    - "Skills: atomic learned behaviors stored as markdown with activation triggers"
    - "Agents: composed skill bundles with identity, model preference, and tools"
    - "Teams: coordinated multi-agent workflows with topology patterns"
    - "Patterns: observed session sequences that become skill candidates"
    - "Observations: bounded, token-efficient session summaries driving the learning loop"
created_by_phase: "v1.34-329"
last_verified: "2026-02-25"
---

# Core Concepts

GSD Skill Creator is built on four interconnected abstractions: skills, agents, teams, and
patterns. Each builds on the one before it. Skills are atomic learned behaviors. Agents compose
skills into role-based actors. Teams coordinate agents into collaborative workflows. Patterns
are the raw material from which skills are discovered. Understanding these four concepts and
how they relate gives you the vocabulary to work effectively with the framework.


## Skills

A skill is a reusable knowledge file stored in `.claude/skills/`. It is a markdown document
with YAML frontmatter that defines three things: when the skill should activate (triggers),
what knowledge it provides (content), and metadata for management (name, version, timestamps).

```text
.claude/skills/
  typescript-patterns/
    SKILL.md        # Main skill file (frontmatter + content)
    reference.md    # Optional reference material
    scripts/        # Optional automation scripts
```

Skills are human-readable and editable as plain markdown. They are portable, meaning they
contain no project-specific paths or dependencies. They are version-tracked through git
history. A skill can extend another skill via the `extends:` frontmatter field, creating
inheritance chains for specialized variants.

The design is intentionally simple. A skill is just a markdown file in a specific location with
a specific structure. This simplicity is what makes skills composable: they can be loaded,
combined, and managed without complex orchestration.

### Skill Scopes

Skills exist at two locations, called scopes.

**User-level** skills live at `~/.claude/skills/` and are shared across all projects. These
capture personal preferences, coding standards, and language-specific patterns that apply
regardless of what you are working on.

**Project-level** skills live at `.claude/skills/` within a specific project. These capture
project conventions, framework-specific patterns, and team standards that apply only to that
project.

When the same skill name exists at both scopes, the project-level version takes precedence.
This allows you to create portable user-level skills and override them per-project when needed.
The `skill-creator resolve` command shows which version of a skill is currently active.

### Token Budget

Skills load within a configurable token budget, typically 2-5% of the context window. This
hard limit exists because exceeding it degrades model performance in ways that are difficult
to diagnose after the fact.

The loading pipeline uses a three-tier priority system. **Critical** skills load first and are
always included if they fit. **Standard** skills load next if budget remains. **Optional**
skills load last, only if space allows. Within each tier, skills are ranked by relevance to
the current context.

The budget system distinguishes between installed total (all skill files on disk) and loadable
total (skills that will actually load after tier-based selection). Different agent profiles can
have different budgets, so an executor agent might load different skills than a planner agent.


## Agents

An agent is a composed set of skills with identity. When skills frequently activate together,
they can be bundled into an agent that represents a role-based actor. Agents are stored in
`.claude/agents/` and follow Claude Code's agent format.

An agent specifies which skills it includes, which model it prefers (Opus, Sonnet, or Haiku),
and which tools it may use. The combination creates a purpose-built actor for specific kinds
of work. A "testing agent" might bundle test-writing skills, code analysis skills, and
debugging skills into a single loadable identity.

Skill-creator can generate agents automatically through co-activation tracking. When skills
fire together five or more times over seven or more days, the system detects a stable cluster
and suggests composing them into an agent. The stability requirement (seven days) prevents
transient patterns from creating premature agents. The co-activation threshold (five times)
ensures the pattern is consistent, not coincidental.

You can also create agents manually when you know which skills belong together. The automatic
composition is a convenience, not a requirement.

### Agent Composition Rules

Agent composition follows bounded learning principles. The system clusters related skills
using co-activation data, checks that the cluster is stable over time, and generates the agent
definition. The generated agent combines expertise from its constituent skills without
duplicating their content. Each skill remains independently manageable, and changes to a
skill propagate to all agents that include it.


## Teams

A team coordinates multiple agents into a collaborative workflow. Where an agent represents a
single role, a team represents a division of labor. Teams define a topology that determines
how agents communicate, share work, and produce results.

### Topology Patterns

Four topology patterns are available, each suited to different kinds of work.

**Leader-worker** has a coordinating agent that breaks work into tasks and delegates them to
specialist agents. The leader makes routing decisions, the workers execute, and results flow
back to the leader for integration. This pattern works well when tasks are heterogeneous and
require different expertise.

**Pipeline** chains agents in sequence. Each agent processes the output of the previous one
and passes results to the next. This pattern works well for staged transformations, like
research followed by analysis followed by synthesis.

**Map-reduce** distributes independent work items across parallel agents, then combines their
results. This pattern works well when the same kind of processing needs to happen across many
inputs.

**Swarm** allows agents to self-organize around tasks without central coordination. Agents
claim work based on their capabilities and current load. This pattern works well for
exploratory or loosely structured work.

Teams are defined as YAML configurations that specify which agents participate, which topology
to use, and how communication flows between agents. The framework validates team definitions
against the official format and detects potential issues like deadlocks in pipeline topologies
or missing role assignments.


## Patterns

Patterns are observed sequences in your Claude Code sessions that repeat often enough to
suggest codification as skills. The pattern detection system operates in three stages:
extraction, clustering, and ranking.

### How Patterns Are Detected

**Extraction** identifies recurring sequences from session data. The system looks for command
sequences (like always running tests after code changes), file access patterns (like
consistently touching certain file types together), and workflow structures (like a repeating
create-review-merge cycle).

**Clustering** groups similar patterns using DBSCAN with automatic epsilon tuning. This groups
variations of the same pattern together. If you sometimes run `npm test` and sometimes run
`npm run test:watch`, the clustering recognizes these as variants of a testing pattern.

**Ranking** scores candidates by frequency, cross-project occurrence, recency, and
consistency. A pattern that appears in multiple projects scores higher than one confined to a
single project. A pattern that appeared recently scores higher than one from months ago.

When a pattern reaches the threshold (three or more occurrences by default), it becomes a
candidate. Run `skill-creator suggest` to review candidates with their evidence, then decide
to accept, defer, or dismiss each one.


## Observations

Observations are the raw data that feeds pattern detection. The observation system records
compact summaries of your Claude Code sessions in `.planning/patterns/sessions.jsonl`. It
captures commands executed, files touched, decisions made, and skills activated.

The observation system has three important properties.

**Token-efficient.** Observations store summaries, not full transcripts. Each observation
captures the essential pattern data in a compact format, keeping storage requirements modest
even over long histories.

**Bounded.** Configurable retention limits default to 90 days or 1000 sessions, whichever
comes first. Old observations are compacted and eventually purged. This prevents unbounded
growth and ensures the system runs on patterns from recent, relevant activity.

**Append-only.** The JSONL format supports safe concurrent writes. When multiple agents write
observations simultaneously (common in GSD's multi-agent workflows), the append-only format
prevents corruption. Entries include SHA-256 checksums for integrity verification.


## The Learning Loop

These concepts connect into a self-reinforcing cycle that the framework calls the six-step
flywheel.

**Observe.** During Claude Code sessions, the system records compact summaries of commands,
files, decisions, and skill activations.

**Detect.** The pattern analyzer scans observations for recurring sequences. Command patterns,
file access patterns, and workflow structures are extracted, clustered, and ranked.

**Suggest.** When a pattern reaches the threshold, it becomes a candidate. The user reviews
candidates and decides whether to create skills from them.

**Create.** Accepted patterns become skills with pre-filled content based on the observed
workflow. The skill follows the standard format and is ready for immediate use.

**Refine.** As the skill is used, the system detects corrections. After three or more
corrections to the same skill, it suggests bounded refinements: changes limited to 20% of
the content, with a seven-day cooldown between refinements, and always requiring user
confirmation.

**Compose.** Skills that consistently co-activate are candidates for agent composition. The
cycle completes when composed agents participate in sessions that generate new observations.

The flywheel is bounded at every stage. Observation is rate-limited. Detection requires
statistical significance. Suggestion requires user confirmation. Refinement is constrained by
change limits and cooldowns. Composition requires sustained co-activation. These bounds
prevent the system from drifting, over-fitting, or making changes that the user did not
intend. The [Bounded Learning](framework/architecture/core-learning.md#bounded-learning)
section in the architecture documentation explains the safety mechanisms in detail.
