---
name: sc:status
description: Show active skills with per-skill token consumption, total budget usage, and pending suggestions
allowed-tools:
  - Read
  - Bash
  - Glob
---

# /sc:status -- Show active skills, token budget usage, and pending suggestions

<objective>
Display a comprehensive skill budget dashboard showing per-skill token consumption, total budget percentage with visual progress bar, and count of pending skill suggestions. This is the primary health-check command for the skill-creator integration layer.
</objective>

<process>

## Step 1: Read integration config

Read `.planning/skill-creator.json` using the Read tool. If the file is missing, use these defaults:

```json
{
  "token_budget": {
    "max_percent": 5,
    "warn_at_percent": 4
  },
  "suggestions": {
    "min_occurrences": 3
  }
}
```

No config toggle gates this command -- it is always available regardless of integration settings.

## Step 2: Gather skill budget data

Run the following command via the Bash tool with a 10-second timeout:

```bash
npx skill-creator status --json
```

Parse the JSON output to extract:
- `skills` array with per-skill `name`, `totalChars`, `descriptionChars`, `bodyChars`
- `totalChars` for total budget usage
- `budget` for the budget ceiling
- `usagePercent` for percentage used
- `headroom` for remaining characters

**Fallback if CLI fails:** If the command errors or is unavailable, manually scan for skills:

1. Glob `.claude/commands/*.md` and `.claude/skills/*/SKILL.md` to find active skill files
2. Read each skill file and count its character length
3. Sum total characters as budget usage
4. Calculate budget ceiling: `(token_budget.max_percent / 100) * 200000` (assumed 200k char context window)
5. Derive `usagePercent = (totalChars / budget) * 100`
6. Derive `headroom = budget - totalChars`

## Step 3: Display per-skill breakdown

Display a markdown table sorted by size (largest first):

```
## Skill Budget Status

| Skill | Size | % of Budget |
|-------|------|-------------|
| beautiful-commits | 1,333 chars | 8.6% |
| gsd-trace | 1,472 chars | 9.5% |
| ... | ... | ... |
```

If no skills are found, display: "No active skills found."

## Step 4: Display budget summary

Show total usage with a visual progress bar:

```
### Budget Overview

Budget: [####________________] 2.3% (4,230 / 184,000 chars)
Warning threshold: 4% | Maximum: 5%
Remaining headroom: 179,770 chars
```

Construct the progress bar with 20 segments:
- Filled segments: `round((usagePercent / max_percent) * 20)` capped at 20
- Use `#` for filled, `_` for empty

If `usagePercent >= warn_at_percent` from config, append a warning:

```
WARNING: Budget usage (4.2%) has reached the warning threshold (4%).
Consider removing or consolidating skills to free headroom.
```

If `usagePercent >= max_percent`, append:

```
CRITICAL: Budget usage (5.3%) exceeds the maximum (5%).
Skill loading may be throttled. Remove skills to restore headroom.
```

## Step 5: Display pending suggestions count

Read `.planning/patterns/suggestions.json` using the Read tool. If the file doesn't exist or is empty, display:

```
### Pending Suggestions

No pending suggestions. Patterns will be detected as you work and commit.
```

If the file exists, parse the JSON array and count entries where `state === "pending"`:

```
### Pending Suggestions

Pending suggestions: 3
Run `/sc:suggest` to review and act on detected patterns.
```

Also show a brief breakdown if there are non-pending entries:
```
Total suggestions: 7 (3 pending, 2 accepted, 1 dismissed, 1 deferred)
```

## Step 6: Display quick links

```
---

**Quick links:**
- `/sc:suggest` -- Review pending suggestions
- `/sc:start` -- Full session briefing
- `/sc:digest` -- Learning progress digest
- `/sc:wrap` -- Wrapper command options
```

</process>

<success_criteria>
- Per-skill token consumption table is displayed sorted by size
- Total budget percentage is shown with visual progress bar
- Pending suggestion count is read from suggestions.json
- Warning is shown when budget exceeds warn_at_percent threshold
- Gracefully handles missing config file, missing skills, missing suggestions.json
- Quick links to related commands are displayed
</success_criteria>
