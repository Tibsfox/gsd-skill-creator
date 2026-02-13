# Skill Format

> [!NOTE]
> For the complete official Claude Code skill format specification, see [OFFICIAL-FORMAT.md](OFFICIAL-FORMAT.md). This document covers the extended format used by gsd-skill-creator.

Skills use Markdown with YAML frontmatter:

```markdown
---
name: typescript-patterns
description: Common TypeScript patterns and best practices
triggers:
  intents:
    - "typescript"
    - "type safety"
    - "generics"
  files:
    - "*.ts"
    - "*.tsx"
    - "tsconfig.json"
  contexts:
    - "refactoring"
    - "code review"
  threshold: 0.5
enabled: true
version: 3
extends: javascript-patterns    # Optional: inherit from another skill
createdAt: "2026-01-30T10:00:00Z"
updatedAt: "2026-01-30T15:30:00Z"
---

## TypeScript Patterns

When working with TypeScript, follow these patterns:
...
```

## Frontmatter Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique skill identifier |
| `description` | string | Yes | Human-readable description |
| `triggers.intents` | string[] | No | Intent patterns that activate the skill (extension) |
| `triggers.files` | string[] | No | File glob patterns that activate the skill (extension) |
| `triggers.contexts` | string[] | No | Context keywords that activate the skill (extension) |
| `triggers.threshold` | number | No | Minimum relevance score (0-1, default 0.5) (extension) |
| `enabled` | boolean | No | Whether skill is active (default true) (extension) |
| `version` | number | Auto | Auto-incremented on updates (extension) |
| `extends` | string | No | Parent skill name to inherit from (extension) |
| `createdAt` | string | Auto | ISO timestamp of creation (extension) |
| `updatedAt` | string | Auto | ISO timestamp of last update (extension) |

*Fields marked (extension) are gsd-skill-creator additions, not part of official Claude Code format.*

## Effective Descriptions

Claude uses skill descriptions to decide when to auto-activate skills during conversations. Well-written descriptions significantly improve activation rates.

**The "Use when..." Pattern**

The most effective descriptions follow a two-part structure:
1. **Capability statement** - What the skill does
2. **Trigger conditions** - When to activate (using "Use when...")

```yaml
# Good: Clear capability and triggers
description: Guides structured git commits with conventional format. Use when committing changes, preparing commit messages, or when user asks about commit conventions.

# Bad: No trigger context
description: Guide for git commit patterns (seen 5 times).
```

**Tips for Better Activation:**

| Do | Don't |
|----|-------|
| Include "Use when..." clause | Use generic descriptions |
| Add specific keywords users mention | Include occurrence counts |
| Keep under 150 characters | Put trigger info only in skill body |
| Describe observable triggers | Use first/second person |

## Official vs Extension Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | Official | Unique identifier (required) |
| `description` | Official | What skill does (required) |
| `user-invocable` | Official | Allow /skill-name invocation |
| `disable-model-invocation` | Official | Prevent auto-activation |
| `allowed-tools` | Official | Tools Claude can use |
| `triggers` | **Extension** | gsd-skill-creator auto-activation patterns |
| `extends` | **Extension** | Skill inheritance |
| `version` | **Extension** | Auto-incremented version tracking |
| `enabled` | **Extension** | Enable/disable without deleting |
| `createdAt`, `updatedAt` | **Extension** | Timestamp tracking |

Extension fields are stored under `metadata.extensions.gsd-skill-creator` to avoid polluting the official namespace.

> [!NOTE]
> Extension fields are value-adds from gsd-skill-creator. Skills work in Claude Code even without them - they enhance the skill management experience.

See also: [EXTENSIONS.md](EXTENSIONS.md) for complete documentation of custom fields including triggers, learning, extends, and migration guides.
