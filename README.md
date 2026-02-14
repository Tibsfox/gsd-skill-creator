# GSD Skill Creator

An adaptive learning and coprocessor architecture for [Claude Code](https://docs.anthropic.com/en/docs/build-with-claude/claude-code), built as an extension to [GSD (Get Shit Done)](https://github.com/gsd-build).

```
npx get-shit-done-cc@latest
```

## Table of Contents

- [The Problem: Why AI-Assisted Development Breaks Down](#the-problem-why-ai-assisted-development-breaks-down)
- [How GSD and Skill Creator Solve It Together](#how-gsd-and-skill-creator-solve-it-together)
- [The Coprocessor Architecture](#the-coprocessor-architecture)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Security](#security)
- [License](#license)
- [Contributing](#contributing)

---

## The Problem: Why AI-Assisted Development Breaks Down

AI coding assistants are powerful in short bursts, but they degrade on sustained, complex work. The core issues:

- **Context rot** -- As a session fills its context window, the AI loses track of earlier decisions, repeats mistakes, and produces lower-quality output. By the time you're deep into implementation, the assistant has forgotten why you made the architectural choices it's now contradicting.
- **Amnesia between sessions** -- Every new session starts from zero. The AI doesn't know what worked last time, what patterns you prefer, or what it should avoid. You re-explain the same things across every conversation.
- **No workflow memory** -- Recurring sequences (test, fix, commit, verify) are executed ad-hoc every time. The AI never learns that "after a test failure, you always check the fixture data first" or that "deploy means these seven steps in this order."
- **Scaling complexity** -- A single AI session can handle a function or a file. It cannot reliably coordinate a multi-phase feature across dozens of files without losing coherence, skipping steps, or drifting from the plan.

These aren't limitations of the models themselves. They're limitations of how work is structured around them.

---

## How GSD and Skill Creator Solve It Together

**GSD** is the workflow engine. It solves context rot and scaling complexity by structuring work into phases with atomic execution boundaries. Each phase gets a fresh context window, a detailed plan, and persistent state tracking. The AI executes one well-scoped unit of work at a time, commits atomically, and hands off cleanly to the next phase. Context never rots because it never accumulates beyond what's needed for the current task.

**Skill Creator** is the learning layer that extends GSD. It doesn't replace any GSD functionality -- it observes how you work within the GSD lifecycle and builds reusable knowledge from your patterns:

- **Observe** -- Watches tool sequences, file patterns, corrections, and phase outcomes across sessions
- **Detect** -- Identifies recurring workflows using n-gram extraction and DBSCAN clustering when patterns repeat 3+ times
- **Suggest** -- Proposes skill creation from detected patterns, always requiring explicit user confirmation
- **Apply** -- Loads relevant skills automatically based on context, respecting a 2-5% token budget
- **Learn** -- Refines skills from your corrections with bounded guardrails (minimum 3 corrections, 7-day cooldown, maximum 20% change per refinement)
- **Compose** -- When skills consistently co-activate (5+ times over 7+ days), composes them into purpose-built agents and multi-agent teams

The two systems working together solve a fundamentally different problem than either one alone. GSD prevents the AI from degrading during work. Skill Creator prevents the AI from forgetting between work. The result is an AI development environment that maintains quality over long projects and gets meaningfully better the more you use it.

### What They Solve Together

| Problem | GSD's Role | Skill Creator's Role |
|---------|-----------|---------------------|
| Context rot | Fresh context per phase, atomic execution | Pre-compiled skill activation eliminates re-explanation |
| Lost decisions | Persistent `.planning/` state artifacts | Session observations capture decision patterns |
| Repeated mistakes | Plan verification against requirements | Bounded learning from corrections refines behavior |
| Scaling complexity | Phase decomposition with dependency graphs | Agent teams coordinate specialized roles |
| Workflow amnesia | Structured lifecycle (plan/execute/verify) | Pattern discovery codifies recurring sequences |
| Cross-session continuity | STATE.md tracks position and blockers | Warm-start briefings restore learned context |

---

## The Coprocessor Architecture

Complex agent systems face the same coordination challenges that early computer designers solved decades ago: multiple specialized processors need to share resources, communicate efficiently, and synchronize their work without a single bottleneck controlling everything.

Skill Creator's agent architecture (v1.13) is modeled after the Amiga's custom chipset -- a system where dedicated coprocessors handled graphics, sound, and I/O in parallel while a lightweight kernel coordinated scheduling and resource allocation. This isn't an analogy for presentation purposes; it's the actual architectural pattern used to coordinate multi-agent teams.

### The Chipset Model

Just as the Amiga distributed work across specialized chips rather than routing everything through the CPU, Skill Creator distributes agent responsibilities across four domain-specific chips:

| Chip | Domain | Real Computer Analog |
|------|--------|---------------------|
| **Agnus** | Context management -- memory allocation, context window budgets, state tracking | Memory controller |
| **Denise** | Output generation -- code production, documentation, rendering | Graphics processor |
| **Paula** | I/O operations -- file access, API calls, external tool integration | I/O controller |
| **Gary** | Glue logic -- routing, lifecycle coordination, inter-chip communication | Bus controller |

Each chip has dedicated budget channels (token budgets with guaranteed minimums), message ports (FIFO queues with reply-based ownership), and a 32-bit signal system for lightweight wake/sleep coordination -- the same primitives that real hardware uses for inter-processor communication.

### Pipeline Lists: Declarative Workflow Programs

Pipeline Lists are declarative workflow programs -- sequences of WAIT, MOVE, and SKIP instructions synchronized to GSD lifecycle events. Inspired by the Amiga's Copper coprocessor (which executed display lists synced to the video beam), Pipeline Lists bring the same concept to workflow automation:

```yaml
# A Pipeline List synchronized to GSD lifecycle events
- wait: phase-planned        # Block until planning completes
- move:
    target: skill
    name: test-generator
    mode: sprite              # Lightweight activation (~200 tokens)
- wait: tests-passing        # Block until tests pass
- skip:
    condition: "!exists:.planning/phases/*/SUMMARY.md"
- move:
    target: script
    name: generate-docs
    mode: offload             # Execute outside context window
```

Pipeline Lists **pre-compile during planning** and **execute automatically during phase transitions**. The AI doesn't decide what skills to load at runtime -- the workflow program has already determined the optimal activation sequence based on observed patterns. This eliminates the overhead of skill selection from the critical path.

### The Offload Engine: Bulk Operations Outside the Context Window

The Offload engine handles deterministic operations that don't need AI reasoning -- running test suites, generating boilerplate, formatting code, computing metrics. These operations are "promoted" from skill metadata to standalone scripts and executed as child processes, freeing the context window for work that actually requires intelligence.

### The Exec Kernel

A prioritized round-robin scheduler coordinates the chips, managing 18 typed message protocols for inter-team communication and per-team token budgets with burst mode for temporary overallocation. Teams at different priority levels (phase-critical at 60%, workflow at 15%, background at 10%, pattern detection at 10%) share resources without starvation.

### Why This Matters

The chipset architecture means that building a complex agent system -- one with specialized roles, coordinated communication, resource budgets, and synchronized execution -- uses the same proven patterns that make high-performance computers work. You don't architect message passing from scratch. You define chips, wire up ports, write Pipeline Lists, and the kernel handles scheduling. The system learns which Pipeline Lists work well from execution feedback, refining activation sequences over time.

Skills, agents, and teams generated by Skill Creator follow the official [Claude Code](https://docs.anthropic.com/en/docs/build-with-claude/claude-code) and [Agent Skills](https://agentskills.io) specifications. They work natively in Claude Code and export to OpenAI Codex CLI, Cursor, GitHub Copilot, and Gemini CLI.

---

## Quick Start

```bash
# Clone and install
git clone <repository-url>
cd gsd-skill-creator
npm install && npm run build

# Link globally (optional)
npm link

# Verify
skill-creator help

# Create your first skill
skill-creator create

# See what patterns have been detected
skill-creator suggest

# Check active skills and token budget
skill-creator status
```

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

---

## Documentation

All documentation lives in [`docs/`](docs/).

| Document | Description |
|----------|-------------|
| [Getting Started](docs/GETTING-STARTED.md) | Installation, quickstart, and tutorials |
| [Features](docs/FEATURES.md) | Full capability table and version history |
| [Core Concepts](docs/CORE-CONCEPTS.md) | Skills, scopes, observations, and agents |
| [How It Works](docs/HOW-IT-WORKS.md) | The 6-step observe-detect-suggest-apply-learn-compose loop |
| [CLI Reference](docs/CLI.md) | Complete command documentation |
| [API Reference](docs/API.md) | Programmatic usage for library consumers |
| [Skill Format](docs/SKILL-FORMAT.md) | Frontmatter fields, descriptions, official vs extension |
| [Official Format](docs/OFFICIAL-FORMAT.md) | Claude Code official skill/agent specification |
| [Token Budget](docs/TOKEN-BUDGET.md) | Budget management and priority tiers |
| [Bounded Learning](docs/BOUNDED-LEARNING.md) | Refinement guardrails and drift tracking |
| [Agent Generation](docs/AGENT-GENERATION.md) | Auto-composed agents from skill clusters |
| [Agent Teams](docs/AGENT-TEAMS.md) | Multi-agent coordination and topologies |
| [Pattern Discovery](docs/PATTERN-DISCOVERY.md) | Session log scanning and DBSCAN clustering |
| [GSD Orchestrator](docs/GSD_Orchestrator_Guide.md) | Intent classification and lifecycle routing |
| [Workflows & Roles](docs/WORKFLOWS.md) | Skill workflows, roles, bundles, and events |
| [Configuration](docs/CONFIGURATION.md) | Thresholds, retention, and cluster settings |
| [File Structure](docs/FILE-STRUCTURE.md) | Project and source code layout |
| [Development](docs/DEVELOPMENT.md) | Building, testing, and contributing |
| [Requirements](docs/REQUIREMENTS.md) | All shipped requirements across 17 milestones |
| [GSD Teams Guide](docs/GSD-TEAMS.md) | Teams vs subagents for GSD workflows |
| [Comparison](docs/COMPARISON.md) | Skills vs Agents vs Teams |
| [Release History](docs/RELEASE-HISTORY.md) | Detailed release notes for all 17 milestones |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Examples](examples/) | 34 ready-to-use skills, agents, and teams |

---

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting, threat model, and security boundaries.

---

## Project Stats

17 milestones shipped (v1.0-v1.13) | 114 phases | 335 plans | ~150k+ LOC TypeScript & Bash | 356 requirements

---

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

All contributions should include tests and pass the existing test suite.
