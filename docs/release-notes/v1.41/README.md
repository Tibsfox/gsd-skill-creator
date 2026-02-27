# v1.41 — Claude Code Integration Reliability

**Shipped:** 2026-02-26 | **Phases:** 4 (390-393) | **Plans:** 8 | **Commits:** 11

## Overview

Dismantled the 417-line monolithic CLAUDE.md and rebuilt its capabilities using the right architectural mechanism for each concern: skills for contextual intelligence, hooks for deterministic enforcement, subagents for scoped expertise.

## Key Changes

- **Slim CLAUDE.md**: Replaced 417-line monolithic file with 46-line universally-relevant project context
- **4 Auto-Activating Skills**: gsd-workflow (routing + phase behavior), skill-integration (loading + guardrails), session-awareness (state checking), security-hygiene (self-modifying system safety)
- **3 GSD Subagent Definitions**: executor, verifier, planner agents with scoped tool permissions
- **Install Script Update**: Updated `project-claude/install.cjs` to deploy skills, hooks, and agents
- **Reference Documents**: Command routing tables, phase behavior guides, YOLO mode rules, bounded guardrails, observation patterns

## Architecture

| Concern | Before (CLAUDE.md) | After |
|---------|-------------------|-------|
| Project context | 417 lines, ignored | 46 lines, always read |
| GSD routing | Prose in CLAUDE.md | gsd-workflow skill |
| Skill loading | Prose in CLAUDE.md | skill-integration skill |
| Session recovery | Prose in CLAUDE.md | session-awareness skill |
| Security | Prose in CLAUDE.md | security-hygiene skill |
| Commit conventions | Prose in CLAUDE.md | PreToolUse hook |
| Phase transitions | Prose in CLAUDE.md | PostToolUse hook |

## Wave Execution

| Wave | Phases | Description |
|------|--------|-------------|
| 0A | 390 | Slim CLAUDE.md + session-awareness + security-hygiene skills |
| 1A | 391 | gsd-workflow + skill-integration skills |
| 2 | 392 | Subagent definitions + install script migration |
| 3 | 393 | Integration testing + validation |

## Files Changed

84 files changed, 5,460 insertions, 2,853 deletions
