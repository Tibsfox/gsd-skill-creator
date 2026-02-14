# Token Budget

Skills load within a configurable token budget to avoid context bloat:

| Setting | Default | Description |
|---------|---------|-------------|
| **Budget** | 2-5% | Percentage of context window reserved for skills |
| **Priority** | Specificity | More specific/relevant skills load first |
| **Caching** | Enabled | Recently used skills stay loaded |
| **Overflow** | Queued | Excess skills queue for next session |

## Installed vs Loading (v1.19+)

The budget system distinguishes between two dimensions:

| Dimension | Description |
|-----------|-------------|
| **Installed Total** | Sum of all skill files on disk (everything available) |
| **Loadable Total** | Skills that will actually load into context after tier-based selection |

The **Loading Projection** simulates what the BudgetStage pipeline would select:

1. **Critical** skills load first (always included if they fit)
2. **Standard** skills load next (included if budget remains)
3. **Optional** skills load last (included only if space allows)

Skills exceeding the single-skill character limit (default 15,000 chars) are flagged as oversized.

## Per-Profile Budgets (v1.19+)

Different agent profiles can have different cumulative budgets:

```json
{
  "token_budget": {
    "cumulative_char_budget": 15500,
    "profile_budgets": {
      "executor": 20000,
      "planner": 12000,
      "researcher": 8000
    }
  }
}
```

Priority chain: config `profile_budgets` > config `cumulative_char_budget` > env `SLASH_COMMAND_TOOL_CHAR_BUDGET` > default 15500.

## CLI Status Display

**Check current status:**
```bash
skill-creator status
```

**Output example (v1.19+):**
```
Installed Skills (14):
  typescript-patterns   ████████░░  27%  4,200 chars
  react-hooks           ██████░░░░  20%  3,100 chars
  git-workflow          ███░░░░░░░  10%  1,500 chars
  ...

Loading Projection (gsd-executor):
  [████████████░░░░░░░░] 62% of budget
  Loaded: 8 skills (9,600 chars)
  Deferred: 6 skills (5,700 chars)
  3 of 14 skills fit within budget
```

**JSON output:**
```bash
skill-creator status --json
```

Returns structured data with `installed` array and `projection` object.

## Budget History (v1.19+)

Budget snapshots track both dimensions over time:

| Field | Description |
|-------|-------------|
| `installedTotal` | Total installed chars at snapshot time |
| `loadedTotal` | Total loaded chars at snapshot time |
| `skillCount` | Number of skills |

The `getDualTrend()` function computes `installedCharDelta` and `loadedCharDelta` for trend analysis. Old snapshots without dual fields are automatically migrated.

**Skills that cost more tokens than they save are flagged for review.**
