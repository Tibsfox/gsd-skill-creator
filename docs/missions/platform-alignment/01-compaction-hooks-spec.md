# Compaction Recovery Hook Pair — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Sonnet
**Dependencies:** Wave 0.2 (`hook-output.cjs` helper)
**Target Files:** `.claude/hooks/pre-compact-snapshot.cjs`, `.claude/hooks/post-compact-recovery.cjs`, `.claude/settings.json`
**Priority:** P0

---

## Problem

Compaction is the single biggest cause of quality degradation in long sessions. Claude Code compresses context when approaching the window limit; after compaction the agent loses the files it was actively editing, the task it was in the middle of, test pass/fail state, recent user instructions, and working assumptions established earlier in the session. Autonomous runs (360 engine, NASA missions, HEL buildouts) typically compact 2-3 times per 2-hour stretch. OOPS doc 03 §1 estimates 15-25% quality reduction in sessions longer than 2 hours from this cause alone.

Our current `PostCompact` setup fires `session-state.cjs`, which outputs the same generic STATE.md head that SessionStart produces — not compaction-specific recovery.

## Current State

- `.claude/settings.json` has no `PreCompact` entry.
- `.claude/settings.json` `PostCompact` routes to the generic session-state handler only.
- `/tmp/claude-precompact-${sessionId}.json` does not exist; no snapshot is taken before compaction.
- Sessions recover from compaction by rediscovery — re-running git commands, re-reading STATE.md, reconstructing file context from whatever tool results survived compression.

## Solution

A matched **PreCompact** snapshot writer + **PostCompact** recovery reader. PreCompact captures critical working state to a session-scoped tmp file; PostCompact reads the snapshot, combines it with live git state, and emits a recovery payload via `additionalContext`.

### PreCompact: `pre-compact-snapshot.cjs`

Reads hook stdin JSON (`session_id`, `cwd`), then captures:

1. `session_id`, `cwd`, `timestamp`
2. `compaction_count` — incremented from prior snapshot if one exists (detects repeat compactions)
3. `git` — branch, `git status --short`, `git log --oneline -3`
4. `gsd_state` — first 30 lines of `.planning/STATE.md` if present
5. `recent_files` — last 20 entries of `/tmp/claude-journal-${sessionId}.jsonl` (file operation log)

Writes to `/tmp/claude-precompact-${sessionId}.json`. Exits 0 silently on any error.

Source: OOPS doc 03 §1 provides a complete skeleton (~65 lines). Adapt verbatim, wrap all I/O in try/catch, route stdout through the Wave 0.2 `hook-output.cjs` helper.

### PostCompact: `post-compact-recovery.cjs`

Reads hook stdin JSON, then builds a recovery payload from:

1. Prior snapshot — read `/tmp/claude-precompact-${sessionId}.json` if present. Announce `Compaction #${snapshot.compaction_count + 1}` so the agent knows how many times this session has compacted.
2. Live git state — re-run `git branch`, `git status --short`, `git log --oneline -3` (branch may have changed since snapshot).
3. GSD state — current first-30-lines of `.planning/STATE.md`.
4. Recent file operations — last 10 entries of the journal file, formatted as `{tool} {file}` lines.

Emits via hook-output helper as:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostCompact",
    "additionalContext": "CONTEXT RECOVERY (post-compaction):\n\n<parts>"
  }
}
```

Source: OOPS doc 03 §1 provides a complete skeleton (~70 lines).

### settings.json

```json
{
  "PreCompact":  [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/pre-compact-snapshot.cjs" }] }],
  "PostCompact": [{ "hooks": [{ "type": "command", "command": "node .claude/hooks/post-compact-recovery.cjs" }] }]
}
```

The existing generic `session-state.cjs` PostCompact entry stays — the new recovery handler augments it; they write independent `additionalContext` blocks.

## Acceptance Criteria

1. `pre-compact-snapshot.cjs` exists, receives `session_id` via stdin JSON, writes `/tmp/claude-precompact-${sessionId}.json` with all 5 required fields populated.
2. `pre-compact-snapshot.cjs` increments `compaction_count` on repeat invocations within the same session.
3. `post-compact-recovery.cjs` exists, reads the snapshot, emits structured recovery via `additionalContext`.
4. `post-compact-recovery.cjs` combines snapshot data with **live** git state (branch may have changed since snapshot).
5. Both handlers exit 0 with empty stdout on any exception (safety tests T-SAFE-01, T-SAFE-02 from `09-test-plan.md`).
6. `.claude/settings.json` contains both new entries, validated by the existing commit-gate JSON checker.
7. Integration smoke (T-INT-01): force-compact a session, verify recovery context appears in the next message.
8. Zero regression against the 23,645-test baseline.

## Technical Notes

- The journal file `/tmp/claude-journal-${sessionId}.jsonl` is produced by an existing session hook — do not re-implement; just read it.
- `compaction_count` being present in the snapshot is how we detect chronic compactors — after N>=3 per session the agent should proactively reduce context growth.
- `cwd` comes from the hook input, not `process.cwd()` — the hook may be spawned from a different directory than the session root.
- No external deps. Pure Node `fs`, `path`, `os`, `child_process`.
- File name uses `.cjs` not `.js` so the project's ESM package type does not break `require()`.

---

*Component spec for Platform Alignment milestone, track 1A. Source: OOPS doc 03 §1 (`www/tibsfox/com/Research/OOPS/research/03-improvements-from-analysis.md` at commit `254b50553`).*
