# Hook System Deep Dive: Claude Code v2.1.88

**Date:** 2026-03-31
**Binary analyzed:** `/home/foxy/.local/share/claude/versions/2.1.88` (228MB)
**Method:** Binary string extraction, settings.json analysis, running hook source review

## The Complete Hook Taxonomy

Claude Code v2.1.88 exposes 13 hook event types. Binary reference counts indicate their relative importance in the codebase (higher count = more internal handling logic):

| Hook Event | Binary Refs | Our Usage | Status |
|---|---|---|---|
| PreToolUse | 150 | validate-commit, build-check, prompt-guard, workflow-guard | Heavy |
| PostToolUse | 233 | context-monitor, heartbeat, phase-boundary | Heavy |
| SessionStart | 105 | check-update, restore-state, inject-snapshot, session-state, heartbeat-start | Heavy |
| SessionEnd | 56 | save-work-state, snapshot-session | Good |
| PostCompact | 79 | session-state (minimal) | Underused |
| PreCompact | 54 | None | Missing |
| FileChanged | 61 | None | Missing |
| PermissionDenied | 57 | None | Missing |
| Notification | 567 | None | Missing |
| TaskCompleted | 48 | task-completed-gate | Good |
| TeammateIdle | 48 | teammate-idle-gate | Good |
| WorktreeCreate | 90 | None | Missing |
| PostToolUseFailure | (low) | None | Missing |
| Stop | (low) | None | Missing |

We actively use 6 of 14 hook types. Five are completely missing from our implementation. That is the gap this document addresses.

## Hook-by-Hook Analysis

### 1. PreToolUse (150 refs)

**What it does:** Fires before any tool call executes. Can block execution (exit code 2) or inject advisory context. Receives the tool name and full tool input as JSON on stdin.

**Data received:**
```json
{
  "hook_event_name": "PreToolUse",
  "session_id": "abc123",
  "tool_name": "Bash",
  "tool_input": { "command": "git commit -m \"feat: something\"" },
  "cwd": "/path/to/project"
}
```

**Our current usage:** Four hooks on this event:
- `validate-commit.sh` -- blocks non-Conventional-Commits messages (matcher: `Bash`, if: `Bash(git commit*)`)
- `build-check.sh` -- runs `tsc --noEmit` before commit/push (matcher: `Bash`, if: `Bash(npm run build*)`)
- `gsd-prompt-guard.js` -- scans Write/Edit to `.planning/` for prompt injection patterns (matcher: `Write|Edit`)
- `gsd-workflow-guard.js` -- warns when editing files outside GSD workflow (matcher: `Write|Edit`)

**Assessment:** This is our strongest hook category. The `if` condition pattern (`"if": "Bash(git commit*)"`) is powerful -- it lets us target specific commands without running the full hook script for every Bash call.

**Improvements:**
1. **Add `if` conditions to prompt-guard and workflow-guard.** Currently these run on every Write/Edit, but prompt-guard only cares about `.planning/` files. Adding `"if": "Write(.planning/*)"` would skip the Node.js process spawn for all other writes. At ~3ms per spawn, this adds up in sessions with hundreds of file operations.

2. **Consolidate the two commit validators.** We have both `validate-commit.sh` and `gsd-validate-commit.sh` in settings.json (lines 76 and 104). The second one references a file that does not exist in the hooks directory, which means it silently fails every time. Remove the dead entry.

3. **Add a `npm test` gate.** The build-check blocks on TypeScript errors but not test failures. A PreToolUse hook on `Bash(git push*)` that runs `npm test` would catch regressions before they hit the remote.

```json
{
  "matcher": "Bash",
  "if": "Bash(git push*)",
  "hooks": [{
    "type": "command",
    "command": "bash .claude/hooks/test-gate.sh",
    "timeout": 120
  }]
}
```

### 2. PostToolUse (233 refs)

**What it does:** Fires after a tool call completes. Cannot block (the tool already ran). Can inject context for the agent to see. Receives tool name, input, and output.

**Data received:**
```json
{
  "hook_event_name": "PostToolUse",
  "session_id": "abc123",
  "tool_name": "Write",
  "tool_input": { "file_path": "/path/to/file.ts", "content": "..." },
  "tool_output": "File written successfully",
  "cwd": "/path/to/project"
}
```

