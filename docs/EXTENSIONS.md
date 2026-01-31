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
- [Migration Paths](#migration-paths)
- [Troubleshooting](#troubleshooting)

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

## Migration Paths

There are two migration scenarios users may encounter.

### Flat-File to Directory Migration

**When it applies:** Skills stored as `.claude/skills/name.md` instead of `.claude/skills/name/SKILL.md`

**CLI command:**
```bash
# Migrate all skills
skill-creator migrate

# Migrate specific skill
skill-creator migrate my-skill
```

**Before (legacy flat-file):**
```
.claude/skills/my-skill.md
```

**After (current subdirectory):**
```
.claude/skills/my-skill/SKILL.md
```

Content is preserved during migration. The skill body and frontmatter are moved to the new location unchanged.

### Legacy Metadata Format Migration

**When it applies:** Extension fields at root level instead of under `metadata.extensions`

**Migration:** Automatic. Fields are moved to the correct location on next skill update via `skill-creator edit` or `skill-creator create --force`.

**Before (legacy root-level):**
```yaml
---
name: my-skill
description: My skill
triggers:
  intents: ["typescript"]
version: 1
createdAt: "2026-01-01T00:00:00Z"
---
```

**After (current namespaced):**
```yaml
---
name: my-skill
description: My skill
metadata:
  extensions:
    gsd-skill-creator:
      triggers:
        intents: ["typescript"]
      version: 1
      createdAt: "2026-01-01T00:00:00Z"
---
```

Both formats are readable via the `getExtension()` accessor. Legacy skills continue to work but will be updated to new format on next write.

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

## See Also

- [OFFICIAL-FORMAT.md](./OFFICIAL-FORMAT.md) - Official Claude Code skill and agent format reference
