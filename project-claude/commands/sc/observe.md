---
name: sc:observe
description: Capture a snapshot of the current session — tool sequences, files touched, corrections, and context
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

# /sc:observe -- Capture current session observation snapshot

<objective>
Capture a point-in-time snapshot of the current session by reconstructing activity from git history and existing session data. Display tool sequences, files touched, corrections detected, and session metrics. Optionally append the observation to sessions.jsonl for pattern detection.
</objective>

<process>

## Step 1: Check integration config

Read `.planning/skill-creator.json` using the Read tool. Check the `integration.observe_sessions` field.

- If the file exists and `observe_sessions` is explicitly `false`, display:
  > Session observation is disabled in config. Enable `observe_sessions` in `.planning/skill-creator.json` to capture observations.
  Then stop.
- If the file is missing or `observe_sessions` is `true` (or not set), proceed.

## Step 2: Gather session context

Since Claude does not have persistent memory between tool calls, reconstruct the session state from available artifacts.

### 2a. Recent git activity

Run via Bash:
```bash
git log --oneline -20 --since="8 hours ago"
```
Extract: commit count, commit types (conventional prefix before `:` or `(`), and messages.

### 2b. Files touched

Run via Bash:
```bash
git diff --name-only HEAD~10..HEAD 2>/dev/null | sort -u
```
Also run:
```bash
git status --short
```
Combine into a deduplicated list. Note which files have uncommitted changes.

### 2c. Tool sequences from sessions.jsonl

Read `.planning/patterns/sessions.jsonl` using the Read tool.

- If the file does not exist or is empty, note: "No prior session data available."
- If it exists, filter entries from the last 8 hours (compare `timestamp` fields against current time).
- Extract the sequence of `commit_type` values as a proxy for tool usage patterns (e.g., `test -> feat -> fix -> test` suggests a TDD cycle).

### 2d. Corrections detected

Look for patterns in recent commits that suggest corrections:
- `fix:` commits that follow `feat:` commits on the same files or phase
- `refactor:` commits after `feat:` commits
- Multiple commits touching the same file in sequence

This is heuristic, not exact. Report what is found or "No correction patterns detected."

### 2e. Current GSD context

Read `.planning/STATE.md` using the Read tool. Extract:
- Current phase number and name
- Current plan number
- Status

## Step 3: Format snapshot

Display all gathered data as a structured observation:

```
## Session Observation Snapshot
**Captured:** [ISO 8601 timestamp]
**GSD Context:** Phase [N] -- [name], Plan [M]

### Tool Sequences (last 8h)
[commit type sequence: feat -> test -> fix -> feat]
[or] No commits in the last 8 hours.

### Files Touched ([N] files)
- [file1] (modified in [N] commits)
- [file2] (new)
- [file3] (uncommitted changes)

### Corrections Detected
- [file]: feat -> fix pattern (possible bug fix after implementation)
- [or] No correction patterns detected

### Session Metrics
- Commits: [N]
- Files changed: [N]
- Dominant commit type: [type]
- Session duration estimate: [first commit time] to [last commit time]
```

## Step 4: Optionally append to sessions.jsonl

Ask the user: "Append this observation to sessions.jsonl? (yes/no)"

If yes, construct a JSON entry:
```json
{
  "type": "observation",
  "timestamp": "[ISO 8601]",
  "source": "manual",
  "phase": [N or null],
  "tool_sequences": ["feat", "test", "fix"],
  "files_touched": ["file1", "file2"],
  "corrections": [N],
  "commits": [N],
  "duration_minutes": [M]
}
```

Append to `.planning/patterns/sessions.jsonl` via Bash:
```bash
echo '<compact JSON>' >> .planning/patterns/sessions.jsonl
```

If `.planning/patterns/` does not exist, create it first:
```bash
mkdir -p .planning/patterns
```

**Important:** This command is inherently heuristic. It reconstructs session activity from git history and JSONL data. Tool calls that did not result in commits will not be captured. This is a known limitation.

</process>

<success_criteria>
- Snapshot displays without errors even when sessions.jsonl is missing or empty
- Git history is queried for the last 8 hours of activity
- Files touched are deduplicated and include uncommitted changes
- Correction patterns are detected heuristically from commit sequences
- GSD context (phase, plan) is extracted from STATE.md
- Optional JSONL append uses correct format with source "manual"
- All sections are present even if they contain "none" or "no data" messages
</success_criteria>
