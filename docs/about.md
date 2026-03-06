---
title: "About tibsfox, GSD, and Skill Creator"
layer: framework
path: "about.md"
summary: "Background on tibsfox, the GSD workflow system, and the skill-creator adaptive learning layer, including design principles and philosophy."
cross_references:
  - path: "index.md"
    relationship: "builds-on"
    description: "Referenced from main entry point"
  - path: "principles/index.md"
    relationship: "parallel"
    description: "Design principles governing the ecosystem"
  - path: "framework/index.md"
    relationship: "parallel"
    description: "Framework documentation"
  - path: "principles/amiga-principle.md"
    relationship: "parallel"
    description: "The Amiga Principle that shapes the architecture"
reading_levels:
  glance: "Background on tibsfox, the GSD workflow system, and the skill-creator adaptive learning layer, including design principles and philosophy."
  scan:
    - "tibsfox: educational content creator focused on AI-assisted development"
    - "GSD: structured workflow system solving context rot, spec drift, and agent coordination"
    - "Skill Creator: adaptive learning layer solving knowledge loss and token waste"
    - "Together: a self-reinforcing system where structure and learning compound"
    - "Ten design principles proven across 85 milestones"
created_by_phase: "v1.34-329"
last_verified: "2026-03-06"
---

# About tibsfox, GSD, and Skill Creator

This project exists at the intersection of two ideas: that AI-assisted development is a
discipline worth taking seriously, and that the tools supporting it should get better every
time they are used. What started as a skill management utility has grown across 85 milestones,
541+ phases, and over 632,000 lines of code into a comprehensive ecosystem for building,
learning, and teaching with AI. This page explains who built it, why, and the principles
that guide its design.


## tibsfox

tibsfox creates educational content and tooling for AI-assisted development. The work spans
five domains: mathematical foundations (a 923-page textbook called *The Space Between*),
design principles (a detailed analysis of agentic programming), practical tools (the GSD Skill
Creator framework), real-world applications (75-country energy analysis, cloud infrastructure
curricula, electronics educational packs), and community infrastructure (contributing guides,
skill exchange concepts, documentation standards).

The connecting thread across all this work is a commitment to proof before assertion. Every
claim is backed by something you can read, run, or verify. The mathematics textbook shows its
derivations. The framework has 24,500+ passing tests. The educational content includes
interactive labs, not just descriptions. This is not an accident. It reflects a belief that
the most useful educational content is the kind that invites verification rather than demanding
trust.


## The Dual Framework

Two complementary open-source frameworks form the core of the ecosystem. They share filesystem
conventions (`.planning/` directory, `.claude/skills/`, `.claude/agents/`) without overlapping
in function. One provides structure. The other provides learning. Together they solve the full
problem of sustained AI-assisted development.

### get-shit-done (GSD)

GSD, created by glittercowboy, provides the structural and workflow layer. It addresses three
fundamental challenges in AI-assisted development.

**Context rot** is what happens when AI sessions grow longer: the agent's understanding of the
project degrades, earlier decisions are forgotten, and contradictions emerge. GSD externalizes
project state into structured, size-bounded markdown files (PROJECT.md, REQUIREMENTS.md,
ROADMAP.md, STATE.md) that serve as persistent truth, replacing volatile conversation memory.

**Spec drift** is what happens without structure: features get half-built, requirements mutate
mid-implementation, and decision provenance is lost. GSD enforces a spec-driven lifecycle where
nothing gets built until planned and nothing gets merged until verified against the original
specification.

**Multi-agent coordination** is the challenge of managing specialized roles (research,
planning, execution, validation) without context pollution. GSD orchestrates these as
sub-agents with fresh context windows, using the `.planning/` directory as the shared contract
for clean handoffs.

The development lifecycle follows four phases: discuss (scope the work), plan (break into
atomic tasks), execute (implement the plan), and verify (confirm correctness). Each phase has
defined inputs, outputs, and completion criteria. State persists between phases through
structured documents, not conversation history.

### GSD Skill Creator

Skill-creator, built by tibsfox, provides the knowledge and optimization layer. It addresses
the problems that remain after GSD provides structure.

**Knowledge evaporation** is what happens when every new GSD agent spawn starts from zero
knowledge about the developer's patterns. If you always structure error handling or project
layouts the same way, each agent must rediscover this. Skill-creator captures recurring
patterns as compact 300-500 token skills so agents arrive pre-loaded with institutional
knowledge.

**Token waste** occurs when agents load large research documents (3,000-5,000 tokens) mostly
irrelevant to the current task. The compress-research command distills reusable insights into
compact skills, and the token budget system ensures maximum value per token.

