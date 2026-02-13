---
name: sc:digest
description: Generate a learning digest — patterns, activation history, phase trends, and recommendations from session data
allowed-tools:
  - Read
  - Bash
  - Glob
---

# /sc:digest -- Generate learning digest from session observation data

<objective>
Generate a comprehensive learning digest by analyzing all session observation data in sessions.jsonl. Surface commit type distribution, phase activity breakdown, temporal trends, correction rate analysis, activation history, and actionable recommendations. This command closes the learning loop by turning raw observation data into insights.
</objective>

<process>

## Step 1: Read integration config

Read `.planning/skill-creator.json` using the Read tool. Extract observation settings:
- `observation.retention_days` -- how long to keep data (default: 30)
- `suggestions.min_occurrences` -- threshold for pattern suggestions (default: 3)

If the file is missing, use defaults and proceed.

Also read `.planning/STATE.md` to get the current phase and plan context. This helps contextualize recommendations (e.g., which phase is active now vs. historical data).

## Step 1.5: Run Monitoring Scan (MON-03)

Before analyzing session data, run a monitoring scan to capture any recent changes not yet recorded.

Follow the same monitoring scan process described in `/sc:start` Step 1. This ensures the digest includes the very latest plan-vs-summary diffs, STATE.md transitions, and ROADMAP.md changes.

If the scan produces new observations, they will be included in the subsequent session data analysis.

## Step 2: Load session data

Read `.planning/patterns/sessions.jsonl` in full using the Read tool.

- If the file does not exist or is empty, display:
  > No session data available. Session observations are captured by the post-commit hook and `/sc:observe`. Make some commits and try again.
  Then stop.
- Parse each line as JSON. Count total entries.
- Note: if the file is very large (more than 500 lines), mention that analysis may take a moment.

## Step 3: Compute pattern analysis

### 3a. Commit type distribution

Count occurrences of each `commit_type` across all entries. Display as a visual distribution with bar charts:

```
### Commit Type Distribution
feat:     ████████████ 45 (38%)
fix:      ████████ 30 (25%)
test:     ██████ 22 (18%)
docs:     ███ 12 (10%)
other:    ██ 8 (7%)
refactor: █ 3 (2%)
```

Sort by count descending. Use unicode block characters for the bars. Scale bars proportionally so the largest type gets approximately 12 blocks.

### 3b. Phase activity

Group entries by the `phase` field. For each phase, compute:
- Total commits
- Date range (earliest to latest entry timestamp)
- Dominant commit type (most frequent type in that phase, as percentage)

Display as a table, sorted by phase number descending (most recent first):

```
### Phase Activity
| Phase | Commits | Date Range | Dominant Type |
|-------|---------|------------|---------------|
| 85    | 15      | Feb 12     | test (40%)    |
| 84    | 22      | Feb 12     | feat (55%)    |
| 83    | 18      | Feb 11-12  | feat (50%)    |
```

Highlight the most active phase with a note.

### 3c. Temporal trends

Group entries by date (extract date from `timestamp`). Show commits per day:

```
### Temporal Trends
| Date       | Commits | Types                    |
|------------|---------|--------------------------|
| 2026-02-12 | 35      | feat(15) test(12) fix(8) |
| 2026-02-11 | 22      | feat(10) fix(7) docs(5)  |
```

If there are entries with `source: "manual"` (from `/sc:observe`), note those separately:
- "Includes [N] manual observations from `/sc:observe`."

### 3d. Correction patterns

Look for `fix` commits that follow `feat` commits on the same phase. Calculate a correction rate per phase:

```
correction_rate = fix_commits / feat_commits
```

Display phases with correction rates above 0.3 (30%):

```
### Correction Patterns
| Phase | Feat | Fix | Rate | Assessment          |
|-------|------|-----|------|---------------------|
| 84    | 10   | 5   | 50%  | Consider more TDD   |
| 83    | 15   | 3   | 20%  | Healthy range       |
```

If no phases have correction rates above 0.3, display: "All phases within healthy correction range."

### 3e. File hotspots

If any entries have file-level data (entries with `type: "observation"` from `/sc:observe` that include `files_touched`), identify files that appear most frequently:

