---
name: sc:start
description: Warm-start session briefing — displays GSD position, recent activity, pending suggestions, and skill budget
allowed-tools:
  - Read
  - Bash
  - Glob
---

# /sc:start — Warm-Start Session Briefing

<objective>
Orient the current Claude session with a warm-start briefing that displays:

1. **GSD Position** (SESS-01) — Current phase/plan position from STATE.md
2. **Recent Activity** (SESS-02) — Latest session observations from sessions.jsonl
3. **Pending Suggestions** (SESS-03) — Unreviewed skill suggestions with occurrence counts
4. **Skill Budget** (SESS-04) — Active skills and token budget usage

Run this command at the start of every session for full context awareness.
</objective>

<process>

## Step 0: Read Integration Config

Read `.planning/skill-creator.json` using the Read tool.

- If the file does not exist, proceed with all features enabled (opt-out model: everything defaults to `true`).
- Parse the JSON to extract:
  - `integration.suggest_on_session_start` (controls SESS-03)
  - `token_budget.max_percent` and `token_budget.warn_at_percent` (used in SESS-04)
- If parsing fails or the file is empty, proceed with defaults:
  - `suggest_on_session_start`: true
  - `max_percent`: 5
  - `warn_at_percent`: 4

Store these values for use in later steps.

---

## Step 1: Run Monitoring Scan (MON-03)

If `integration.phase_transition_hooks` is `true` (from Step 0 config), run a passive monitoring scan to detect changes since the last session.

Read `.planning/patterns/scan-state.json` using the Read tool to check the last scan timestamp.

**Scan checks (run all, skip any that fail):**

1. **STATE.md transitions:** Read `.planning/STATE.md`. Compare key fields (phase, status, blockers) against the values in `scan-state.json`. If any changed:
   - Phase completed: note "Phase N completed since last scan"
   - New blocker: note "New blocker detected: [text]"
   - Blocker resolved: note "Blocker resolved since last scan"

2. **ROADMAP.md structural changes:** Read `.planning/ROADMAP.md`. Compare the phase list against `scan-state.json`. If phases were added, removed, or reordered, note the changes.

3. **Plan-vs-summary diffs for completed phases:** If any phases completed since the last scan (detected in check 1), find their PLAN.md and SUMMARY.md files. Compare planned vs actual files, emergent work, and dropped items.

**After scanning, update `scan-state.json`** with current STATE.md values, ROADMAP.md phase list, and current timestamp. Write the updated file using Bash:
```bash
echo '{"last_scan_timestamp":"[ISO 8601]","state_md_snapshot":{...},"roadmap_phases":[...]}' > .planning/patterns/scan-state.json
```

**Append scan observations** to `.planning/patterns/sessions.jsonl` for each detected change. Each entry uses `"type": "scan"` and `"source": "scan"`.

If no changes detected, display:
```
### Monitoring Scan
No changes detected since last scan ([timestamp]).
```

If changes detected, display them as a compact section:
```
### Monitoring Scan
Changes detected since last scan:
- Phase 86 completed
- 1 plan-vs-summary diff (scope: expanded)
- ROADMAP.md: 1 phase status changed
```

If this is the first scan (no scan-state.json), display:
```
### Monitoring Scan
First scan -- baseline captured. Changes will be tracked from next session.
```

If `phase_transition_hooks` is `false`, skip this step entirely.

---

## Step 2: GSD Position (SESS-01)

Read `.planning/STATE.md` using the Read tool.

**If STATE.md does not exist:**
Display:
```
### GSD Position
No GSD project initialized. Run `/gsd:new-project` to get started.
```
Then skip to Step 3.

**If STATE.md exists, extract and display:**
- **Current Phase:** name and number (from the `Phase:` line under `## Current Position`)
- **Current Plan:** number and total (from the `Plan:` line, e.g., "02 of 5")
- **Status:** in progress, complete, blocked (from the `Status:` line)
- **Progress bar:** if present (the `Progress:` line with bracket notation)
- **Last activity:** date and description (from the `Last activity:` line)
- **Next action:** if listed in the `## Session Continuity` section (the `Next action:` line)

Format as:
```
### GSD Position

| Field          | Value                                          |
|----------------|------------------------------------------------|
| Phase          | 85 — Session Start + Slash Commands            |
| Plan           | 01 of 4                                        |
| Status         | In progress                                    |
| Progress       | [####____] 4/8 phases                          |
| Last activity  | 2026-02-12 — Completed plan 84-02              |
| Next action    | /gsd:execute-phase 85                          |
```

If any field is missing from STATE.md, omit that row rather than showing "N/A".

---

## Step 3: Recent Activity (SESS-02)

Read `.planning/patterns/sessions.jsonl` using the Read tool.

**If the file does not exist or is empty:**
Display:
```
### Recent Activity
No session history yet. Activity will be captured as you work.
```
Then skip to Step 4.

**If the file exists, parse the last 10 lines** (most recent entries). Each line is a JSON object with fields like: `type`, `timestamp`, `commit_type`, `message`, `files_changed`, `source`, `phase`.

