# P3 Event Handlers: Permission / Notification / Worktree — Component Specification

**Date:** 2026-04-15
**Milestone:** Platform Alignment
**Model Assignment:** Sonnet (handlers) + Haiku (notification logger + settings entries)
**Dependencies:** Wave 0.2 (`hook-output.cjs` helper)
**Target Files:**
- `.claude/hooks/permission-recovery.cjs`
- `.claude/hooks/notification-logger.cjs`
- `.claude/hooks/worktree-init.cjs`
- `.claude/hooks/worktree-cleanup.sh`
- `.claude/settings.json`

**Priority:** P3

---

## Problem

Three structurally similar platform events are entirely unhandled today. Each is a P3 improvement on its own; combined into one spec because the scaffolding (hook handler + settings entry + test) is identical.

### §1 PermissionDenied — retry-loop guard

When a tool call is denied (sandbox restriction, user reject, allowlist miss), the agent sees an error and often retries. Each retry wastes 100-300 tokens on an action that will never succeed. In multi-agent convoys, 4 polecats each hitting permission walls can burn 400-1,200 tokens on retries before adapting. The witness sees the stall but cannot distinguish "denied" from "stuck."

### §2 Notification — discovery logger

Claude Code's binary has 567 references to the notification system — more than any other hook type. 10+ notification types (`NotificationType0..9`) form the richest event stream in the platform. We subscribe to none of them. Pass 1 of this work is **discovery only**: log every notification to a JSONL file. Pass 2 (targeted handlers per type) is explicitly deferred — we cannot design handlers until we see what arrives.

### §3 WorktreeCreate — lifecycle tracking

Our agents use `isolation: worktree`; Claude Code creates worktrees but we do not track lifecycle. After an agent crashes or a session ends abnormally, its worktree persists with uncommitted changes and a detached HEAD. Typical accumulation: 2-5 zombies per week of active multi-agent work, 50-200 MB each, 8-20 stale branches per month.

## Solution

Three independent handlers + one cleanup script. Each section is self-contained and mirrors the same scaffold: handler → settings entry → tests.

---

## §1 Permission Recovery

**File:** `.claude/hooks/permission-recovery.cjs`

Reads stdin JSON. Extracts `tool_name`, `session_id`, and a key derived from `(tool, command-prefix or file-path-prefix, first 80 chars)`. Reads `/tmp/claude-denied-${sessionId}.json`, increments the count for this key, writes the file back.

**Behavior:**

- First denial of a key: silent (count = 1, no output).
- Second denial of same key: emit `RETRY LOOP DETECTED: "<key>" has been denied N times. Do NOT retry. Find an alternative approach or ask the user for permission.`
- Append tool-specific guidance from a static lookup:

| Tool | Guidance |
|------|----------|
| `Bash` | "Shell command denied. Try: (1) use Read/Write/Grep instead, (2) check if the command needs sudo, (3) verify the path is within the sandbox." |
| `Write` | "File write denied. Check: (1) path within project directory? (2) restricted location (.env, credentials)? (3) sandbox allows this path?" |
| `Edit` | "File edit denied. Same checks as Write — path restrictions and sandbox rules." |
| `Agent` | "Agent spawn denied. Check: (1) agent spawning allowed in current mode? (2) agent limit reached? (3) agent name matches allowed pattern?" |

Emit via hook-output helper as `hookEventName: "PermissionDenied"`. Silent exit 0 on error. Source: OOPS doc 03 §7.

### settings.json

```json
{
  "PermissionDenied": [
    { "hooks": [{ "type": "command", "command": "node .claude/hooks/permission-recovery.cjs" }] }
  ]
}
```

---

## §2 Notification Logger (Discovery Pass 1)

**File:** `.claude/hooks/notification-logger.cjs`

Trivial handler — appends one JSONL line per event to `/tmp/claude-notifications-${sessionId}.jsonl`:

```json
{"ts": 1712345678901, "type": "<notification_type>", "data": {<full event>}}
```

No output. No analysis. Silent exit 0 on any error. The logger exists only so we can observe what notification types actually arrive and build targeted pass-2 handlers in a future mission.

### settings.json

```json
{
  "Notification": [
    { "hooks": [{ "type": "command", "command": "node .claude/hooks/notification-logger.cjs" }] }
  ]
}
```

