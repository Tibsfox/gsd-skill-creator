---
title: "Getting Started"
layer: framework
path: "framework/getting-started.md"
summary: "Quick path from installation to creating your first skill, agent, and team with GSD Skill Creator."
cross_references:
  - path: "framework/index.md"
    relationship: "builds-on"
    description: "Part of framework layer"
  - path: "framework/core-concepts.md"
    relationship: "parallel"
    description: "Conceptual foundation for the features used here"
  - path: "framework/features.md"
    relationship: "parallel"
    description: "Full feature inventory beyond the basics covered here"
  - path: "framework/architecture/index.md"
    relationship: "parallel"
    description: "System architecture for deeper understanding"
reading_levels:
  glance: "Quick path from installation to creating your first skill, agent, and team with GSD Skill Creator."
  scan:
    - "Prerequisites: Node.js 18+, npm 8+, Git"
    - "Install: clone, build, link in 3 commands"
    - "First skill: create, validate, test in 5 minutes"
    - "First agent: compose skills into a role-based actor"
    - "First team: coordinate agents with a topology"
created_by_phase: "v1.34-329"
last_verified: "2026-02-25"
---

# Getting Started

GSD Skill Creator helps you build a personalized knowledge base for Claude Code. It observes
your usage patterns, suggests skills when workflows repeat, and manages skills throughout their
lifecycle. This guide takes you from installation to a working skill in about five minutes, then
shows you how skills compose into agents and teams.

If you want to understand the concepts before building, read
[Core Concepts](framework/core-concepts.md) first. If you prefer to learn by doing, start here
and the concepts will become clear through practice.


## Prerequisites

Before installing skill-creator, verify that your system has the required software.

| Software | Minimum Version | Check Command      |
|----------|----------------|--------------------|
| Node.js  | 18.x           | `node --version`   |
| npm      | 8.x            | `npm --version`    |
| Git      | Any recent     | `git --version`    |

Run all three checks before proceeding. If any version is below the minimum, update it first.
The framework uses ES modules and modern TypeScript features that require Node.js 18 or later.

```bash
node --version   # Expected: v18.0.0 or higher
npm --version    # Expected: 8.0.0 or higher
git --version    # Expected: git version 2.x.x
```


## Installation

Clone the repository and build the CLI.

```bash
git clone <repository-url> gsd-skill-creator
cd gsd-skill-creator
npm install && npm run build && npm link
```

After installation, verify the CLI is available by running `skill-creator --version`. You
should see the version number displayed. If the command is not found, ensure that npm's global
bin directory is on your PATH.


## Your First Skill

Skills are the atomic unit of learned behavior in skill-creator. Each skill is a markdown file
with YAML frontmatter that defines when it should activate and what knowledge it provides. You
will create one now.

### Create the Skill

Run the interactive creation wizard.

```bash
skill-creator create
```

The wizard prompts for three things. **Name** should be lowercase with hyphens, like
`my-first-skill`. **Description** should explain when the skill activates, using phrases the
model will encounter: "Use when learning about skill-creator. Activate when user mentions
tutorial, getting started, or first skill." **Content** is the knowledge or instructions the
skill will inject into Claude's context when activated.

After creation, skill-creator confirms the file location.

```text
Skill created: my-first-skill
Location: ~/.claude/skills/my-first-skill/SKILL.md
```

Verify it appears in your skill list with `skill-creator list`.

### Validate the Skill

Every skill must follow the official Claude Code format. The validator checks name format,
directory structure, metadata schema, and structural consistency.

```bash
skill-creator validate my-first-skill
```

A passing validation looks like this:

```text
Validating skill: my-first-skill

[PASS] Name format valid
[PASS] Directory structure valid
[PASS] Metadata schema valid
[PASS] Directory/name match

Validation passed
```

If any check fails, the output explains what needs fixing.

### Test Activation

Skills activate based on context matching. The test generator creates automated test cases to
verify that your skill activates when it should and stays quiet when it should not.

```bash
skill-creator test generate my-first-skill
```

This produces positive tests (scenarios where the skill should activate) and negative tests
(scenarios where it should not). Review each generated test and approve, edit, or skip.

Then run the tests.

```bash
skill-creator test run my-first-skill
```

Results show each test case with its activation score. Accuracy above 80% indicates a
well-configured skill. If scores are lower than expected, refine the description to be more
specific about activation contexts.


## Your First Agent

When skills frequently activate together, they can be composed into an agent. An agent bundles
related expertise into a role-based actor with its own identity, model preference, and tool
permissions.

You can wait for skill-creator to detect co-activation patterns automatically (it suggests
composition after five or more co-activations over seven or more days), or you can create an
agent manually when you know which skills belong together.

Agents are stored in `.claude/agents/` and follow Claude Code's agent format. They specify
which skills to include, which model to prefer, and which tools the agent may use. The
[Agent Composition](framework/architecture/core-learning.md#agent-composition) section in the
architecture documentation explains the automatic composition process in detail.


## Your First Team

Teams coordinate multiple agents into collaborative workflows. A team defines a topology that
determines how agents communicate and share work.

Four topology patterns are available. **Leader-worker** has a coordinating agent that delegates
tasks. **Pipeline** chains agents in sequence, each processing the output of the previous one.
**Map-reduce** distributes work across parallel agents, then combines results. **Swarm** allows
agents to self-organize around tasks.

Teams are stored as YAML configurations and validated against the official format. The
[Features](framework/features.md) page lists all team capabilities, and the
[GSD Teams Guide](framework/features.md) covers when to use teams versus individual agents in
GSD workflows.


## Observing Patterns

Once skill-creator is installed, it begins observing your Claude Code sessions. Observations
are stored as compact summaries in `.planning/patterns/sessions.jsonl`, not full transcripts.
The observation system is bounded: configurable retention defaults to 90 days or 1000 sessions,
whichever comes first.

When a pattern appears three or more times, skill-creator creates a candidate. Run
`skill-creator suggest` to review candidates and decide whether to create, defer, or dismiss
each one. All suggestions require your explicit confirmation. The system never auto-applies
skills.


## Configuring the Integration

The integration between skill-creator and GSD is controlled by a JSON configuration file that
supports per-feature toggles. Run `skill-creator config validate` to check your current
configuration. The configuration uses Zod validation, so errors are specific and actionable.

Key configuration options include the token budget (2-5% of context window), observation
retention limits, and per-agent budget profiles. See the
[Architecture Overview](framework/architecture/index.md) for how these settings shape the
loading pipeline.


## Next Steps

After completing this guide, explore the framework in more depth.

**Understand the model.** [Core Concepts](framework/core-concepts.md) explains skills, agents,
teams, and patterns as interconnected abstractions, giving you the vocabulary to reason about
the system.

**See what it can do.** [Features and Capabilities](framework/features.md) provides a complete
inventory of framework capabilities organized by domain, from pattern discovery through
security hardening.

**Learn how it works.** [Architecture Overview](framework/architecture/index.md) shows how the
components connect and how data flows from observation through pattern detection to skill
generation.

**See it in action.** The [Applications](applications/index.md) layer documents real-world
projects built with the framework, including the
[Power Efficiency Rankings](applications/power-efficiency.md) and the
[OpenStack Cloud Platform](applications/case-studies/openstack-cloud.md).