**Our current usage:** Three hooks with matcher `Bash|Edit|Write|MultiEdit|Agent|Task`:
- `gsd-context-monitor.js` -- reads context metrics from the statusline bridge file and injects warnings at 35% and 25% remaining
- `agent-heartbeat.js` -- writes a timestamp to `/tmp/claude-heartbeat-{session_id}.json` on every tool call
- `phase-boundary-check.sh` / `gsd-phase-boundary.sh` -- checks if a write touches phase boundary files

**Assessment:** The context monitor is well-engineered with debouncing (5 calls between warnings) and severity escalation (WARNING to CRITICAL bypasses debounce). The heartbeat system is elegant -- the PostToolUse hook writes signals, a background watcher process polls them.

**Improvements:**
1. **Add a test-result tracker.** After any `Bash(npm test*)` completes, record pass/fail count to a session file. The statusline could then show test state: `Tests: 21298/21298`. More importantly, context warnings could reference the last test state -- "context is low but all tests pass" versus "context is low and 3 tests are failing."

2. **Track file modification patterns.** After Write/Edit, log which files were modified in a session-scoped journal. This enables: (a) better SUMMARY.md generation (we know exactly what changed), (b) conflict detection (two agents editing the same file), (c) rollback support (we know what to `git checkout`).

```javascript
// PostToolUse hook: file-journal.js
const journal = path.join(os.tmpdir(), `claude-journal-${sessionId}.jsonl`);
if (['Write', 'Edit', 'MultiEdit'].includes(data.tool_name)) {
  const entry = {
    ts: Date.now(),
    file: data.tool_input?.file_path,
    tool: data.tool_name,
    success: !data.tool_output?.includes('error')
  };
  fs.appendFileSync(journal, JSON.stringify(entry) + '\n');
}
```

### 3. PostToolUseFailure (new in recent versions)

**What it does:** Fires when a tool call fails (throws an error, times out, or returns an error result). Distinct from PostToolUse, which fires on success.

**Data received:** Same shape as PostToolUse, but the `tool_output` contains the error. May include an `error` or `is_error` field.

**Our current usage:** None.

**Why this matters:** Tool failures are information-rich events. A Bash command that fails tells us something about the environment. A Write that fails tells us about permissions. Currently, the agent sees the error in the conversation, but our hooks do not react.

**Proposed implementation:**
```javascript
// PostToolUseFailure: failure-tracker.js
// Track repeated failures to detect stuck loops
const failPath = path.join(os.tmpdir(), `claude-fails-${sessionId}.json`);
let fails = {};
try { fails = JSON.parse(fs.readFileSync(failPath, 'utf8')); } catch {}

const key = `${data.tool_name}:${data.tool_input?.command?.slice(0, 50) || data.tool_input?.file_path || 'unknown'}`;
fails[key] = (fails[key] || 0) + 1;
fs.writeFileSync(failPath, JSON.stringify(fails));

if (fails[key] >= 3) {
  output.hookSpecificOutput = {
    hookEventName: "PostToolUseFailure",
    additionalContext: `REPEATED FAILURE: "${key}" has failed ${fails[key]} times. ` +
      'This may indicate a systemic issue. Consider an alternative approach.'
  };
}
```

### 4. SessionStart (105 refs)

**What it does:** Fires once when a new session begins. Output becomes part of the initial conversation context. Multiple hooks run sequentially.

**Our current usage:** Six hooks -- the most of any event:
- `gsd-check-update.js` -- spawns a background npm version check
- `gsd-restore-work-state.js` -- loads previous session state via skill-creator CLI
- `gsd-inject-snapshot.js` -- injects the latest session snapshot for narrative continuity
- `session-state.sh` -- outputs STATE.md head for orientation
- `agent-heartbeat-start.js` -- spawns the background heartbeat watcher
- `gsd-session-state.sh` -- references a script that does not exist in the hooks directory

**Assessment:** Two issues. First, `gsd-inject-snapshot.js` and `gsd-restore-work-state.js` use ESM `import` syntax but have a `.js` extension and no `"type": "module"` in package.json. They would fail in a standard Node.js environment. They likely depend on `npx skill-creator` existing and working, which silently fails if the CLI is not installed. Second, `gsd-session-state.sh` is referenced but does not exist -- dead entry.