**Pass 2 is out of scope.** A follow-up mission will read collected JSONL logs across 5-10 sessions, catalog the types observed, and add targeted handlers (context-warning escalation, agent-completion tracking, update-available detection).

---

## §3 Worktree Lifecycle

**File 1:** `.claude/hooks/worktree-init.cjs`

Fires on worktree creation (event name TBD — see gotcha below). Reads `session_id` and `worktree_path` (fall back to `cwd`). Appends an entry to `/tmp/claude-worktrees-${sessionId}.json`:

```json
[{ "path": "<abs>", "created": 1712345678901, "session_id": "...", "status": "active" }]
```

Silent exit 0 on error. Source: OOPS doc 03 §9.

**File 2:** `.claude/hooks/worktree-cleanup.sh`

Bash script, not a hook — invoked periodically (cron, manual run, or on SessionEnd). Walks `.claude/worktrees/*/` (or whichever directory git worktrees are registered in), skips any with uncommitted changes, removes any >24 hours old via `git worktree remove --force`.

```bash
#!/bin/bash
WORKTREE_DIR=".claude/worktrees"
MAX_AGE_HOURS=24
for wt in "$WORKTREE_DIR"/*/; do
  [ -d "$wt" ] || continue
  if git -C "$wt" status --short 2>/dev/null | grep -q '^'; then
    echo "WARN: $wt has uncommitted changes — skipping"
    continue
  fi
  if find "$wt" -maxdepth 0 -mmin +$((MAX_AGE_HOURS * 60)) 2>/dev/null | grep -q .; then
    echo "Cleaning: $wt"
    git worktree remove "$wt" --force 2>/dev/null
  fi
done
```

Must never remove a worktree with uncommitted changes. Must never `rm -rf` — only `git worktree remove`.

### settings.json

```json
{
  "WorktreeCreate": [
    { "hooks": [{ "type": "command", "command": "node .claude/hooks/worktree-init.cjs" }] }
  ]
}
```

⚠ **The event name `WorktreeCreate` is inferred from OOPS doc 04, not confirmed against a live hook catalog.** Wave 0 task 1E.3 must verify the actual event name before committing this entry. If the platform uses a different name (e.g., `SessionStart` with a `worktree_created` field), adjust accordingly.

---

## Acceptance Criteria

**Permission (§1):**
1. First denial of a key produces no output; second produces retry-loop warning + tool-specific guidance.
2. State persists in `/tmp/claude-denied-${sessionId}.json` across invocations.
3. Unreadable denial registry → handler exits 0 with empty stdout (T-SAFE-04).
4. Tests T-P-01, T-P-02, T-P-03 pass.

**Notification (§2):**
5. Every notification event appends one JSONL line with `ts`, `type`, `data`.
6. Unwritable tmpdir → handler exits 0 with empty stdout (T-SAFE-05).
7. Test T-N-01 passes.

**Worktree (§3):**
8. `worktree-init.cjs` appends registry entry on fire, preserving prior entries.
9. `worktree-cleanup.sh` preserves any worktree with uncommitted changes regardless of age.
10. Missing `session_id` → `worktree-init.cjs` exits 0 with empty stdout (T-SAFE-06).
11. Tests T-W-01, T-W-02 pass.

**All sections:**
12. `.claude/settings.json` contains all 3 new entries, commit-gate JSON validation passes.
13. Zero regression against baseline suite.

## Technical Notes

- All three handlers read stdin, parse JSON, and tolerate missing fields. Use the same safety wrapper pattern.
- The Notification logger is pure I/O and a good Haiku candidate — no branching logic, no content formatting.
- `/tmp/claude-*-${sessionId}.*` files follow the existing journal convention. Do not change the location.
- Permission key truncation to 80 chars: intentional — prevents absurdly long Bash command strings from bloating the state file. Collisions on the 81st-char are acceptable (two commands with the same 80-char prefix are functionally identical for retry-loop purposes).
- Worktree cleanup is **not** wired to any hook event. It's a standalone script the user can run manually or cron can run hourly. Installing a cron entry is out of scope.
- Pass 2 for Notifications is tracked as a follow-up, not a subtask.

---

*Component spec for Platform Alignment milestone, tracks 1C + 1D + 1E. Source: OOPS doc 03 §7 (permission), §6 (notification), §9 (worktree) at commit `254b50553`.*
