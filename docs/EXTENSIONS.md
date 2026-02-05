# gsd-skill-creator Extension Reference

This document describes extension fields added by gsd-skill-creator beyond the [official Claude Code format](./OFFICIAL-FORMAT.md). These extensions enable trigger-based activation, learning/feedback tracking, and skill inheritance.

## Table of Contents

- [Overview](#overview)
- [Extension Fields](#extension-fields)
- [Triggers](#triggers)
- [Learning](#learning)
- [Force Override Fields](#force-override-fields)
- [Storage Format](#storage-format)
- [Stability Indicators](#stability-indicators)
- [Migration Guide](#migration-guide)
- [Troubleshooting](#troubleshooting)
- [Known Issues](#known-issues)
- [Documentation Notes](#documentation-notes)

---

## Overview

Extensions are stored under `metadata.extensions.gsd-skill-creator` in skill files:

```yaml
---
name: my-skill
description: My skill description
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents: ["typescript", "react"]
      version: 1
      createdAt: "2026-01-31T12:00:00Z"
---
```

This namespaced location:
- Keeps official Claude Code fields separate from tool-specific data
- Allows multiple tools to store extensions without conflicts
- Follows Claude Code's documented extension pattern

For official Claude Code fields (`name`, `description`, `allowed-tools`, etc.), see [OFFICIAL-FORMAT.md](./OFFICIAL-FORMAT.md).

---

## Extension Fields

All extension fields managed by gsd-skill-creator:

| Field | Type | Default | Stability | Purpose |
|-------|------|---------|-----------|---------|
| `triggers` | `SkillTrigger` | `undefined` | STABLE | Auto-activation conditions |
| `learning` | `SkillLearning` | `undefined` | EXPERIMENTAL | Feedback and refinement tracking |
| `enabled` | `boolean` | `true` | STABLE | Whether skill is active |
| `version` | `number` | `undefined` | STABLE | Version number, incremented on updates |
| `extends` | `string` | `undefined` | STABLE | Parent skill name to inherit from |
| `createdAt` | `string` | `undefined` | STABLE | ISO 8601 timestamp of creation |
| `updatedAt` | `string` | `undefined` | STABLE | ISO 8601 timestamp of last update |
| `forceOverrideReservedName` | `object` | `undefined` | EXPERIMENTAL | Tracking for reserved name bypass |
| `forceOverrideBudget` | `object` | `undefined` | EXPERIMENTAL | Tracking for budget limit bypass |

---

## Triggers

The `triggers` field enables automatic skill activation based on context matching.

### Trigger Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `intents` | `string[]` | `[]` | Intent patterns for auto-activation (keywords, regex) |
| `files` | `string[]` | `[]` | File glob patterns (e.g., `"*.tsx"`, `"src/**/*.ts"`) |
| `contexts` | `string[]` | `[]` | Context keywords (e.g., `"in GSD planning phase"`) |
| `threshold` | `number` | `0.5` | Minimum relevance score (0-1) for activation |

### Trigger Example

```yaml
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - typescript
          - react component
          - frontend
        files:
          - "*.tsx"
          - "*.ts"
          - "src/components/**"
        contexts:
          - building UI
          - working on frontend
        threshold: 0.6
```

---

## Learning

The `learning` field tracks skill usage and refinement for adaptive improvement.

### Learning Fields

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `applicationCount` | `number` | `0` | Times the skill has been applied |
| `feedbackScores` | `number[]` | `[]` | User feedback scores (1-5 scale) |
| `corrections` | `SkillCorrection[]` | `[]` | Captured corrections/overrides |
| `lastRefined` | `string` | `undefined` | ISO 8601 timestamp of last refinement |

### SkillCorrection Fields

| Field | Type | Required | Purpose |
|-------|------|----------|---------|
| `timestamp` | `string` | yes | ISO 8601 timestamp of correction |
| `original` | `string` | yes | Original output that was corrected |
| `corrected` | `string` | yes | User's corrected version |
| `context` | `string` | no | Additional context about the correction |

### Learning Example

```yaml
metadata:
  extensions:
    gsd-skill-creator:
      learning:
        applicationCount: 12
        feedbackScores: [5, 4, 5, 3, 5]
        corrections:
          - timestamp: "2026-01-30T10:00:00Z"
            original: "const x = foo()"
            corrected: "const x = await foo()"
            context: "async function call"
        lastRefined: "2026-01-30T12:00:00Z"
```

---

## Force Override Fields

These fields track when users bypass safety protections.

### forceOverrideReservedName

Recorded when user creates a skill with a reserved name (e.g., `memory`, `help`).

| Field | Type | Purpose |
|-------|------|---------|
| `reservedName` | `string` | The reserved name that was used |
| `category` | `string` | Category (e.g., `built-in-commands`, `agent-types`) |
| `reason` | `string` | Why the name was reserved |
| `overrideDate` | `string` | ISO 8601 timestamp of override |

### forceOverrideBudget

Recorded when user creates/updates a skill that exceeds character budget.

| Field | Type | Purpose |
|-------|------|---------|
| `charCount` | `number` | Character count at time of override |
| `budgetLimit` | `number` | Budget limit that was exceeded |
| `usagePercent` | `number` | Usage percentage at time of override |
| `overrideDate` | `string` | ISO 8601 timestamp of override |

---

## Storage Format

### Extension Block Only

The minimal extension structure within a skill:

```yaml
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents: ["typescript"]
      version: 1
      createdAt: "2026-01-31T12:00:00Z"
```

### Full Skill File with Extensions

A complete skill file showing official fields and extensions:

```yaml
---
name: typescript-helper
description: Assists with TypeScript development. Use when working with TypeScript files or discussing type systems.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents:
          - typescript
          - type system
          - generics
        files:
          - "*.ts"
          - "*.tsx"
        threshold: 0.5
      enabled: true
      version: 2
      extends: code-helper
      createdAt: "2026-01-15T08:00:00Z"
      updatedAt: "2026-01-31T12:00:00Z"
---

# TypeScript Helper

You are a TypeScript expert. When helping with TypeScript code:

1. **Type Safety** - Prefer strict typing, avoid `any`
2. **Generics** - Use generics for reusable, type-safe code
3. **Interfaces vs Types** - Prefer interfaces for object shapes, types for unions
4. **Error Handling** - Use discriminated unions for error types

Always explain type errors clearly and suggest fixes.
```

---

## Stability Indicators

Extension fields are marked with stability indicators:

| Indicator | Meaning |
|-----------|---------|
| **STABLE** | API will not change. Safe to depend on in tooling and scripts. |
| **EXPERIMENTAL** | May change in future versions. Use with awareness that migration may be needed. |

### Stable Fields

These fields have stable APIs:
- `triggers` - Core activation feature, widely used
- `enabled` - Simple boolean toggle
- `version` - Basic version tracking
- `extends` - Skill inheritance
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

### Experimental Fields

These fields may change:
- `learning` - Feedback and refinement tracking (may evolve)
- `forceOverrideReservedName` - Override tracking structure may change
- `forceOverrideBudget` - Override tracking structure may change

---

## Migration Guide

This section documents all migration paths for deprecated patterns. Users with legacy skills should follow these guides to ensure compatibility with current versions.

### Root-Level Extension Fields (v1.0.0+)

In v1.0.0, extension fields moved from root level to `metadata.extensions.gsd-skill-creator`.

**Deprecated fields at root level:**
- `triggers` - Use `getExtension(metadata).triggers`
- `learning` - Use `getExtension(metadata).learning`
- `enabled` - Use `getExtension(metadata).enabled`
- `version` - Use `getExtension(metadata).version`
- `createdAt` - Use `getExtension(metadata).createdAt`
- `updatedAt` - Use `getExtension(metadata).updatedAt`
- `extends` - Use `getExtension(metadata).extends`

**Before (deprecated):**
```yaml
---
name: my-skill
description: My skill description
triggers:
  intents: ["typescript"]
enabled: true
version: 3
---
```

**After (recommended):**
```yaml
---
name: my-skill
description: My skill description
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents: ["typescript"]
      enabled: true
      version: 3
---
```

**Migration:** Automatic - skills are migrated on save. No command needed. When you run `skill-creator edit` or update a skill via the CLI, the tool automatically moves root-level extension fields to the correct namespaced location.

**Programmatic access:**
```typescript
import { getExtension } from 'gsd-skill-creator';

// Works for both old and new format
const ext = getExtension(skill.metadata);
console.log(ext.triggers);  // Always finds triggers
console.log(ext.enabled);   // Always finds enabled
console.log(ext.version);   // Always finds version
```

The `getExtension()` accessor handles both locations transparently, so code that reads skills does not need to change.

### Flat-File to Directory Format (v1.0.0+)

Skills moved from single files to directories to support reference materials and scripts.

**Before (legacy):**
```
.claude/skills/my-skill.md
```

**After (current):**
```
.claude/skills/my-skill/
  SKILL.md
  reference.md    (optional)
  scripts/        (optional)
```

**Migration command:**
```bash
# Migrate all skills
skill-creator migrate

# Migrate specific skill
skill-creator migrate my-skill
```

This command:
1. Scans for flat-file skills (*.md directly in skills/)
2. Creates directories for each
3. Moves content to SKILL.md
4. Reports migration results

**What gets preserved:**
- All frontmatter fields (name, description, triggers, etc.)
- All skill body content (markdown)
- Git history (content is moved, not recreated)

### Agent Tools Array Format (v1.0.0+)

Agent `tools` field changed from YAML array to comma-separated string to match the official Claude Code specification.

**Before (deprecated):**
```yaml
---
name: my-agent
tools:
  - Read
  - Write
  - Bash
---
```

**After (required):**
```yaml
---
name: my-agent
tools: Read, Write, Bash
---
```

**Migration command:**
```bash
skill-creator migrate-agent
```

This command:
1. Scans all agents in .claude/agents/
2. Converts array tools to string format
3. Validates against official Claude Code spec
4. Reports migration results

**Why:** The official Claude Code agent format requires comma-separated strings, not YAML arrays. See [OFFICIAL-FORMAT.md](./OFFICIAL-FORMAT.md) for the complete specification.

**Validation:** Run `skill-creator agents validate` to check all agents for format compliance.

---

## Troubleshooting

Common migration and extension-related errors:

| Error | Cause | Solution |
|-------|-------|----------|
| `Skill already in directory format` | Running migrate on current format | No action needed |
| `Invalid skill name` | Name has uppercase or special chars | Use `skill-creator validate` to see suggested fix |
| `Skill not found` | Skill doesn't exist at specified scope | Check scope with `skill-creator list --scope=all` |
| `Permission denied` | Cannot write to skill directory | Check file permissions on `.claude/skills/` |
| `Reserved name conflict` | Skill name conflicts with built-in | Use `--force` flag or rename skill |
| `Budget exceeded` | Skill content too large | Reduce content or use `--force` flag |

### Validating Skills

Check skill format and identify issues:

```bash
# Validate all skills
skill-creator validate

# Validate specific skill
skill-creator validate my-skill
```

Validation output shows:
- `+` Valid skill
- `!` Needs migration (legacy format detected)
- `x` Errors (invalid name, missing fields)

---

## Known Issues

This section documents known bugs and limitations with workarounds.

### User-Level Agent Discovery (GitHub #11205)

**Status:** Known bug in Claude Code

**Description:** Agents stored in `~/.claude/agents/` may not be automatically discovered by Claude Code at session startup. This affects user-level agents only; project-level agents in `.claude/agents/` work correctly.

**Symptoms:**
- User-level agents don't appear in agent list at session start
- `/agents` command doesn't show expected agents
- Agents work if manually specified via CLI flag

**Workarounds:**

1. **Use project-level agents (recommended)**
   Store agents in `.claude/agents/` instead of `~/.claude/agents/`. Project-level agents are always discovered.

2. **Use the /agents UI command**
   Within Claude Code, run `/agents` to list and manually load agents.

3. **Pass agents via CLI flag**
   When starting Claude Code: `claude --agents=path/to/agent.md`

**Impact on gsd-skill-creator:**
- The tool warns when creating user-level agents
- Agent suggestion workflow defaults to project-level
- User can override with `--scope=user` if needed

**Tracking:** Claude Code issue #11205

---

### No Other Known Issues

As of v1.2.0, no other significant issues have been identified. If you encounter problems:

1. Check the [GitHub Issues](https://github.com/user/gsd-skill-creator/issues)
2. Run `skill-creator validate` to check skill format
3. Run `skill-creator agents validate` to check agent format
4. Enable verbose mode: `skill-creator --verbose <command>`

---

## Documentation Notes

### Inline Comment Audit (v1.2.0)

The following source files were audited for comment accuracy:

| File | Status | Notes |
|------|--------|-------|
| `src/types/skill.ts` | Accurate | All @deprecated tags include migration path (e.g., "Use getExtension(metadata).triggers") |
| `src/detection/skill-generator.ts` | Accurate | TODO comments in generated skills are intentional placeholders for user customization |
| `src/storage/skill-store.ts` | Accurate | Migration behavior documented correctly; logs when migrating from legacy format |

**Findings:**

1. **@deprecated annotations** in `src/types/skill.ts` correctly reference `getExtension(metadata)` accessor for all 7 deprecated root-level fields.

2. **TODO comments** in `src/detection/skill-generator.ts` are part of generated skill templates and serve as user prompts, not unfinished work.

3. **Migration logging** in `src/storage/skill-store.ts` accurately describes automatic migration from legacy to namespaced format.

All inline documentation matches actual code behavior.

---

## See Also

- [OFFICIAL-FORMAT.md](./OFFICIAL-FORMAT.md) - Official Claude Code skill and agent format reference