**Improvements:**
1. **Remove dead hooks.** Delete the `gsd-session-state.sh` entry from settings.json. Clean up `gsd-validate-commit.sh` while we're at it.
2. **Convert ESM hooks to CJS.** The `gsd-inject-snapshot.js`, `gsd-restore-work-state.js`, `gsd-save-work-state.js`, and `gsd-snapshot-session.js` all use `import` syntax. Convert to `require()` for consistency with the rest of the hooks and reliable execution.
3. **Add a session-duration estimator.** On SessionStart, check the calendar and time of day. If it is late at night, inject a gentle "long session" advisory that encourages more frequent commits. This prevents the 3am context-exhaustion scenario.

### 5. SessionEnd (56 refs)

**What it does:** Fires when a session ends (user exits, `/exit`, timeout). Last chance to persist state. Output is not shown to the agent (session is over).

**Our current usage:**
- `gsd-save-work-state.js` -- saves active task and checkpoint
- `gsd-snapshot-session.js` -- generates a session summary from the transcript

**Assessment:** Solid. The snapshot generator reads the transcript path from stdin, which is the right approach. One concern: both hooks call out to `npx skill-creator`, which may not be installed, and they use ESM imports.

**Improvements:**
1. **Add heartbeat cleanup.** When the session ends, remove `/tmp/claude-heartbeat-{session_id}.json` and kill the watcher process. Currently the watcher self-terminates when the heartbeat file disappears, but the file persists until the next reboot. Add explicit cleanup.
2. **Write a git-stash checkpoint.** If there are uncommitted changes at SessionEnd, automatically `git stash` them with a descriptive message. This prevents lost work when a session dies unexpectedly.

### 6. PostCompact (79 refs) -- KEY GAP

**What it does:** Fires after Claude Code compresses the conversation to reclaim context window space. This is the moment where the agent loses working memory -- older messages are summarized or dropped.

**Data received:** The session context, possibly including a summary of what was compacted.

**Our current usage:** Only `session-state.sh`, which outputs STATE.md. This is the same script used for SessionStart -- it provides orientation but does not address the compaction-specific problem.

**Why this is critical:** Compaction is the single biggest cause of quality degradation in long sessions. After compaction, the agent forgets:
- Which files it was actively editing
- What task it was in the middle of
- Which tests were passing/failing
- The user's most recent instructions

**Proposed implementation:**
```javascript
#!/usr/bin/env node
// PostCompact: context-recovery.js
// Reconstructs critical working state after context compaction

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();
    const parts = [];

    // 1. Current git state (what branch, what's modified)
    try {
      const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim();
      const status = execSync('git status --short', { cwd, encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log --oneline -1', { cwd, encoding: 'utf8' }).trim();
      parts.push(`## Git State\nBranch: ${branch}\nLast commit: ${lastCommit}`);
      if (status) parts.push(`Modified files:\n${status}`);
    } catch {}

    // 2. GSD project state
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (fs.existsSync(statePath)) {
      const state = fs.readFileSync(statePath, 'utf8');
      const first30 = state.split('\n').slice(0, 30).join('\n');
      parts.push(`## GSD State\n${first30}`);
    }

    // 3. Recently modified files from journal
    const journalPath = path.join(require('os').tmpdir(),
      `claude-journal-${data.session_id}.jsonl`);
    if (fs.existsSync(journalPath)) {
      const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n');
      const recent = lines.slice(-10).map(l => {
        try { const e = JSON.parse(l); return e.file; } catch { return null; }
      }).filter(Boolean);
      if (recent.length) parts.push(`## Recent Files\n${recent.join('\n')}`);
    }

    if (parts.length) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "PostCompact",
          additionalContext: "CONTEXT RECOVERY (post-compaction):\n\n" + parts.join('\n\n')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch {
    process.exit(0);
  }
});
```

### 7. PreCompact (54 refs) -- NEW DISCOVERY

**What it does:** Fires before compaction occurs. This is the moment to save state before the context is compressed. This hook was not in our known list.

**Our current usage:** None.

**Why this matters:** PreCompact + PostCompact form a save/restore pair. PreCompact is the save checkpoint; PostCompact is the restore point. Without PreCompact, PostCompact can only reconstruct from external sources (git, filesystem). With PreCompact, we can write a precise snapshot of the agent's working state before it gets compacted away.

**Proposed implementation:**
```javascript
#!/usr/bin/env node
// PreCompact: pre-compact-snapshot.js
// Saves working state before context compaction

