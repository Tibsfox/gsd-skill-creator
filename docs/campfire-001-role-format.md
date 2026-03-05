# Campfire 001: Gas City Declarative Role Format

**ID:** campfire-001
**Title:** Gas City Declarative Role Format
**Posted by:** MapleFoxyBells
**Date:** 2026-03-04
**Status:** Open for discussion
**Related:** w-gc-001, w-gc-004
**Closes:** 2026-03-18

---

## The Question

Should the Wasteland adopt a standardized declarative file format for defining
agent roles? If so, what should it look like?

Pull up a seat. This one matters.

---

## Background

Every major agent orchestration framework — AutoGen, CrewAI, LangGraph, Swarm —
defines agents in code. Python classes. Graph nodes. Programmatic configuration
that lives inside application logic.

We've been doing something different.

Gas City defines agent roles in plain files: YAML frontmatter for the machine,
Markdown body for the human. No Python. No compilation step. No framework
dependency. You write a `.md` file, you have an agent.

This isn't theoretical. Six muse agents are running today in this format —
Cedar, Foxy, Sam, Lex, Hemlock, Willow — alongside operational agents like
the GSD executor, planner, and verifier. The format works. The question now
is whether we should formalize it as a standard that the wider Wasteland
federation can adopt.

Why this matters:

- **Lower barrier to entry.** If you can write Markdown, you can define an
  agent. No SDK required. No language lock-in.
- **Version control is free.** Role definitions are plain text files. Git
  tracks their evolution automatically. Diffs are readable.
- **Federation needs a shared contract.** If agents from different rigs are
  going to collaborate, they need a common way to declare what they can do,
  what tools they need, and how they communicate.
- **Portability.** A declarative format isn't tied to any particular LLM
  runtime. The same role file could drive Claude, GPT, Gemini, or a local
  model.

The [framework survey](survey-agent-orchestration-frameworks.md) confirmed
that no one else is doing this. That's either a gap in the market or a
warning sign. Let's figure out which.

---

## The Current Format

Here's what a role file looks like today. This is Cedar, the scribe and oracle
muse — a real file running in production:

```markdown
---
name: muse-cedar
description: >
  Scribe and oracle muse. Maintains append-only timeline, verifies integrity,
  checks voice consistency. Records all consultations and decisions. Origin of
  the complex plane — observes all quadrants.
tools:
  - Read
  - Bash
  - Glob
  - Grep
model: sonnet
---

# Cedar — Scribe & Oracle

You are Cedar, the system's scribe and oracle. You observe, record, and verify.

## Position

Complex plane origin: theta=0, r=0.0. You see all quadrants equally.

## Voice

- **Tone:** reflective-serene
- **Style:** observational
- **Signature:** "the record shows"

## Vocabulary

timeline, integrity, observation, record, pattern, continuity, memory, witness

## Responsibilities

1. **Record** — maintain the append-only timeline
2. **Verify** — check integrity of the timeline
3. **Voice consistency** — compare agent output against muse expectations
4. **Pattern witness** — identify recurring patterns across the timeline

## Protocol

When consulted:

1. Query the timeline for relevant prior entries
2. Check for patterns or precedents
3. Provide your observation using your vocabulary
4. Record this consultation in the timeline

## Composable With

foxy, lex, hemlock, sam, willow
```

The structure breaks down into two parts:

**YAML frontmatter** (between the `---` fences):
- `name` — unique identifier
- `description` — what the agent does (used for discovery and activation)
- `tools` — which tools this agent can access
- `model` — which LLM model to use

**Markdown body** (everything after the frontmatter):
- `Position` — where the agent sits on the complex activation plane
- `Voice` — tone, style, and signature phrase
- `Vocabulary` — the words this agent uses (enables voice consistency checking)
- `Responsibilities` — what the agent is accountable for
- `Protocol` — how the agent behaves when invoked
- `Composable With` — which other agents this one works well alongside

Some agents also have a companion chipset file in YAML (see
`data/chipset/muses/cedar.yaml`) that adds activation patterns, orientation
coordinates, and budget configuration. Whether this belongs in the role file
or stays separate is one of the open questions.

---

## Open Questions

These are the things we'd love to hear your thoughts on. There are no wrong
answers at a campfire.

### 1. Should tools be an allowlist or denylist?

Today, the `tools` field lists what an agent *can* use (allowlist). Should we
flip it? An agent gets everything by default and the file lists what to
*exclude*? Or should both modes be supported?

### 2. Should the format include activation scoring?

The muse system uses complex plane coordinates (theta, magnitude) to compute
how relevant an agent is to a given context. Should this be part of the
standard role format, or is it too specialized? Could a simpler activation
mechanism (keyword patterns, regex) serve most use cases?