Display as a compact table:
```
### Recent Activity

| Time                | Type   | Details                                            |
|---------------------|--------|----------------------------------------------------|
| 2026-02-12T14:30:00 | commit | feat(84-02): implement post-commit integration ... |
| 2026-02-12T14:15:00 | commit | test(84-02): add failing test for hook output ...  |
```

- **Time:** the `timestamp` field
- **Type:** the `type` field (commit, session, observation, etc.)
- **Details:** For commits: `commit_type(scope): message` truncated to 55 characters. For other types: `message` truncated to 55 characters.
- If entries span multiple days, add a date separator row between days.

Show the total entry count: "Showing last 10 of N entries" (where N is the total line count of the file).

---

## Step 4: Pending Suggestions (SESS-03)

**First, check config:** If `integration.suggest_on_session_start` is `false`, display:
```
### Pending Suggestions
Suggestion surfacing disabled in config.
```
Then skip to Step 5.

**If enabled (default):** Read `.planning/patterns/suggestions.json` using the Read tool.

**If the file does not exist or is empty:**
Display:
```
### Pending Suggestions
No pending suggestions. Patterns will be detected as you work.
```
Then skip to Step 4.

**If the file exists,** parse it as a JSON array of suggestion objects. Each suggestion has:
- `candidate.id` — unique identifier
- `candidate.description` or `candidate.pattern_name` — human-readable name
- `candidate.occurrences` or `candidate.observation_count` — how many times the pattern was seen
- `state` — one of: "pending", "accepted", "deferred", "dismissed"
- `createdAt` — timestamp (milliseconds since epoch)

**Filter** for suggestions where `state` is `"pending"`.

**Sort** by occurrence count descending (highest signal first).

**Display:**
```
### Pending Suggestions

| Pattern                          | Occurrences | First Seen |
|----------------------------------|-------------|------------|
| TDD red-green cycle automation   | 7           | 2026-02-01 |
| Lint-fix-commit sequence         | 4           | 2026-02-05 |

Run `/sc:suggest` to review and accept/dismiss suggestions.
```

- **Pattern:** the candidate description or pattern name, truncated to 35 characters
- **Occurrences:** the occurrence count
- **First Seen:** `createdAt` converted to YYYY-MM-DD format

If no suggestions have state `"pending"`, display the same "No pending suggestions" message.

---

## Step 5: Skill Budget (SESS-04)

Run the following command using the Bash tool with a 10-second timeout:
```bash
npx skill-creator status --json 2>/dev/null
```

**If the command succeeds,** parse the JSON output and extract:
- `active_skills` or equivalent — number of active skills
- Per-skill names and sizes (character counts)
- Total budget usage as a percentage

**If the command fails** (skill-creator not built, error, timeout), fall back to a manual scan:
1. Use the Glob tool to find `*.md` files in `.claude/commands/` and `~/.claude/commands/`
2. For each file found, note its name and estimate its size
3. Calculate approximate total character count

**Read thresholds from config** (from Step 0):
- `token_budget.max_percent` (default: 5)
- `token_budget.warn_at_percent` (default: 4)

**Display:**
```
### Skill Budget

| Metric         | Value                          |
|----------------|--------------------------------|
| Active skills  | 3                              |
| Budget used    | 1,234 / 50,000 chars (2.5%)   |
| Max budget     | 5% of context window           |
| Warning at     | 4%                             |

**Top skills by size:**
1. beautiful-commits (1,333 chars)
2. gsd-onboard (1,352 chars)
3. gsd-trace (1,472 chars)
```

- If budget usage exceeds `warn_at_percent`, add a warning line: "Warning: Budget usage approaching limit. Consider pruning inactive skills."
- If no skills are found, display: "No active skills loaded."

---

## Step 6: Summary Footer

After all four sections, display a one-line summary:

```
---
**Session Briefing:** [Phase 85/Plan 01] | [12 recent entries] | [2 pending suggestions] | [2.5% budget used]
```

Substitute actual values from each section. Use "N/A" for any section that could not be read.

**If any section had notable findings, highlight them:**
- Blockers found in STATE.md
- Suggestions with 5+ occurrences (high-signal)
- Budget warnings (over warn threshold)

**Suggest next action** based on GSD state:
- If STATE.md has a `Next action:` line, use that
- If status is "blocked", suggest resolving blockers
- If a phase is complete, suggest planning or executing the next phase
- If no STATE.md exists, suggest `/gsd:new-project`

Example:
```
**Next:** `/gsd:execute-phase 85` (Phase 85: Session Start + Slash Commands)
```

</process>

<success_criteria>
- Monitoring scan runs before the briefing sections when phase_transition_hooks is enabled (MON-03)
- All 4 briefing sections displayed: GSD Position (SESS-01), Recent Activity (SESS-02), Pending Suggestions (SESS-03), Skill Budget (SESS-04)
- Each section handles missing data gracefully (file not found, empty data, parse errors)
- Output is formatted for quick scanning with headers, tables, and compact lists
- Integration config is read and respected (feature toggles, budget thresholds)
- Total execution completes in under 30 seconds
- Next action suggestion is accurate based on STATE.md content
- Summary footer provides at-a-glance session orientation
</success_criteria>