const fs = require('fs');
const path = require('path');
const os = require('os');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    if (!sessionId) process.exit(0);

    const snapshotPath = path.join(os.tmpdir(),
      `claude-precompact-${sessionId}.json`);

    // Save what we know about the session right now
    const snapshot = {
      timestamp: Date.now(),
      session_id: sessionId,
      cwd: data.cwd,
      // Read the file journal if it exists
      recent_files: [],
      compaction_count: 0
    };

    // Increment compaction counter
    if (fs.existsSync(snapshotPath)) {
      try {
        const prev = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        snapshot.compaction_count = (prev.compaction_count || 0) + 1;
      } catch {}
    }

    // Read file journal
    const journalPath = path.join(os.tmpdir(),
      `claude-journal-${sessionId}.jsonl`);
    if (fs.existsSync(journalPath)) {
      const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n');
      snapshot.recent_files = lines.slice(-20).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);
    }

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  } catch {
    process.exit(0);
  }
});
```

### 8. FileChanged (61 refs) -- KEY GAP

**What it does:** Fires when a file on disk changes outside of Claude Code's own tool calls. This catches: linter auto-fixes, `prettier --write`, user edits in another editor, git operations (checkout, merge, rebase), build tool outputs.

**Data received:** Likely includes the file path that changed and possibly the change type (created, modified, deleted).

**Our current usage:** None.

**Why this matters:** External file changes are invisible to the agent. If Foxy edits a file in VS Code while Claude is working, Claude does not know. If a linter reformats a file Claude just wrote, Claude's in-memory version is now stale. If `git checkout` swaps branches, every file assumption is invalid.

**Proposed implementation:**
```javascript
#!/usr/bin/env node
// FileChanged: external-change-tracker.js
// Reacts to files modified outside Claude Code

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const filePath = data.file_path || data.tool_input?.file_path || '';
    const cwd = data.cwd || process.cwd();

    const messages = [];

    // Case 1: SKILL.md changed -- skills need re-reading
    if (filePath.endsWith('SKILL.md')) {
      messages.push(`Skill file changed externally: ${path.basename(path.dirname(filePath))}. ` +
        'Re-read if this skill is relevant to current work.');
    }

    // Case 2: .planning/ file changed -- GSD state may be stale
    if (filePath.includes('.planning/')) {
      messages.push(`GSD state file changed externally: ${path.basename(filePath)}. ` +
        'Your cached knowledge of project state may be outdated. Re-read before making decisions.');
    }

    // Case 3: Source file we recently modified
    // (check against journal if available)

    // Case 4: settings.json changed -- hook config may have changed
    if (filePath.endsWith('settings.json') && filePath.includes('.claude')) {
      messages.push('Hook configuration changed. New hooks may be active.');
    }

    if (messages.length) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "FileChanged",
          additionalContext: messages.join('\n')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch {
    process.exit(0);
  }
});
```

### 9. PermissionDenied (57 refs) -- KEY GAP

**What it does:** Fires when a tool call is denied by the permission system (sandbox, allowlist, user rejection). The tool does not execute.

**Data received:** The tool name, input that was denied, and the denial reason.

**Our current usage:** None.

**Why this matters:** Permission denials are not bugs -- they are boundary signals. When an agent hits a permission wall, it needs to adapt its strategy, not retry the same action. Currently, the agent sees the denial in the conversation and figures it out. A hook can provide structured guidance.

**Proposed implementation:**
```javascript
#!/usr/bin/env node
// PermissionDenied: graceful-fallback.js
// Provides alternative strategies when tool calls are denied

