# skills/

Distributable Claude skill packs built with gsd-skill-creator. Each skill pack in this
directory is a self-contained unit of AI capability, installable into any Claude Code
project via `sc install` or by copying into `.claude/skills/`.

## This directory vs .claude/skills/

| Location | Purpose | Scope |
|----------|---------|-------|
| `skills/` | Published skill packs -- distributable, installable by users | Domain knowledge, workflows, tooling guides |
| `.claude/skills/` | Project-local auto-activating skills | This development session only; not for distribution |

Skills in `skills/` are *outputs* of the skill-creator system -- they are built here and
meant to be shared. Skills in `.claude/skills/` are *inputs* -- they guide the development
of this project itself.

## Available Skill Packs

| Pack | Description |
|------|-------------|
| `bootstrap-guide/` | Bootstrap environment setup guide |
| `dacp-assembler/` | DACP message assembly patterns |
| `dacp-interpreter/` | DACP message interpretation |
| `git-workflow/` | Git workflow patterns and safety |
| `gource-visualizer/` | Gource repository visualization |
| `methodology/` | Documentation and engineering methodologies |
| `mfe-domains/` | Mathematical Foundations Engine domain skills |
| `openstack/` | OpenStack operations and management |
| `physical-infrastructure/` | Physical infrastructure engineering |

## Quick Start

```bash
# Install a skill pack into your project
sc install skill gource-visualizer

# List available skill packs
sc skill list
```

## Navigation

- [Root README](../README.md)
- [Documentation](../docs/)
