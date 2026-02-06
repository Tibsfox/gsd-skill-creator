# Storage Architecture

This document describes where gsd-skill-creator stores data, the file formats used, and how scope resolution works.

## Overview

gsd-skill-creator uses a **file-based storage architecture** with no database dependencies. All data is stored in structured files (Markdown with YAML frontmatter, JSON, JSONL) in predictable locations. This approach enables:

- **Git-friendly** - All skill files can be version controlled
- **Portable** - No database setup or dependencies
- **Inspectable** - Human-readable formats for debugging
- **Cross-platform** - Works on any system with a filesystem

## Scope Concept

Skills can exist at two scopes:

| Scope | Location | Purpose |
|-------|----------|---------|
| **User** | `~/.claude/skills/` | Personal skills shared across all projects |
| **Project** | `.claude/skills/` | Project-specific skills |

Project-level skills take precedence over user-level skills with the same name. See [Scope Resolution](#scope-resolution) for details.

**Teams** follow the same scope model: project teams live in `.claude/teams/` and user teams in `~/.claude/teams/`. Agent files generated from teams are always written to project scope (`.claude/agents/`) due to Claude Code bug #11205 where user-level agents may not be discovered.

## Storage Locations Overview

| Data Type | Location | Format | Source File |
|-----------|----------|--------|-------------|
| Project skills | `.claude/skills/{name}/SKILL.md` | YAML frontmatter + markdown | [src/storage/skill-store.ts](../../src/storage/skill-store.ts) |
| User skills | `~/.claude/skills/{name}/SKILL.md` | YAML frontmatter + markdown | [src/types/scope.ts](../../src/types/scope.ts) |
| Skill index | `.claude/skills/.skill-index.json` | JSON | [src/storage/skill-index.ts](../../src/storage/skill-index.ts) |
| Patterns | `.planning/patterns/{category}.jsonl` | JSONL | [src/storage/pattern-store.ts](../../src/storage/pattern-store.ts) |
| Test cases | `.claude/skills/{name}/tests.json` | JSON | [src/testing/test-store.ts](../../src/testing/test-store.ts) |
| Calibration events | `~/.gsd-skill/calibration/events.jsonl` | JSONL | [src/calibration/calibration-store.ts](../../src/calibration/calibration-store.ts) |
| Embedding cache | `~/.gsd-skill-creator/embeddings/cache.json` | JSON | [src/embeddings/embedding-cache.ts](../../src/embeddings/embedding-cache.ts) |
| Threshold history | `~/.gsd-skill/calibration/thresholds.json` | JSON | [src/calibration/threshold-history.ts](../../src/calibration/threshold-history.ts) |
| Project teams | `.claude/teams/{name}/config.json` | JSON | [src/teams/team-store.ts](../../src/teams/team-store.ts) |
| User teams | `~/.claude/teams/{name}/config.json` | JSON | [src/teams/team-store.ts](../../src/teams/team-store.ts) |

## File Formats

### SKILL.md Format

Skills use YAML frontmatter followed by markdown content. The frontmatter defines metadata, and the markdown body provides instructions for Claude.

```markdown
---
name: my-skill
description: What this skill does and when Claude should use it
user-invocable: true
allowed-tools: Read, Write, Glob
metadata:
  extensions:
    gsd-skill-creator:
      enabled: true
      version: 1
      createdAt: "2026-02-05T10:00:00.000Z"
      updatedAt: "2026-02-05T10:00:00.000Z"
---

# My Skill

Instructions for Claude when this skill is activated...

## Section 1

Detailed guidance...
```

**Frontmatter Fields:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Skill identifier (must match directory name) |
| `description` | Recommended | string | When Claude should use this skill (1-1024 chars) |
| `disable-model-invocation` | No | boolean | If true, Claude won't auto-load this skill |
| `user-invocable` | No | boolean | If true, user can invoke with `/skill-name` |
| `allowed-tools` | No | string | Comma-separated list of allowed tools |
| `model` | No | string | Model override (sonnet, opus, haiku, inherit) |
| `context` | No | string | Set to "fork" for isolated subagent context |
| `agent` | No | string | Agent type when using context: fork |
| `argument-hint` | No | string | Hint shown in autocomplete |
| `hooks` | No | object | Lifecycle hooks configuration |
| `metadata.extensions.gsd-skill-creator` | No | object | Extension fields (see below) |

**Extension Fields (gsd-skill-creator):**

| Field | Type | Description |
|-------|------|-------------|
| `enabled` | boolean | Whether skill is active |
| `version` | number | Auto-incremented on updates |
| `createdAt` | string | ISO timestamp of creation |
| `updatedAt` | string | ISO timestamp of last update |
| `triggers` | object | Optional trigger patterns |

For the complete official specification, see [OFFICIAL-FORMAT.md](../OFFICIAL-FORMAT.md).

### Team Config Format

Team configurations are stored as JSON files at `{teams-dir}/{team-name}/config.json`. The `TeamStore` class handles persistence and validates configs via `validateTeamConfig()` before writing.

```json
{
  "name": "my-team",
  "description": "A leader/worker team for parallel task execution",
  "leadAgentId": "my-team-lead",
  "version": 1,
  "topology": "leader-worker",
  "createdAt": "2026-02-05T10:00:00.000Z",
  "members": [
    {
      "agentId": "my-team-lead",
      "name": "Lead",
      "agentType": "coordinator"
    },
    {
      "agentId": "my-team-worker-1",
      "name": "Worker 1",
      "agentType": "worker"
    }
  ]
}
```

**Config Fields:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Team identifier (must match directory name) |
| `description` | Yes | string | Team purpose description |
| `leadAgentId` | Yes | string | Agent ID of the team leader (must match a member) |
| `version` | Yes | number | Config version (currently 1) |
| `topology` | Yes | string | Team pattern: `leader-worker`, `pipeline`, or `swarm` |
| `createdAt` | Yes | string | ISO timestamp of creation |
| `members` | Yes | array | Array of team member objects |

**Member Fields:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `agentId` | Yes | string | Unique agent identifier (maps to `{agentId}.md` file) |
| `name` | Yes | string | Human-readable display name |
| `agentType` | Yes | string | Role: `orchestrator`, `coordinator`, or `worker` |

### tests.json Format

Test cases are stored in JSON arrays within each skill's directory.

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "commit my changes with a descriptive message",
    "expected": "positive",
    "description": "Should activate for explicit commit requests",
    "tags": ["core", "happy-path"],
    "difficulty": "easy",
    "minConfidence": 0.8,
    "createdAt": "2026-02-05T10:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "prompt": "what is a git commit?",
    "expected": "negative",
    "description": "Should not activate for informational queries",
    "reason": "Question about concepts, not action request",
    "maxConfidence": 0.3,
    "createdAt": "2026-02-05T10:00:00.000Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "prompt": "save my work",
    "expected": "edge-case",
    "description": "Ambiguous - could mean commit or save file",
    "tags": ["ambiguous"],
    "difficulty": "hard",
    "createdAt": "2026-02-05T10:00:00.000Z"
  }
]
```

**Test Case Fields:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | UUID, auto-generated |
| `prompt` | Yes | string | The test prompt |
| `expected` | Yes | string | "positive", "negative", or "edge-case" |
| `description` | No | string | What this test verifies |
| `tags` | No | string[] | Tags for filtering |
| `difficulty` | No | string | "easy", "medium", or "hard" |
| `minConfidence` | No | number | Minimum confidence for positive tests (0-1) |
| `maxConfidence` | No | number | Maximum confidence for negative tests (0-1) |
| `reason` | No | string | Why skill should not activate (for negative) |
| `createdAt` | Yes | string | ISO timestamp, auto-generated |

### Calibration events.jsonl Format

Calibration events are stored in JSONL format (one JSON object per line) for efficient append operations.

```jsonl
{"id":"a1b2c3d4-...","timestamp":"2026-02-05T10:00:00.000Z","skillName":"my-commit-skill","prompt":"commit my changes","predicted":true,"actual":"continued","similarity":0.87,"outcome":"continued"}
{"id":"e5f6g7h8-...","timestamp":"2026-02-05T10:05:00.000Z","skillName":"my-commit-skill","prompt":"what is git?","predicted":false,"actual":"corrected","similarity":0.42,"outcome":"corrected"}
```

**Calibration Event Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID, auto-generated |
| `timestamp` | string | ISO timestamp |
| `skillName` | string | Name of the skill |
| `prompt` | string | User's prompt |
| `predicted` | boolean | Whether simulator predicted activation |
| `actual` | string | Actual outcome (continued, corrected) |
| `similarity` | number | Similarity score (0-1) |
| `outcome` | string | "continued" (prediction correct) or "corrected" (user overrode) |

### Embedding Cache Format

Embedding vectors are cached to avoid recomputation.

```json
{
  "version": "1.0",
  "modelId": "Xenova/bge-small-en-v1.5",
  "entries": {
    "my-skill:a1b2c3d4e5f6g7h8": {
      "embedding": [0.0123, -0.0456, 0.0789, ...],
      "modelVersion": "1.0.0",
      "contentHash": "a1b2c3d4e5f6g7h8",
      "createdAt": "2026-02-05T10:00:00.000Z"
    }
  }
}
```

**Cache Structure:**

| Field | Type | Description |
|-------|------|-------------|
| `version` | string | Cache format version |
| `modelId` | string | Embedding model identifier |
| `entries` | object | Map of cache key to entry |

**Cache Entry Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `embedding` | number[] | 384-dimensional embedding vector |
| `modelVersion` | string | Model version for invalidation |
| `contentHash` | string | SHA-256 hash of content (truncated to 16 chars) |
| `createdAt` | string | ISO timestamp |

Cache keys use the format `{skillName}:{contentHash}`, enabling automatic invalidation when skill content changes.

### Threshold History Format

Threshold history tracks calibration snapshots with rollback support.

```json
{
  "snapshots": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-02-01T09:00:00.000Z",
      "globalThreshold": 0.75,
      "skillOverrides": {},
      "f1Score": 0.785,
      "dataPointsUsed": 75,
      "reason": "manual"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "timestamp": "2026-02-05T10:30:00.000Z",
      "globalThreshold": 0.72,
      "skillOverrides": {
        "my-special-skill": 0.80
      },
      "f1Score": 0.871,
      "dataPointsUsed": 156,
      "reason": "calibration"
    }
  ],
  "currentIndex": 1
}
```

**Snapshot Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | UUID |
| `timestamp` | string | ISO timestamp |
| `globalThreshold` | number | Global activation threshold (0-1) |
| `skillOverrides` | object | Per-skill threshold overrides |
| `f1Score` | number | F1 score at calibration time |
| `dataPointsUsed` | number | Number of events used for calibration |
| `reason` | string | "calibration", "manual", or "rollback" |

### Skill Index Format

The skill index caches metadata for fast lookups without reading every skill file.

```json
{
  "version": 1,
  "buildTime": "2026-02-05T10:00:00.000Z",
  "entries": [
    {
      "name": "my-commit-skill",
      "description": "Generates conventional commit messages...",
      "enabled": true,
      "triggers": {
        "intents": ["commit", "save changes"],
        "files": ["*.ts", "*.js"],
        "contexts": ["git"]
      },
      "path": ".claude/skills/my-commit-skill/SKILL.md",
      "mtime": 1707130000000
    }
  ]
}
```

**Index Entry Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Skill name |
| `description` | string | Skill description |
| `enabled` | boolean | Whether skill is active |
| `triggers` | object | Optional trigger patterns |
| `path` | string | Path to SKILL.md |
| `mtime` | number | File modification time (for cache invalidation) |

### Pattern Store Format

Patterns are stored in JSONL files categorized by type.

```jsonl
{"timestamp":1707130000000,"category":"sessions","data":{"prompt":"commit my changes","skills":["my-commit-skill"]}}
{"timestamp":1707130060000,"category":"sessions","data":{"prompt":"run tests","skills":["test-runner"]}}
```

**Pattern Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `timestamp` | number | Unix timestamp in milliseconds |
| `category` | string | Pattern category (e.g., "sessions") |
| `data` | object | Category-specific data |

## Scope Resolution

When a skill exists at both user and project scope, scope resolution determines which version Claude Code will use.

**Resolution Order:**

1. **Project scope** (`.claude/skills/`) - Checked first
2. **User scope** (`~/.claude/skills/`) - Fallback

**Example:**

```
~/.claude/skills/my-skill/SKILL.md     (User scope)
.claude/skills/my-skill/SKILL.md       (Project scope) <-- ACTIVE