const fs = require('fs');
const path = require('path');
const os = require('os');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const tool = data.tool_name;
    const sessionId = data.session_id;

    // Track denials to avoid retry loops
    const denyPath = path.join(os.tmpdir(), `claude-denied-${sessionId}.json`);
    let denials = {};
    try { denials = JSON.parse(fs.readFileSync(denyPath, 'utf8')); } catch {}

    const key = `${tool}:${data.tool_input?.command?.slice(0, 60) || data.tool_input?.file_path || ''}`;
    denials[key] = (denials[key] || 0) + 1;
    fs.writeFileSync(denyPath, JSON.stringify(denials));

    let advice = '';
    if (denials[key] >= 2) {
      advice = `This action has been denied ${denials[key]} times. Do not retry -- find an alternative approach. `;
    }

    // Tool-specific guidance
    if (tool === 'Bash') {
      advice += 'If a shell command was denied, try using a more specific tool (Read, Write, Grep) instead of Bash.';
    } else if (tool === 'Write' || tool === 'Edit') {
      advice += 'If a file write was denied, check if the path is in a restricted directory or if the file is read-only.';
    }

    if (advice) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "PermissionDenied",
          additionalContext: advice
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch {
    process.exit(0);
  }
});
```

### 10. WorktreeCreate (90 refs)

**What it does:** Fires when a new git worktree is created for agent isolation. This is the foundation of multi-agent parallel execution -- each agent gets its own worktree so they do not step on each other's files.

**Our current usage:** None.

**Why this matters:** WorktreeCreate has 90 binary references -- more than SessionEnd (56) or PermissionDenied (57). This is a heavily used event internally. Our multi-agent patterns (Gastown convoy, 4-agent parallel synthesis) create worktrees but have no hook logic around the creation event.

**Proposed use:** Initialize agent workspace on worktree creation -- copy `.planning/STATE.md` snapshot, set up the file journal, configure agent-specific settings.

### 11. TaskCompleted and TeammateIdle (48 refs each)

**What they do:** `TaskCompleted` fires when an agent completes a task. `TeammateIdle` fires when a teammate (agent in a team) goes idle. Both can block (exit 2) with feedback sent to the agent.

**Our current usage:**
- `task-completed-gate.sh` -- gates APT team tasks: verifies PLAN.md exists for planning tasks, tests pass for execution tasks
- `teammate-idle-gate.sh` -- gates APT teammates: blocks idle if uncommitted src/ changes exist

**Assessment:** These are well-targeted but narrow (only APT team). The pattern is sound.

**Improvements:** Extend to GSD executor agents. A TaskCompleted gate could verify that SUMMARY.md exists before allowing a phase to complete. A TeammateIdle gate could ensure all file changes are committed.

### 12. Notification (567 refs)

**What it does:** Internal notification system with 10+ subtypes (NotificationType0 through NotificationType9). These appear to be the mechanism for system-level messages: update available, context warning, error notification, completion notification.

**Our current usage:** None directly, though our hooks produce notifications indirectly via `additionalContext`.

**This is the highest-reference hook in the binary** -- 567 occurrences. The internal notification system is clearly central to Claude Code's architecture. We should investigate what each NotificationType does and whether we can subscribe to specific types.

### 13. Stop (low refs, but significant)

**What it does:** Fires when the agent is about to stop (session end, user interrupt, context exhaustion). The binary contains `Stop hook prevented continuation`, `Stop hook blocking error`, and `Stop hook feedback` -- indicating this hook can both block stopping and inject feedback.

**Our current usage:** None.

**Potential use:** A Stop hook could save emergency state -- dump current task progress, uncommitted changes summary, and a one-line "where I was" to a recovery file. This is the ejection seat.

## Evaluation of Current Hook Quality

### Strengths

1. **Silent failure pattern.** Every hook uses `try/catch` with `process.exit(0)` fallback. No hook can crash the session. This is correct.

2. **Stdin timeout guards.** The JS hooks (`gsd-context-monitor.js`, `gsd-prompt-guard.js`, etc.) include `setTimeout(() => process.exit(0), N)` guards against stdin hanging. This prevents hooks from blocking the session on pipe issues.

3. **Atomic writes.** The heartbeat system uses `writeFileSync(tmpPath) + renameSync(tmpPath, realPath)` -- proper atomic file operations to prevent corrupt reads from the watcher.

4. **Debouncing.** The context monitor tracks calls between warnings and supports severity escalation. This prevents warning spam while ensuring critical alerts are not missed.

### Issues

1. **Dead references.** Four entries in settings.json reference non-existent files:
   - `gsd-session-state.sh` (SessionStart, line 49) -- does not exist
   - `gsd-validate-commit.sh` (PreToolUse, line 109) -- does not exist
   - `phase-boundary-check.sh` (PostToolUse, line 168) -- does not exist
   - `gsd-phase-boundary.sh` (PostToolUse, line 178) -- does not exist
   These fail silently on every invocation, adding ~3ms of wasted process spawn time each. Four dead hooks firing on common events means ~12ms of overhead on every Write/Edit/Bash cycle for nothing.

2. **ESM/CJS mismatch.** Four hooks use `import` (ESM) syntax: `gsd-inject-snapshot.js`, `gsd-restore-work-state.js`, `gsd-save-work-state.js`, `gsd-snapshot-session.js`. The rest use `require()` (CJS). Since there is no `"type": "module"` in package.json, the ESM hooks would fail in standard Node.js unless they are being run through a loader. These need to be CJS or renamed to `.mjs`.

3. **Redundant SessionStart hooks.** Six hooks on SessionStart is excessive. `session-state.sh` outputs STATE.md head, and `gsd-inject-snapshot.js` injects the latest session snapshot, and `gsd-restore-work-state.js` loads previous state. These overlap. Consolidate into a single hook that performs all three operations in one Node.js process, saving two process spawns.

4. **Missing `if` conditions.** The prompt-guard and workflow-guard hooks run on every Write/Edit, but they immediately check the file path and exit for non-matching files. Adding `if` conditions to settings.json would let Claude Code skip the process spawn entirely for non-matching operations.

5. **No PostCompact strategy.** Our single PostCompact hook (`session-state.sh`) outputs the same STATE.md snippet as SessionStart. After compaction, the agent needs specifically: (a) what it was doing, (b) which files it was editing, (c) what the user last asked. Generic state output is not enough.

## Priority Implementation Order

Based on impact and effort:

1. **Clean up dead references** -- 10 minutes. Remove `gsd-session-state.sh`, `gsd-validate-commit.sh`, `phase-boundary-check.sh`, and `gsd-phase-boundary.sh` from settings.json.

2. **PostCompact context recovery** -- 2 hours. Implement the save/restore pair using PreCompact and PostCompact. This directly addresses the biggest quality issue in long sessions.

3. **FileChanged handler** -- 1 hour. External change detection prevents stale-state bugs. Start with `.planning/` and `SKILL.md` monitoring.

4. **PermissionDenied fallback** -- 1 hour. Denial tracking prevents retry loops, which waste context on actions that will never succeed.

5. **PostToolUseFailure tracker** -- 1 hour. Failure pattern detection catches stuck agents before they burn through context.

6. **WorktreeCreate initializer** -- 2 hours. Proper workspace setup for multi-agent execution.

7. **Consolidate SessionStart** -- 2 hours. Merge 6 hooks into 2-3 well-structured ones.

## The Hook Output Contract

Every hook communicates through a single protocol. The hook receives JSON on stdin and writes JSON to stdout:

**Advisory output** (inject context, do not block):
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Message the agent will see"
  }
}
```

**Blocking output** (PreToolUse only, exit code 2):
```json
{
  "decision": "block",
  "reason": "Why the tool call was blocked"
}
```

**Silent pass** (no output, exit code 0): The hook ran, found nothing to report, and exited cleanly.

This contract is simple and well-designed. The `additionalContext` field is the primary mechanism for hooks to influence agent behavior without taking control. The `decision: "block"` mechanism is reserved for hard gates where the agent must not proceed.

## Conclusion

Our hook implementation is strong where it exists but has significant blind spots. The five missing hook types (PreCompact, FileChanged, PermissionDenied, WorktreeCreate, PostToolUseFailure) represent reactive intelligence that we are leaving on the table. PostCompact alone would dramatically improve our long-session quality -- the context recovery pattern is the single highest-impact improvement available.

The cleanup items (dead references, ESM/CJS mismatch, missing `if` conditions) are low-effort, high-value fixes that should happen immediately. They reduce wasted process spawns and eliminate silent failures.

The discovery of PreCompact as a distinct hook from PostCompact changes our approach to context preservation. Instead of reconstructing state after compaction (reactive), we can snapshot state before compaction (proactive). The PreCompact/PostCompact pair is the save/load pattern for agent memory.
