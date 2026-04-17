# Retrospective — v1.41

## What Worked

- **Dismantling the 417-line monolithic CLAUDE.md into 4 skills + 3 agents + hooks.** Each concern moved to the right architectural mechanism: skills for contextual intelligence, hooks for deterministic enforcement, subagents for scoped expertise. The 46-line replacement is universally read because it's short enough to matter.
- **The architecture table tells the whole story.** The before/after comparison (GSD routing: prose in CLAUDE.md -> gsd-workflow skill; commit conventions: prose -> PreToolUse hook; etc.) makes the refactoring rationale obvious. Every row is a concern that moved from "ignored prose" to "active mechanism."
- **Net deletion (2,853 deletions vs. 5,460 insertions across 84 files).** This is a restructuring release, not a feature release. The deletions represent prose that was being ignored; the insertions represent mechanisms that are enforced.

## What Could Be Better

- **No test count reported.** This is the only release in the v1.33-v1.41 range without a test count. Skills, hooks, and agent definitions should have validation tests, even if they're structural rather than functional.

## Lessons Learned

1. **A monolithic CLAUDE.md that grows past ~50 lines stops being read.** The 417-line version was functionally ignored. The 46-line replacement works because Claude Code actually reads it every session. The threshold between "useful context" and "ignored wall of text" is real and lower than expected.
2. **Skills, hooks, and subagents are three distinct enforcement mechanisms.** Skills activate contextually (session awareness, security hygiene). Hooks fire deterministically on tool use (commit validation, phase transitions). Subagents operate with scoped permissions (executor, verifier, planner). Mapping each concern to the right mechanism is the architecture decision.
3. **install.cjs as a deployment mechanism for skills/hooks/agents makes the configuration reproducible.** Without it, the .claude/ directory would drift between machines. The install script is the source of truth for what Claude Code loads.
