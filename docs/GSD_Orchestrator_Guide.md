# GSD Orchestrator

## Master Agent Routing for get-shit-done Workflows

*Part of [gsd-skill-creator](https://github.com/Tibsfox/gsd-skill-creator) by Tibsfox*

---

## What Is It?

The GSD Orchestrator is a master coordination layer introduced in gsd-skill-creator v1.7 that sits between the user and the full GSD command ecosystem. Instead of requiring users to memorize which `/gsd:` command to run at any given point in their project, the Orchestrator classifies what the user wants to do and routes them to the right GSD command automatically.

It solves a real usability problem: GSD is powerful, but it has a lot of commands. A developer in the middle of a milestone might not remember whether they need `/gsd:discuss-phase`, `/gsd:plan-phase`, or `/gsd:execute-phase` next. The Orchestrator figures that out by examining the current project state and matching the user's intent to the correct workflow step.

---

## Core Capabilities

### Dynamic Discovery

The Orchestrator scans your environment to build a live inventory of everything available to it. This includes installed GSD commands (the `/gsd:` slash commands), agents (the specialized `.md` agent definitions in `.claude/agents/`), teams (multi-agent configurations in `.claude/teams/`), and skills. Rather than maintaining a hardcoded list, discovery runs against the actual filesystem, so it adapts to whichever version of GSD you have installed and whatever custom agents or teams you've created.

```bash
# See everything the Orchestrator can route to
skill-creator orchestrator discover
```

This returns a structured inventory: which GSD commands are available, which agents can be spawned, which teams are configured, and what skills are loaded. It's the Orchestrator's map of the territory.

### Intent Classification

When a user describes what they want to do in natural language, the Orchestrator classifies that intent and maps it to a specific GSD command. The classification engine uses keyword matching, context analysis, and project state awareness to determine the best match.

```bash
# Classify a natural language request
skill-creator orchestrator classify "plan the next phase"
# → Routes to /gsd:plan-phase with the current phase number

skill-creator orchestrator classify "I need to debug the auth flow"
# → Routes to /gsd:debug

skill-creator orchestrator classify "let's discuss what to build next"
# → Routes to /gsd:discuss-phase

skill-creator orchestrator classify "ship it"
# → Routes to /gsd:complete-milestone (if all phases verified)
```

The classifier doesn't just match keywords — it considers where you are in the GSD lifecycle. If you say "let's plan" but haven't run discuss-phase yet for the current phase, it can flag that the discuss step should come first.

### Lifecycle State Awareness

The Orchestrator reads your `.planning/` directory to understand exactly where your project stands in the GSD lifecycle. It knows which milestone you're on, which phases have been discussed, planned, executed, and verified, and which phase is next.

```bash
# See current project lifecycle position
skill-creator orchestrator state
```

This outputs a structured view of your project state: current milestone number, phase completion status, which GSD documents exist (PROJECT.md, REQUIREMENTS.md, ROADMAP.md, etc.), and what the logical next step should be.

You can point it at a specific planning directory if yours isn't in the default location:

```bash
skill-creator orchestrator state --planning-dir .planning
```

### Lifecycle Suggestions

Based on the current project state, the Orchestrator suggests what you should do next. This is the "what now?" command — it examines what's been completed and what's outstanding, then recommends the next logical GSD command to run.

```bash
# Get suggested next actions
skill-creator orchestrator lifecycle
```

If you've just finished executing phase 3 but haven't verified it yet, the Orchestrator will suggest `/gsd:verify-work 3`. If all phases in a milestone are verified, it'll suggest `/gsd:complete-milestone`. If you're starting fresh, it'll point you to `/gsd:new-project` or `/gsd:discuss-phase 1`.

---

## How It Fits Into the GSD Workflow

To understand the Orchestrator's role, it helps to understand GSD's architecture. Every GSD command follows a **thin orchestrator pattern**: a lightweight command file spawns specialized agents, waits for results, and routes to the next step. The command never does heavy lifting itself — the agents do the work in fresh context windows.

The gsd-skill-creator's Orchestrator operates one level above this. It's not replacing GSD's internal orchestration — it's helping the user navigate to the right GSD command in the first place.

```
User Intent
    │
    ▼
┌─────────────────────────┐
│   GSD Orchestrator       │  ← gsd-skill-creator v1.7
│   (Intent → Command)     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────┐
│   GSD Command            │  ← e.g., /gsd:plan-phase 2
│   (Thin Orchestrator)    │
└────────────┬────────────┘
             │
    ┌────────┼────────┐
    ▼        ▼        ▼
┌───────┐┌───────┐┌───────┐
│Agent 1││Agent 2││Agent 3│  ← Researcher, Planner, Checker
└───────┘└───────┘└───────┘
```

The Orchestrator adds a user-friendly routing layer without changing how GSD's internal multi-agent system works.

---

## Verbosity and Human-in-the-Loop Gates

The Orchestrator supports configurable verbosity levels that control how much it explains before routing:

- **Minimal** — Routes silently, just executes the matched command.
- **Standard** — Shows the classified intent and target command, asks for confirmation before executing.
- **Verbose** — Explains why it chose the command, shows alternative options, and details the current lifecycle state before asking for confirmation.

The human-in-the-loop (HITL) gates ensure the Orchestrator never runs a destructive or irreversible GSD command without confirmation. Commands like `/gsd:complete-milestone` (which archives and tags a release) always require explicit user approval regardless of verbosity setting.

---

## Work State and Session Continuity

The Orchestrator integrates with the work state persistence system (also introduced in v1.7) to maintain continuity across Claude Code sessions. When a session ends mid-workflow, the Orchestrator can save the current state — what task you were working on, which skills were active, and where you left off.

```bash
# Save current work state before ending a session
skill-creator work-state save --task "implementing auth" --skills "typescript-patterns"

# In a new session, restore where you left off
skill-creator work-state load

# Generate a context snapshot for handoff
skill-creator snapshot generate
skill-creator snapshot latest --format=context
```

When you start a new Claude Code session and ask the Orchestrator what to do next, it factors in the saved work state alongside the `.planning/` directory state. If you were mid-execution on phase 2, it knows to suggest continuing execution rather than starting over.

The snapshot system creates compact context summaries that can be loaded into a new session, giving the fresh context window enough history to continue without re-reading entire project documents.

---

## Practical Usage Patterns

### Starting a New Project

```bash
# Orchestrator discovers GSD is installed but no .planning/ exists
skill-creator orchestrator lifecycle
# → Suggests: /gsd:new-project (no project initialized)

# Or just describe what you want
skill-creator orchestrator classify "I want to start a new app"
# → Routes to /gsd:new-project
```

### Mid-Milestone Navigation

```bash
# Check where you are
skill-creator orchestrator state
# → Milestone 1, Phase 3: discussed ✓, planned ✓, executed ✗, verified ✗

# Ask what's next
skill-creator orchestrator lifecycle
# → Suggests: /gsd:execute-phase 3

# Or describe your intent
skill-creator orchestrator classify "run the implementation"
# → Routes to /gsd:execute-phase 3
```

### Resuming After a Break

```bash
# Load saved work state
skill-creator work-state load
# → Restores: task="implementing auth", phase=2, last_command=execute-phase

# Check lifecycle with restored context
skill-creator orchestrator lifecycle
# → Suggests: Continue /gsd:execute-phase 2 (work state: implementing auth)
```

### Adding Unplanned Work

```bash
skill-creator orchestrator classify "we need to add a hotfix for the login bug"
# → Routes to /gsd:insert-phase or /gsd:quick depending on severity

skill-creator orchestrator classify "add dark mode to the roadmap"
# → Routes to /gsd:add-phase
```

---

## Integration with Other v1.7+ Features

The Orchestrator doesn't operate in isolation. It's wired into the other systems introduced alongside it:

**Skill Workflows** — When the Orchestrator routes to a GSD command, it can trigger associated skill workflows. For example, routing to `/gsd:plan-phase` might automatically activate a `pre-planning` workflow that runs lint checks or loads relevant skill bundles.

**Skill Roles** — The Orchestrator respects role constraints when suggesting actions. If the current role is `reviewer` (read-only, no code modifications), it won't route to `/gsd:execute-phase`.

**Work Bundles** — When a bundle is active (e.g., a "frontend" bundle with TypeScript and React skills), the Orchestrator factors that into its suggestions. It knows the active work context and tailors lifecycle recommendations accordingly.

**Inter-Skill Events** — Completing a GSD command can emit events that trigger downstream skill activations. The Orchestrator coordinates these event chains as part of its routing logic.

---

## CLI Reference

| Command | Alias | Description |
|---|---|---|
| `orchestrator discover` | `orch disc` | Discover all installed GSD commands, agents, and teams |
| `orchestrator classify <input>` | `orch cls` | Classify natural language intent to a GSD command |
| `orchestrator state` | `orch st` | Show current project lifecycle position |
| `orchestrator lifecycle` | `orch lc` | Show suggested next actions based on project state |

### Options

| Option | Applies To | Description |
|---|---|---|
| `--planning-dir <path>` | `state` | Specify custom planning directory (default: `.planning`) |
| `--verbose` | `classify` | Show detailed classification reasoning |
| `--dry-run` | `classify` | Show what would be routed without executing |

---

## Why It Matters

For simple projects with a few phases, navigating GSD commands manually is straightforward. But as projects grow — multiple milestones, inserted hotfix phases, parallel workstreams, resumed sessions — the cognitive overhead of remembering where you are and what command to run next adds up. The Orchestrator eliminates that overhead by making GSD self-navigating.

Combined with work state persistence and session snapshots, it also solves the "fresh context" problem across sessions. You close your laptop, come back tomorrow, and the Orchestrator can reconstruct where you were and what to do next — without you re-reading STATE.md or manually checking which phases are complete.

It turns GSD from a powerful-but-manual framework into something that guides you through the workflow as naturally as the workflow itself.

---

*For more information: [gsd-skill-creator documentation](https://github.com/Tibsfox/gsd-skill-creator/tree/main/docs) | [GSD (get-shit-done)](https://github.com/glittercowboy/get-shit-done)*
