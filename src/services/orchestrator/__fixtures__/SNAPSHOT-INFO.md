# Fixture Snapshot Info

**Source:** GSD v1.15.0 installation at `~/.claude/`
**Snapshot date:** 2026-02-08
**Created by:** Phase 44, Plan 02

## Contents

| Category | Count | Source Location |
|----------|-------|-----------------|
| Commands | 27 | `commands/gsd/*.md` |
| Agents | 4 (subset) | `agents/gsd-*.md` |
| Teams | 1 (subset) | `teams/gsd-research-team/` |
| Planning state | 3 files | `planning/` |

## Fixture Format

Fixtures are **minimal representations**, not full command/agent files:

- **Commands:** Frontmatter (name, description, argument-hint if present, agent if present) + first `<objective>` sentence only. No `<process>`, `<context>`, or body content.
- **Agents:** Frontmatter (name, description, tools, color) + one-line body. No `<role>` or behavior content.
- **Teams:** Full `config.json` structure with minimal member list.
- **Planning:** Representative ROADMAP.md, STATE.md, and config.json for state reader testing.

## Purpose

These fixtures enable CI-safe testing of GsdDiscoveryService and related orchestrator modules without requiring a live GSD installation. Tests reference these static snapshots instead of creating temporary directories with inline fixture strings.

## Updating

To update fixtures for a new GSD version:
1. Create a new `gsd-vX.YZ/` directory
2. Extract frontmatter + objective from each command/agent file
3. Update the fixture-loader default version
4. Run fixture integrity tests to validate
