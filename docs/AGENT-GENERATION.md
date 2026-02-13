# Agent Generation

> [!NOTE]
> For the complete official Claude Code agent format specification, see [OFFICIAL-FORMAT.md](OFFICIAL-FORMAT.md).

Generated agents follow Claude Code's `.claude/agents/` format:

```markdown
---
name: react-fullstack-agent
description: Combines expertise from: react-hooks, react-components, api-patterns. Auto-generated from skill cluster.
tools: Read, Write, Edit, Bash, Glob, Grep
model: inherit
skills:
  - react-hooks
  - react-components
  - api-patterns
---

You are a specialized agent combining expertise from the following skills:
- **react-hooks**: React hook patterns and best practices
- **react-components**: Component design patterns
- **api-patterns**: API integration patterns
```

## Agent Frontmatter

All agent frontmatter fields follow the official Claude Code specification:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Agent identifier (required) |
| `description` | string | What the agent does (required) |
| `tools` | string | **Comma-separated string** of allowed tools (NOT an array) |
| `model` | string | Model to use (`inherit`, `sonnet`, `opus`, `haiku`) |
| `skills` | string[] | Skills to preload |

> [!WARNING]
> The `tools` field must be a comma-separated string (e.g., `tools: Read, Write, Bash`), not a YAML array. This is the most common agent format mistake.

## Format Compliance

Generated agents follow the official Claude Code agent format:

- **name**: lowercase letters, numbers, and hyphens only
- **description**: explains when Claude should delegate to this agent
- **tools**: comma-separated string (e.g., `tools: Read, Write, Bash`)
- **model**: optional model alias (sonnet, opus, haiku, inherit)

Run `skill-creator agents validate` to check all agents for format issues.
Run `skill-creator migrate-agent` to fix agents with legacy format (array tools).

## Known Issues

**User-Level Agent Discovery (GitHub #11205)**

There is a known bug where agents in `~/.claude/agents/` may not be automatically discovered by Claude Code at session startup.

**Workarounds:**
1. Use project-level agents (`.claude/agents/`) instead
2. Use the `/agents` UI command within Claude Code
3. Pass agents via `--agents` CLI flag when starting Claude Code

This tool will warn you when creating user-level agents about this issue.
