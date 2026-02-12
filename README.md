# Dynamic Skill Creator

A self-evolving skill ecosystem for Claude Code that observes usage patterns, suggests skill creation, and composes related skills into purpose-built agents.

Built with [GSD (Get Shit Done)](https://github.com/gsd-build) from TACHES

```
npx get-shit-done-cc@latest
```

## Table of Contents

- [Elevator Pitch](#elevator-pitch)
- [Quick Start](#quick-start)
- [Documentation](#documentation)
- [Security](#security)
- [License](#license)
- [Contributing](#contributing)

---

## Elevator Pitch

Claude Code is powerful out of the box, but it forgets everything between sessions. Dynamic Skill Creator fixes that. It watches how you work, detects recurring patterns, and turns them into reusable skills that load automatically. Skills refine themselves from your corrections, compose into agents when they cluster, and export to any AI coding tool. The result: Claude gets smarter the more you use it, without you doing anything.

**40 capabilities** across 14 milestones -- from pattern observation to agent teams, MCP distribution, security hardening, and GSD integration. ~130k LOC TypeScript, 317 requirements shipped.

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
| [Requirements](docs/REQUIREMENTS.md) | All 317 implemented requirements |
| [GSD Teams Guide](docs/GSD-TEAMS.md) | Teams vs subagents for GSD workflows |
| [Comparison](docs/COMPARISON.md) | Skills vs Agents vs Teams |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and solutions |
| [Examples](examples/) | 34 ready-to-use skills, agents, and teams |

---

## Security

See [SECURITY.md](SECURITY.md) for vulnerability reporting, threat model, and security boundaries.

---

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit a pull request

All contributions should include tests and pass the existing test suite.