Project-level wins. User-level is "shadowed".
```

**CLI Flags:**

| Flag | Description |
|------|-------------|
| `--project` or `-p` | Target project-level scope |
| (default) | Target user-level scope |

**Use `skill-creator resolve <skill-name>`** to see which version is active and whether another is shadowed.

For more details, see [CLI.md](../CLI.md#resolve).

## Migration Considerations

### Legacy Flat-File Format

Older versions stored skills as flat files (`skill-name.md`) instead of subdirectories (`skill-name/SKILL.md`).

**Detection:**

```bash
skill-creator migrate --dry-run
```

**Migration:**

```bash
# Migrate all legacy skills
skill-creator migrate

# Migrate specific skill
skill-creator migrate my-old-skill
```

The migrate command:
1. Reads the flat file content
2. Creates the subdirectory structure
3. Writes SKILL.md with preserved content
4. Removes the original flat file

### Legacy Agent Tools Format

Agents may use the legacy array format for tools instead of the required comma-separated string.

**Detection:**

```bash
skill-creator agents validate
```

**Migration:**

```bash
skill-creator migrate-agent
```

See [CLI.md](../CLI.md#migrate) and [CLI.md](../CLI.md#migrate-agent) for full command details.

## Directory Structure Summary

```
~/.claude/
  skills/
    {skill-name}/
      SKILL.md          # Skill definition
      tests.json        # Test cases
      reference.md      # Optional reference docs
      scripts/          # Optional scripts
  teams/
    {team-name}/
      config.json       # Team configuration

~/.gsd-skill/
  calibration/
    events.jsonl        # Calibration events
    thresholds.json     # Threshold history

~/.gsd-skill-creator/
  embeddings/
    cache.json          # Embedding cache

.claude/
  skills/
    .skill-index.json   # Index cache
    {skill-name}/
      SKILL.md
      tests.json
  agents/
    {agent-name}.md     # Agent definitions
  teams/
    {team-name}/
      config.json       # Team configuration

.planning/
  patterns/
    sessions.jsonl      # Usage patterns
  calibration/
    benchmark.json      # Benchmark results
```

## See Also

- [OFFICIAL-FORMAT.md](../OFFICIAL-FORMAT.md) - Official Claude Code skill/agent specification
- [CLI.md](../CLI.md) - Command reference for storage operations
- [extending.md](./extending.md) - Creating custom storage backends
