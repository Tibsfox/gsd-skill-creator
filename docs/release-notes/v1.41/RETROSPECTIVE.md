# v1.41 Retrospective — Claude Code Integration Reliability

## What Was Built

Architectural migration from monolithic CLAUDE.md (417 lines) to distributed skill/hook/agent architecture (46-line CLAUDE.md + 4 skills + 3 agents + hooks). Applied Anthropic's own design philosophy: skills for contextual behavior, hooks for deterministic enforcement.

## What Worked

- **Right mechanism for each concern**: Skills auto-activate contextually, hooks execute deterministically — no LLM judgment required for enforcement
- **Progressive disclosure**: Reference files keep SKILL.md bodies compact while preserving depth
- **Install script pattern**: Single `node install.cjs` deploys entire integration layer

## What Was Challenging

- **Content migration decisions**: Determining which CLAUDE.md content was "universally relevant" vs "contextually relevant" required careful analysis
- **Skill description tuning**: Getting auto-activation triggers right — too narrow and skills don't fire, too broad and they fire on everything
- **Net deletions**: One of few milestones with significant deletions (2,853 lines removed from CLAUDE.md)

## Patterns Established

- Slim CLAUDE.md pattern: WHAT not HOW, every line applies to every task
- Skill reference architecture: SKILL.md + references/ subdirectory for depth
- Subagent scoping: Agents get only the tools they need

## Key Lessons

1. A 417-line CLAUDE.md wrapped in "may or may not be relevant" gets ignored — smaller is better
2. Hooks are the only reliable enforcement mechanism — they execute without LLM judgment
3. Skill descriptions should be "a little bit pushy" to combat undertriggering
