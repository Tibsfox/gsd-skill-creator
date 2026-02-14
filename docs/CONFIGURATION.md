# Configuration

## Retention Settings

Pattern retention is bounded to prevent unbounded growth:

| Setting | Default | Description |
|---------|---------|-------------|
| `maxAgeDays` | 90 | Maximum age of observations |
| `maxSessions` | 1000 | Maximum number of sessions to retain |

## Trigger Thresholds

| Threshold | Value | Description |
|-----------|-------|-------------|
| **Skill suggestion** | 3+ occurrences | Minimum pattern repetitions |
| **Agent suggestion** | 5+ co-activations | Minimum skill pair activations |
| **Stability requirement** | 7+ days | Minimum pattern persistence |
| **Refinement eligibility** | 3+ corrections | Minimum feedback count |

## Validation Thresholds (v1.1+)

| Threshold | Default | Range | Description |
|-----------|---------|-------|-------------|
| **Conflict threshold** | 0.85 | 0.5-0.95 | Semantic similarity for conflict detection |
| **Activation threshold** | 0.75 | 0.5-0.95 | Confidence level for activation prediction |
| **Too-close-to-call** | <2% margin | - | Flags skills that are borderline competitors |

## Cluster Constraints

| Setting | Default | Description |
|---------|---------|-------------|
| `minClusterSize` | 2 | Minimum skills per cluster |
| `maxClusterSize` | 5 | Maximum skills per cluster |
| `minCoActivations` | 5 | Minimum co-activation count |
| `stabilityDays` | 7 | Minimum pattern stability |

## Refinement Bounds

| Setting | Default | Description |
|---------|---------|-------------|
| `minCorrections` | 3 | Corrections needed before refinement |
| `maxContentChangePercent` | 20 | Maximum change per refinement |
| `cooldownDays` | 7 | Days between refinements |

## Integration Config (v1.11+)

The integration config at `.planning/skill-creator.json` provides per-feature toggles:

```json
{
  "features": {
    "session_observation": true,
    "skill_loading": true,
    "passive_monitoring": true,
    "dashboard_generation": false
  },
  "token_budget": {
    "cumulative_char_budget": 15500,
    "profile_budgets": {
      "executor": 20000,
      "planner": 12000
    }
  },
  "terminal": {
    "port": 3001,
    "session_name": "gsd-dev",
    "auth_mode": "none"
  }
}
```

All fields are validated with Zod schemas. Missing fields use sensible defaults.

## Budget Configuration (v1.19+)

### Cumulative Character Budget

The cumulative budget limits how many characters of skills load into a single context:

| Setting | Location | Priority |
|---------|----------|----------|
| `profile_budgets.<profile>` | Integration config | Highest |
| `cumulative_char_budget` | Integration config | Medium |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | Environment variable | Low |
| Default: 15500 | Built-in | Fallback |

### Per-Profile Budgets

Different agent profiles can have different budgets. Profile names strip the `gsd-` prefix for lookup:

```json
{
  "token_budget": {
    "profile_budgets": {
      "executor": 20000,
      "planner": 12000,
      "researcher": 8000
    }
  }
}
```

A request for profile `gsd-executor` looks up `executor` in the map.

### Budget History

Budget history tracks both installed and loaded dimensions:

| Field | Type | Description |
|-------|------|-------------|
| `totalChars` | number | Legacy field (still written for compat) |
| `installedTotal` | number? | Total installed chars (v1.19+) |
| `loadedTotal` | number? | Total loaded chars (v1.19+) |
| `skillCount` | number | Number of skills |
| `timestamp` | string | ISO timestamp |

Old snapshots without `installedTotal`/`loadedTotal` are automatically migrated on read, defaulting both to `totalChars`.

## Staging Configuration (v1.17+)

The staging layer uses filesystem-based configuration at `.planning/staging/`:

| Directory | Purpose |
|-----------|---------|
| `inbox/` | New items awaiting analysis |
| `checking/` | Items being analyzed |
| `attention/` | Items needing human review |
| `ready/` | Items approved for execution |
| `aside/` | Items deferred or rejected |
| `queue.jsonl` | Execution queue with 7-state machine |

## Console Configuration (v1.16+)

The console message bus at `.planning/console/`:

| Directory | Purpose |
|-----------|---------|
| `inbox/` | Messages from browser to GSD |
| `outbox/` | Messages from GSD to browser |

Messages are Zod-validated JSON envelopes with `type`, `payload`, and `status` fields.
