---
title: "Skill Creator"
description: "An adaptive learning system for Claude Code that captures, refines, and composes reusable skills from observed patterns"
template: page
schema_type: TechArticle
tags:
  - skill-creator
  - claude-code
  - ai
  - tooling
nav_section: skills
nav_order: 0
agent_visible: true
agent_priority: high
---

# Skill Creator

Skill Creator is an adaptive learning layer for Claude Code. It observes how you work, detects repeating patterns, and captures them as reusable skills that improve future sessions.

## How It Works

The system operates on a simple feedback loop: observe, detect, propose, refine.

### Observation

Every time you work with Claude Code, the system records lightweight observations about tool sequences, file patterns, and corrections you make. These observations are stored locally in `.planning/patterns/sessions.jsonl` and never leave your machine.

```jsonl
{"ts":"2026-01-15T10:30:00Z","type":"correction","before":"git add .","after":"git add src/specific-file.ts","context":"staging"}
{"ts":"2026-01-15T10:31:00Z","type":"sequence","tools":["read","edit","test","commit"],"context":"tdd-cycle"}
```

### Detection

A pattern detection pipeline analyzes accumulated observations looking for repetition. It uses frequency analysis, co-activation tracking, and semantic clustering to identify behaviors that recur across sessions.

The key threshold is **three occurrences**. A pattern seen once is an accident. Seen twice is a coincidence. Seen three times, it's a candidate for codification.

### Proposal

When a pattern crosses the threshold, it's proposed as a skill suggestion rather than automatically applied. You see a brief notification at the start of your next session:

```
skill-creator detected a repeating pattern: TDD commit cycle
  (test → implement → refactor, 5 occurrences over 12 days).
Run `skill-creator suggest` to review.
```

This is a core safety principle: **the system never auto-applies learned behaviors**. Every skill requires explicit human confirmation before it becomes active.

### Refinement

Active skills aren't static. As you continue working, the system tracks whether a skill's guidance is being followed or overridden. After three consistent overrides, it proposes a refinement -- a bounded update to the skill's rules, limited to 20% content change per iteration with a 7-day cooldown.

## Architecture

Skill Creator is built on several key modules:

- **Pattern Observer** -- Records session observations to JSONL
- **Activation Simulator** -- Tests pattern triggers against historical data
- **Skill Generator** -- Creates skill markdown files from detected patterns
- **Refinement Engine** -- Proposes bounded updates to existing skills
- **Budget Manager** -- Ensures skills stay within 2-5% of context window
- **Agent Composer** -- Detects co-activation patterns and composes multi-skill agents

### Skill Format

Skills are stored as markdown files in `.claude/commands/` (project-level) or `~/.claude/commands/` (user-level). Each skill file contains:

```markdown
# Skill: TDD Commit Cycle

## Trigger
When working in TDD mode (test files being created/modified)

## Rules
1. Commit failing tests separately from implementation
2. Use `test(scope): description` for test-only commits
3. Use `feat(scope): description` for implementation commits
4. Run tests after each change before committing

## Context
- Detected from 5 sessions over 12 days
- Last refined: 2026-01-20
- Confidence: 0.87
```

### Loading Pipeline

Skills are loaded through a 6-stage pipeline that ensures the right skills are active at the right time:

1. **Score** -- Rank skills by relevance to current task
2. **Resolve** -- Handle conflicts between project and user-level skills
3. **ModelFilter** -- Exclude skills incompatible with current model
4. **CacheOrder** -- Optimize for context cache hits
5. **Budget** -- Enforce the 2-5% context window limit
6. **Load** -- Inject selected skills into the active context

## Integration with GSD

Skill Creator integrates with the [Get Shit Done](/skills/skill-creator/) workflow system:

- Skills are loaded before each GSD phase execution
- Phase transitions trigger skill activation checks
- Execution summaries feed the observation pipeline
- Milestone completions produce high-signal pattern data

This creates a virtuous cycle: GSD provides structure, Skill Creator provides learning, and each makes the other more effective over time.

## Getting Started

Install skill-creator as part of the GSD ecosystem:

```bash
npm install gsd-skill-creator
npx skill-creator init
```

The system begins observing immediately but won't propose any skills until it has accumulated enough data to identify genuine patterns. Your first suggestions typically appear after 5-10 working sessions.

## Privacy and Security

All observations and skills are stored locally. Nothing is transmitted to external services. The observation data in `.planning/patterns/` should be added to `.gitignore` for shared repositories to prevent cross-developer leakage. Skill files in `.claude/commands/` can be committed to share team-level patterns.