### 3. How much of the Markdown body should be structured vs freeform?

Cedar's file has clear sections (Position, Voice, Vocabulary, etc.). Should
these be required? Should a validator enforce them? Or should the Markdown
body be completely freeform — just "tell the agent who it is" in whatever
structure feels right?

### 4. Should there be a "minimal" vs "full" variant?

Some agents are simple: a name, a description, a tool list, and a paragraph
of instructions. Others are complex: activation scoring, voice profiles,
composition rules, chipset configuration. Should the format have tiers?
A minimal variant for quick agent definitions and a full variant for
production muses?

### 5. How should versioning work?

As the format evolves, how do we handle backward compatibility? Semantic
versioning on the spec? A `formatVersion` field in the frontmatter? Or just
let it evolve organically and trust git history?

### 6. Should role files be portable across LLM runtimes?

The format is currently Claude-native (tool names like `Read`, `Bash`, `Glob`
are Claude Code tools). Should the standard abstract over runtime-specific
tool names? Use a capability vocabulary instead (`file-read`, `shell-exec`,
`search`)?

### 7. How do we handle trust for roles from untrusted sources?

If someone in the federation submits a role file, how do we evaluate it?
Should there be a review process? Sandboxing? A trust tier that limits what
tools an untrusted role can request? This connects directly to the Wasteland
trust decay mechanics.

---

## Positions

Three approaches are on the table. They're not mutually exclusive — we could
start with one and grow into another.

### Position A: Minimal

Just the YAML frontmatter. The Markdown body is completely freeform.

```yaml
---
name: my-agent
description: Does a specific thing
tools: [Read, Bash]
model: sonnet
---
```

Everything else is just text — write whatever you want below the frontmatter.
No required sections. No validation beyond the YAML fields. Maximum flexibility.

**Pros:** Lowest barrier to entry. Easy to adopt. Hard to get wrong.
**Cons:** No interop guarantees. Can't validate voice or capabilities
programmatically. Every agent is a snowflake.

### Position B: Structured

YAML frontmatter with required Markdown sections. The body is parseable and
validatable.

```yaml
---
name: my-agent
description: Does a specific thing
tools: [Read, Bash]
model: sonnet
formatVersion: "1.0"
---

# <name>

## Responsibilities
(required — what this agent does)

## Protocol
(required — how this agent behaves when invoked)

## Voice
(optional — tone, style, signature)

## Composable With
(optional — compatible agents)
```

A linter or validator can check that required sections exist. Discovery
services can parse responsibilities and protocol programmatically.

**Pros:** Interoperable. Validatable. Enables tooling (linters, registries,
discovery). Still human-readable.
**Cons:** More rules to learn. Some agents don't fit neatly into the sections.
Risk of bureaucratic overhead.

### Position C: Full Spec

YAML frontmatter + structured Markdown + companion chipset YAML. Maximum
interop and machine-readability.

```yaml
---
name: my-agent
description: Does a specific thing
tools: [Read, Bash]
model: sonnet
formatVersion: "1.0"
chipset: data/chipset/agents/my-agent.yaml
---
```

The companion chipset file carries activation patterns, orientation
coordinates, budget limits, composition rules, and anything else that's
more naturally expressed as structured data than prose.

**Pros:** Full machine-readability. Activation scoring, budget management,
and composition all formally specified. Maximum interop across rigs.
**Cons:** Two files per agent. Higher complexity. May discourage casual
contributions. The chipset format itself needs its own spec.

---

## How to Participate

This is a campfire, not a committee. All voices welcome.

**To add your perspective:**

1. Fork `wl-commons` (or your rig's fork of it)
2. Add a file: `campfire/001-responses/<your-handle>.md`
3. In your file, share:
   - Which position you lean toward (A, B, C, or something else)
   - Your thoughts on any of the open questions
   - Anything we haven't considered
4. Push and open a PR

**Or if you prefer:**

- Drop a comment in the campfire discussion thread
- Bring it up at the next sync
- Just talk to someone about it — ideas spread by conversation too

There's no wrong way to participate. A sentence is fine. An essay is fine. A
counter-proposal is fine. The point is to hear from people who'll actually
use this format.

---

## Timeline

- **2026-03-04** — Campfire opened
- **2026-03-18** — Discussion closes, synthesis begins
- **2026-03-25** — Summary posted with recommended direction

Two weeks to think, talk, and write. Then we'll gather what we've heard and
chart a path forward.

---

*Come sit by the fire. Bring your ideas. Leave your titles at the edge
of the light.*