**Skill drift** is the risk of naive learning systems that degrade through over-fitting.
Bounded guardrails (20% max change, seven-day cooldown, three or more corrections required,
60% cumulative drift threshold) prevent runaway changes while allowing organic evolution.

**Composition complexity** grows as skills accumulate. Co-activation tracking detects skills
that consistently fire together and auto-generates composite agents, eliminating manual
curation.

### How They Work Together

The integration is clean by design. GSD spawns agents with fresh context. Skill-creator
captures patterns from those sessions. Reusable insights become compact skills. Deterministic
skill ordering maximizes prompt cache hits. Token reporting tracks efficiency. The system gets
cheaper with every milestone as the skill library matures.

This creates a self-reinforcing loop: GSD provides the structured sessions that generate
high-quality observations. Skill-creator transforms those observations into knowledge that
makes future sessions more efficient. The efficiency gains allow more work per session, which
generates more observations. The flywheel turns.


## Design Principles

Ten design principles have emerged and been proven across the project's 85 milestones. These
are not aspirational statements. Each was adopted because a concrete problem demanded it, and
each has been validated through implementation.

**Calm by default.** Control surfaces are quiet under nominal conditions. Information appears
when relevant, not constantly. This applies to the dashboard, the terminal, the staging layer,
and every notification system in the framework.

**Human decisions at human gates.** The system decides what it can and surfaces decisions to
humans only when human judgment genuinely matters. Skill suggestions, refinement proposals, and
composition candidates all require explicit confirmation. Observation, detection, and scoring
happen automatically.

**Isolation is safety.** Mission environments cannot affect the outside world without
authorization. Agent spawns get fresh context. MCP staging gates apply to all paths with no
bypass. The security pipeline enforces deny-by-default.

**The archive is sacred.** Every mission produces a complete, immutable record. Summaries
capture what was built and why. Observations are append-only. Decisions are logged with
provenance. This enables retrospective analysis and organizational learning.

**Leverage over power.** Architectural intelligence beats raw computational power. This is the
[Amiga Principle](principles/amiga-principle.md): the Commodore Amiga achieved extraordinary
multimedia performance not through a faster CPU but through specialized custom chips that
divided labor intelligently. The framework follows this pattern at every level, from the skill
pipeline's six composable stages to the team topologies that match coordination patterns to
work patterns.

**Teach through use.** Every mission is a learning opportunity for skill-creator. The system
observes what works, captures patterns, and feeds them into the next session. Learning happens
as a side effect of productive work, not as a separate activity.

**Fix or amend.** When code does not match its specification, there are exactly two correct
responses: fix the code if the spec is right, or amend the spec with a documented paper trail
if the code reveals a better approach. The third option, leaving the divergence undocumented,
is never acceptable.

**Safety is never parallel.** Safety checks run on the critical path, never parallelized with
the work they guard. The safety warden in the electronics pack, the staging gates in the MCP
pipeline, and the hygiene engine in the content pipeline all enforce this principle.

**Deny by default.** Unknown tools require admin scope. Unknown MCP traffic is blocked until
trust is established. Trust decays over 30 days without reconfirmation. The system assumes
hostility until proven otherwise.

**No criticism during diverge.** During brainstorming's divergent phase, evaluative judgment is
architecturally blocked, not just discouraged. The Critic agent cannot instantiate during
non-Converge phases. This enforces Osborn's rules through code, not policy.


## The Numbers

The project's scale provides context for its claims.

| Metric           | Value     |
|------------------|-----------|
| Milestones shipped | 85      |
| Phases completed   | 541+    |
| Plans executed     | 1,312+  |
| Lines of code      | ~632K   |
| Tests passing      | 24,500+ |
| Educational packs  | 35+     |
| Skills defined     | 80+     |
| Agents defined     | 60+     |
| Teams defined      | 15+     |

These numbers are not goals. They are byproducts of sustained, structured development guided
by GSD's workflow discipline and improved by skill-creator's adaptive learning. The system that
produced them is the same system documented in this ecosystem.


## Open Source

Both GSD and skill-creator are open-source projects. GSD is maintained by glittercowboy. GSD
Skill Creator is maintained by tibsfox. The projects share conventions and complement each
other, but each can be used independently. The integration between them is additive: GSD works
without skill-creator, and skill-creator works without GSD. Together, they are more than the
sum of their parts.

For contributions, see the [Contributing Guide](community/contributing.md). For the project's
design principles in detail, see the [Principles](principles/index.md) layer. For the
framework's technical architecture, see the
[Architecture Overview](framework/architecture/index.md).
