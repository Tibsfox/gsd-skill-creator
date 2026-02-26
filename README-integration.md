# Integration Architecture: CLAUDE.md Reliability Migration

This document explains the architecture that replaced the monolithic 417-line CLAUDE.md with a layered system of skills, hooks, and subagents.

## Why This Migration Happened

Claude Code wraps CLAUDE.md content in a system-reminder that says "this context may or may not be relevant to your tasks." This causes Claude to selectively apply or ignore instructions -- behavioral rules like "always use Conventional Commits" or "check STATE.md on session start" get skipped when Claude judges them irrelevant to the current task.

The fix: move each concern to the mechanism that guarantees correct behavior.

- **Static project context** stays in CLAUDE.md (always loaded, always relevant)
- **Behavioral instructions** move to skills (auto-activated by description matching)
- **Deterministic rules** move to hooks (execute every time, zero exceptions)
- **Delegated work** moves to subagent definitions (scoped tools, skill references)

See `.planning/staging/inbox/v1.41-mission-docs/` for the full mission specification.

## Architecture Overview

```
+-------------------------------------------------+
| Always Loaded                                   |
|   CLAUDE.md (<80 lines)                         |
|   Static project context, tech stack, file map  |
+-------------------------------------------------+
         |
         v
+-------------------------------------------------+
| On-Demand (auto-activate by description match)  |
|   .claude/skills/gsd-workflow/                  |
|   .claude/skills/skill-integration/             |
|   .claude/skills/session-awareness/             |
|   .claude/skills/security-hygiene/              |
+-------------------------------------------------+
         |
         v
+-------------------------------------------------+
| Deterministic (execute every time)              |
|   .claude/hooks/session-state.sh     SessionStart  |
|   .claude/hooks/validate-commit.sh   PreToolUse    |
|   .claude/hooks/phase-boundary-check.sh PostToolUse|
+-------------------------------------------------+
         |
         v
+-------------------------------------------------+
| Delegated (scoped subagents)                    |
|   .claude/agents/gsd-executor.md                |
|   .claude/agents/gsd-verifier.md                |
|   .claude/agents/gsd-planner.md                 |
+-------------------------------------------------+
```

## Quick Reference -- Where Things Live

| Concern | Mechanism | File(s) |
|---|---|---|
| Project structure and stack | CLAUDE.md (always loaded) | `CLAUDE.md` |
| GSD workflow routing | Skill (auto-activates) | `.claude/skills/gsd-workflow/` |
| Skill-creator integration | Skill (auto-activates) | `.claude/skills/skill-integration/` |
| Session state awareness | Skill (auto-activates) | `.claude/skills/session-awareness/` |
| Security hygiene | Skill (auto-activates) | `.claude/skills/security-hygiene/` |
| Commit convention enforcement | Hook (deterministic) | `.claude/hooks/validate-commit.sh` |
| Session start context | Hook (deterministic) | `.claude/hooks/session-state.sh` |
| Phase boundary detection | Hook (deterministic) | `.claude/hooks/phase-boundary-check.sh` |
| Phase execution | Subagent | `.claude/agents/gsd-executor.md` |
| Phase verification | Subagent (read-only) | `.claude/agents/gsd-verifier.md` |
| Phase planning | Subagent | `.claude/agents/gsd-planner.md` |

## How Skills Auto-Activate

Skills use progressive disclosure to minimize token cost:

1. **Metadata scan** -- Claude reads skill name and description from SKILL.md frontmatter
2. **Description matching** -- when the current task matches a skill's description, Claude loads the SKILL.md body
3. **Deep references** -- if more detail is needed, Claude loads files from `references/` subdirectory

No explicit invocation is needed for most workflows. When Claude sees a GSD-related prompt, the gsd-workflow skill auto-activates. When session state is relevant, session-awareness activates. This happens through Claude Code's built-in skill matching -- skills are loaded based on context, not commands.

Skills with `references/` directories (gsd-workflow, skill-integration) keep their core guidance in SKILL.md under 300 lines and put detailed lookup tables and protocol specs in reference files.

## How Hooks Work

Hooks are deterministic -- they execute at specific lifecycle points regardless of what Claude judges relevant. This is the key difference from CLAUDE.md instructions.

- **SessionStart** (`session-state.sh`): Outputs project state from STATE.md at the beginning of every session. Runs in under 1 second.
- **PreToolUse** (`validate-commit.sh`): Intercepts `git commit` Bash commands and validates the message follows Conventional Commits format. Blocks non-conforming commits with exit code 2.
- **PostToolUse** (`phase-boundary-check.sh`): Fires after any Write to `.planning/` files, reminding about phase transitions and skill triggers.

Hook configuration lives in `.claude/settings.json`. The `project-claude/settings-hooks.json` file defines the hook registrations that get merged during install.

## How to Modify

**Adding a new skill:**
1. Create a directory in `project-claude/skills/your-skill-name/`
2. Add a `SKILL.md` with frontmatter (name, description, version)
3. Optionally add a `references/` subdirectory for deep content
4. Add an entry to `manifest.json` under `files.skills`
5. Run `node project-claude/install.cjs` to deploy

**Adding a new hook:**
1. Create a shell script in `project-claude/hooks/your-hook.sh`
2. Add the hook registration to `project-claude/settings-hooks.json`
3. Add an entry to `manifest.json` under `files.hookScripts`
4. Run `node project-claude/install.cjs` to deploy
5. The script will be chmod +x automatically

**Adding a new agent:**
1. Create a markdown file in `project-claude/agents/your-agent.md`
2. Include YAML frontmatter with name, description, tools list, and optional skills
3. Add an entry to `manifest.json` under `files.standalone`
4. Run `node project-claude/install.cjs` to deploy

**Modifying CLAUDE.md:**
- Edit `project-claude/CLAUDE.md` (the source file)
- Keep it under 80 lines
- Every line must be universally applicable -- no behavioral instructions
- Run install to deploy the updated version

## Troubleshooting

**Skill not activating?**
Check the skill's description field in SKILL.md frontmatter. Claude matches tasks to skills by description. If the description does not match the task context, the skill will not load.

**Hook not firing?**
Check `.claude/settings.json` for the hook registration. Verify the matcher pattern is correct (e.g., "Bash" for PreToolUse, "Write" for PostToolUse, "" for all). Run `bash .claude/hooks/your-hook.sh` manually to check for script errors.

**Agent missing tools?**
Check the agent's YAML frontmatter `tools:` list. Only tools listed in frontmatter are available to the subagent. The verifier agent intentionally has no Write or Edit tools.

**Legacy CLAUDE.md:**
If the install script found a CLAUDE.md over 100 lines, it was backed up as `CLAUDE.md.legacy` in the project root. The original content has been distributed across skills and hooks.