```
### File Hotspots
- src/config/types.ts (appeared in 8 observations)
- project-claude/install.cjs (appeared in 6 observations)
```

If no file-level data is available, display: "No file-level data available. Run `/sc:observe` to capture file data."

### 3f. Plan-vs-summary diffs (MON-01)

Look for entries in sessions.jsonl with `type: "scan"` and `scan_type: "plan_summary_diff"`. For each diff entry, display:

```
### Plan vs Summary Diffs
| Phase-Plan | Scope Change | Emergent Work | Dropped Items |
|------------|-------------|---------------|---------------|
| 86-01      | on_track    | 0             | 0             |
| 85-03      | expanded    | 2             | 0             |
```

If any diffs show `scope_change` other than "on_track", highlight them:
- **Expanded:** "Phase N-M had emergent work not in the original plan: [list]"
- **Contracted:** "Phase N-M dropped planned items: [list]"
- **Shifted:** "Phase N-M scope shifted: different files than planned"

If no scan entries exist, display: "No plan-vs-summary diffs available. Run `/sc:start` to capture baseline."

## Step 4: Activation history

Read `.planning/patterns/budget-history.jsonl` using the Read tool.

- If it exists, show which skills have been loaded and how often:
  ```
  ### Activation History
  | Skill | Activations | Last Used |
  |-------|-------------|-----------|
  | beautiful-commits | 12 | Feb 13 |
  | gsd-onboard | 10 | Feb 13 |
  ```
- If the file does not exist, display: "No activation history available."

## Step 5: Generate recommendations

Based on the analysis, generate 3-5 actionable recommendations. Apply these rules:

- **High correction rate:** If any phase has correction rate above 50%, recommend: "Phase [N] had a [X%] correction rate. Consider writing tests before implementation (TDD) for similar phases."
- **Dominant commit type:** If one type exceeds 50% of all commits, provide contextual advice:
  - Heavily feat: "Your work is heavily feature-oriented ([X%]). Ensure test coverage keeps pace."
  - Heavily fix: "High fix rate ([X%]) suggests bugs are found late. Consider earlier testing."
  - Heavily test: "Strong test focus ([X%]). Good TDD discipline."
- **Large session history:** If sessions.jsonl has more than 1000 entries, recommend: "Session history has [N] entries. Consider running `skill-creator purge --older-than [retention_days]d` to clean up."
- **Pending suggestions:** Check `.planning/patterns/suggestions.json` -- if it exists and has entries, recommend: "You have [N] pending suggestions. Run `/sc:suggest` to review."
- **Budget pressure:** Check `.planning/patterns/budget-history.jsonl` -- if recent entries show budget usage above 80%, recommend: "Skill budget at [X%]. Review loaded skills with `/sc:status`."

Always generate at least one recommendation. If nothing specific triggers, provide a general tip based on the data.

## Step 6: Display complete digest

Format and display the complete digest:

```
# Learning Digest
**Generated:** [ISO 8601 timestamp]
**Data range:** [earliest entry date] to [latest entry date]
**Total entries:** [N]

[All sections from steps 3-5]

## Recommendations
1. [recommendation 1]
2. [recommendation 2]
3. [recommendation 3]

---
_Run `/sc:start` for session briefing | `/sc:observe` to capture current session_
```

**Important:** This command performs real analysis on potentially large datasets. Process data methodically, step by step. Present results in a scannable format with tables and visual elements. If sessions.jsonl exceeds 500 lines, note that analysis covers a large dataset.

</process>

<success_criteria>
- Digest displays without errors even when sessions.jsonl has only a few entries
- Graceful handling when sessions.jsonl is missing or empty (informative message, not an error)
- Commit type distribution shows visual bar chart with percentages
- Phase activity table is sorted and includes dominant type per phase
- Temporal trends show commits grouped by date
- Correction rate is calculated per phase with assessment labels
- Activation history section present (with data or "not available" message)
- At least one actionable recommendation is generated
- Recommendations reference specific phases, numbers, and thresholds
- skill-creator.json is read for config values (retention_days, thresholds)
- Footer links to related commands (/sc:start, /sc:observe)
</success_criteria>
