# Concrete Improvements From Architecture Analysis

**Date:** 2026-03-31

## Overview

The Claude Code v2.1.88 architecture analysis (OOPS docs 00-02) revealed specific patterns we should adopt, gaps we should fill, and alignment opportunities we should pursue. This document translates those findings into 12 concrete improvements, ordered by priority, with implementation details, effort estimates, dependency relationships, and risk assessments.

Each improvement includes: what to build, how to build it, how long it takes, what it depends on, and what happens if we do not do it.

## Priority Matrix

| # | Improvement | Priority | Effort | Dependencies | Risk if Skipped |
|---|-----------|----------|--------|-------------|----------------|
| 1 | PostCompact Hook Handler | **P0 - Critical** | 4 hours | None | Continued quality degradation in long sessions |
| 2 | FileChanged Event Handling | **P0 - Critical** | 3 hours | None | Silent stale-state bugs from external edits |
| 3 | Dead Hook Cleanup | **P0 - Critical** | 30 minutes | None | 12ms wasted overhead per tool cycle, silent failures |
| 4 | Align Effort Levels with GSD Profiles | **P1 - High** | 2 hours | None | Misaligned cost optimization; our profiles fight the platform |
| 5 | Memory Survey Pattern | **P1 - High** | 6 hours | None | 2,500 tokens wasted per session loading irrelevant memories |
| 6 | Notification Type Standardization | **P1 - High** | 4 hours | None | Missing event-driven intelligence opportunities |
| 7 | PermissionDenied Recovery | **P2 - Medium** | 3 hours | None | Agents retry denied actions, wasting context |
| 8 | Agent Type Taxonomy Alignment | **P2 - Medium** | 4 hours | #4 (effort levels) | Sub-optimal routing: complex tasks on cheap models |
| 9 | Worktree State Management | **P2 - Medium** | 6 hours | None | Abandoned worktrees, orphaned agent state |
| 10 | Context-Packet Integration | **P3 - Low** | 8 hours | #5 (memory survey) | No immediate risk; future-proofing for inter-agent context |
| 11 | Skill Lifecycle Management | **P3 - Low** | 4 hours | None | No versioning; cannot deprecate skills safely |
| 12 | Memory as Active System | **P3 - Low** | 12 hours | #5 (memory survey) | Memory remains passive; no automated consolidation |

**Total estimated effort:** 56.5 hours (approximately 7 working days)

**Recommended execution order:** 3 -> 1 -> 2 -> 4 -> 5 -> 6 -> 7 -> 8 -> 9 -> 11 -> 10 -> 12

Start with dead hook cleanup (#3) because it is the fastest win and removes noise from the system. Then PostCompact (#1) and FileChanged (#2) because they address the two highest-impact quality issues. Then the alignment improvements (#4-6) that compose with platform features. Then the medium-priority improvements (#7-9) that handle edge cases. Finally the long-term architectural improvements (#10-12) that build toward the future.

## Immediate Actions (This Week)

### 1. Add PostCompact Hook Handler

**Priority:** P0 - Critical
**Effort:** 4 hours (2 hours implementation, 1 hour testing, 1 hour integration)
**Dependencies:** None
**Blocks:** #10 (context-packet integration benefits from compaction awareness)

Claude Code compresses conversation context when approaching the context window limit. The `PostCompact` hook fires after this happens. Currently, our only PostCompact handler is `session-state.sh`, which outputs the same STATE.md snippet as SessionStart -- generic orientation, not compaction-specific recovery.

**The problem:** Compaction is the single biggest cause of quality degradation in long sessions. After compaction, the agent loses:
- Which files it was actively editing (the edit history is in the compacted conversation)
- What task it was in the middle of (the task context is compressed or dropped)
- Which tests were passing or failing (test output is compacted)
- The user's most recent instructions (if they were many turns ago)
- Working assumptions about the codebase that were established earlier in the session

Our long-running sessions -- the 360 engine runs, the HEL research buildouts, the NASA mission series -- are exactly where compaction hits. A typical autonomous session of 2+ hours will compact 2-3 times. Each compaction event degrades output quality measurably.

**Implementation:**

The solution is a PreCompact/PostCompact save/restore pair. PreCompact saves critical state before compaction; PostCompact injects it back into the conversation context after compaction.

**PreCompact handler (`pre-compact-snapshot.js`):**
```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    if (!sessionId) process.exit(0);

    const snapshotPath = path.join(os.tmpdir(), `claude-precompact-${sessionId}.json`);
    const cwd = data.cwd || process.cwd();

    // Build snapshot of critical working state
    const snapshot = {
      timestamp: Date.now(),
      session_id: sessionId,
      cwd,
      compaction_count: 0,
      git: {},
      recent_files: [],
      gsd_state: null
    };

    // Increment compaction counter from previous snapshot
    if (fs.existsSync(snapshotPath)) {
      try {
        const prev = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
        snapshot.compaction_count = (prev.compaction_count || 0) + 1;
      } catch {}
    }

    // Capture git state
    try {
      snapshot.git.branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim();
      snapshot.git.status = execSync('git status --short', { cwd, encoding: 'utf8' }).trim();
      snapshot.git.lastCommit = execSync('git log --oneline -3', { cwd, encoding: 'utf8' }).trim();
    } catch {}

    // Read GSD state (first 30 lines)
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (fs.existsSync(statePath)) {
      snapshot.gsd_state = fs.readFileSync(statePath, 'utf8').split('\n').slice(0, 30).join('\n');
    }

    // Read file journal (last 20 entries)
    const journalPath = path.join(os.tmpdir(), `claude-journal-${sessionId}.jsonl`);
    if (fs.existsSync(journalPath)) {
      const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n');
      snapshot.recent_files = lines.slice(-20).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);
    }

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));
  } catch {
    process.exit(0); // Silent failure -- never crash the session
  }
});
```

**PostCompact handler (`post-compact-recovery.js`):**
```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const sessionId = data.session_id;
    const cwd = data.cwd || process.cwd();
    const parts = [];

    // 1. Load PreCompact snapshot if available
    const snapshotPath = path.join(os.tmpdir(), `claude-precompact-${sessionId}.json`);
    let snapshot = null;
    if (fs.existsSync(snapshotPath)) {
      try { snapshot = JSON.parse(fs.readFileSync(snapshotPath, 'utf8')); } catch {}
    }

    if (snapshot) {
      parts.push(`Compaction #${snapshot.compaction_count + 1} in this session.`);
    }

    // 2. Current git state (may have changed since snapshot)
    try {
      const branch = execSync('git branch --show-current', { cwd, encoding: 'utf8' }).trim();
      const status = execSync('git status --short', { cwd, encoding: 'utf8' }).trim();
      const lastCommit = execSync('git log --oneline -3', { cwd, encoding: 'utf8' }).trim();
      parts.push(`## Git State\nBranch: ${branch}\nRecent commits:\n${lastCommit}`);
      if (status) parts.push(`Modified files:\n${status}`);
    } catch {}

    // 3. GSD project state
    const statePath = path.join(cwd, '.planning', 'STATE.md');
    if (fs.existsSync(statePath)) {
      const state = fs.readFileSync(statePath, 'utf8');
      const first30 = state.split('\n').slice(0, 30).join('\n');
      parts.push(`## GSD State\n${first30}`);
    }

    // 4. Recently modified files from journal
    const journalPath = path.join(os.tmpdir(), `claude-journal-${sessionId}.jsonl`);
    if (fs.existsSync(journalPath)) {
      const lines = fs.readFileSync(journalPath, 'utf8').trim().split('\n');
      const recent = lines.slice(-10).map(l => {
        try { const e = JSON.parse(l); return `  ${e.tool} ${e.file}`; } catch { return null; }
      }).filter(Boolean);
      if (recent.length) parts.push(`## Recent File Operations\n${recent.join('\n')}`);
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

**settings.json changes:**
```json
{
  "PreCompact": [
    {
      "hooks": [{ "type": "command", "command": "node .claude/hooks/pre-compact-snapshot.js" }]
    }
  ],
  "PostCompact": [
    {
      "hooks": [{ "type": "command", "command": "node .claude/hooks/post-compact-recovery.js" }]
    }
  ]
}
```

**What happens if we do NOT do this:** Long sessions continue to degrade after compaction. The agent loses working context every 1.5-2 hours, producing lower-quality output, repeating work, and making errors that would not occur with context preservation. For autonomous runs (360 engine, NASA missions), this is the primary quality limiter. Estimated impact: 15-25% quality reduction in sessions longer than 2 hours.

### 2. Add FileChanged Event Handling

**Priority:** P0 - Critical
**Effort:** 3 hours (1.5 hours implementation, 1 hour testing, 0.5 hours integration)
**Dependencies:** None
**Blocks:** None (but complements #1 -- external changes during compaction are invisible without this)

The `FileChanged` hook fires when files are modified outside the conversation -- by linters, formatters, the user editing in another window, git operations (checkout, merge, rebase), or build tool outputs. Currently our skills have zero awareness of external changes.

**The problem:** External file changes create a class of silent bugs:
- If the user edits a file in VS Code while Claude is working, Claude's in-memory version is stale
- If a linter reformats a file Claude just wrote, Claude's next edit may conflict with the formatted version
- If `git checkout` changes branches, every file assumption is invalidated
- If a `.planning/STATE.md` is modified by another session, GSD workflow decisions are based on stale state

**Implementation (`external-change-tracker.js`):**
```javascript
#!/usr/bin/env node
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

    // Case 1: SKILL.md changed externally
    if (filePath.endsWith('SKILL.md') && filePath.includes('.claude/skills')) {
      const skillName = path.basename(path.dirname(filePath));
      messages.push(`EXTERNAL CHANGE: Skill "${skillName}" was modified outside this session. ` +
        'If this skill is relevant to current work, re-read its SKILL.md.');
    }

    // Case 2: .planning/ files changed externally
    if (filePath.includes('.planning/')) {
      const fileName = path.basename(filePath);
      messages.push(`EXTERNAL CHANGE: GSD state file "${fileName}" was modified outside this session. ` +
        'Your cached knowledge of project state may be outdated. Re-read before making workflow decisions.');
    }

    // Case 3: settings.json changed (hook config may have changed)
    if (filePath.endsWith('settings.json') && filePath.includes('.claude')) {
      messages.push('EXTERNAL CHANGE: Hook configuration changed. New hooks may be active or existing hooks removed.');
    }

    // Case 4: CLAUDE.md changed (project instructions may have changed)
    if (filePath.endsWith('CLAUDE.md') && path.dirname(filePath) === cwd) {
      messages.push('EXTERNAL CHANGE: Project instructions (CLAUDE.md) were modified. Re-read for updated directives.');
    }

    // Case 5: Source file in active work area
    if (filePath.startsWith(path.join(cwd, 'src/')) || filePath.startsWith(path.join(cwd, 'desktop/'))) {
      messages.push(`EXTERNAL CHANGE: Source file "${path.relative(cwd, filePath)}" was modified outside this session. ` +
        'If you were editing this file, re-read it before making further changes to avoid conflicts.');
    }

    if (messages.length) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "FileChanged",
          additionalContext: messages.join('\n\n')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch {
    process.exit(0);
  }
});
```

**settings.json addition:**
```json
{
  "FileChanged": [
    {
      "hooks": [{ "type": "command", "command": "node .claude/hooks/external-change-tracker.js" }]
    }
  ]
}
```

**What happens if we do NOT do this:** Stale-state bugs continue to occur silently. The agent overwrites user edits. The agent makes decisions based on outdated `.planning/` state. The agent's in-memory model of the filesystem diverges from reality after external operations. These bugs are hard to diagnose because they manifest as "the agent did the wrong thing" rather than an explicit error. Estimated frequency: 1-3 stale-state incidents per extended session involving external edits.

### 3. Dead Hook Cleanup

**Priority:** P0 - Critical
**Effort:** 30 minutes
**Dependencies:** None
**Blocks:** None (but reduces noise for all subsequent hook work)

Our `settings.json` references hooks that do not exist on disk. These entries fail silently on every invocation, wasting approximately 3ms per process spawn per dead hook. With 4 dead hooks firing on common events (PostToolUse, SessionStart), this adds approximately 12ms of overhead per tool cycle for nothing.

**The specific dead references (identified in OOPS doc 04):**

Our current settings.json has been cleaned up from the state analyzed in doc 04, but we should verify and address any remaining issues:

1. Any hook script referenced in settings.json that does not exist in `.claude/hooks/`
2. Any duplicate entries for the same event type
3. Any hooks using ESM `import` syntax in `.js` files (should be CJS `require()` or renamed to `.mjs`)

**Implementation:**

```bash
# Audit: list all hook commands referenced in settings.json
grep -oP '"command":\s*"[^"]*"' .claude/settings.json | sort | uniq

# Cross-reference with actual files
ls .claude/hooks/

# Remove any settings.json entries that reference non-existent files
# Convert any ESM hooks to CJS
```

For each dead reference: remove the entry from settings.json. For each ESM hook: convert `import` to `require()` or rename to `.mjs`. For each duplicate: remove the redundant entry.

**What happens if we do NOT do this:** Every tool call pays a tax of wasted process spawns for hooks that fail silently. Over a long session with hundreds of tool calls, this compounds into seconds of wasted time and clutters process tables with short-lived Node.js instances that do nothing. More importantly, the dead references mask real issues -- if every SessionStart fires 6 hooks and 2 of them silently fail, we are trained to expect a 33% failure rate and may miss genuine failures in the remaining hooks.

## Short-Term Improvements (This Week to Next Week)

### 4. Align Effort Levels with GSD Profiles

**Priority:** P1 - High
**Effort:** 2 hours
**Dependencies:** None
**Blocks:** #8 (agent type taxonomy uses effort levels for routing decisions)

Claude Code has an internal effort system that controls reasoning depth and verification thoroughness. Our GSD profiles (quality/balanced/budget/inherit) serve the same purpose but are not aligned with the platform's effort semantics.

**The alignment map:**

| GSD Profile | Effort Level | Reasoning Budget | Verification | Model Selection |
|------------|-------------|-----------------|-------------|----------------|
| quality | high | Maximum reasoning depth, extended thinking | All verification steps, full test suite | Opus |
| balanced | medium | Standard reasoning, proportional thinking | Key verification, targeted tests | Sonnet |
| budget | low | Minimal reasoning, skip optional analysis | Skip optional checks, spot-check tests | Haiku |
| inherit | (parent's level) | Match the calling agent | Match the calling agent | Match parent |

**Implementation:**

Update the GSD profile system to set Claude Code's effort level alongside our own model selection:

```typescript
interface GSDProfile {
  name: 'quality' | 'balanced' | 'budget' | 'inherit';
  effort: 'high' | 'medium' | 'low';
  model: 'opus' | 'sonnet' | 'haiku';
  verification: 'full' | 'targeted' | 'spot-check';
  reasoning: 'extended' | 'standard' | 'minimal';
}

const profiles: Record<string, GSDProfile> = {
  quality:  { name: 'quality',  effort: 'high',   model: 'opus',   verification: 'full',       reasoning: 'extended' },
  balanced: { name: 'balanced', effort: 'medium', model: 'sonnet', verification: 'targeted',   reasoning: 'standard' },
  budget:   { name: 'budget',   effort: 'low',    model: 'haiku',  verification: 'spot-check', reasoning: 'minimal' },
};
```

When spawning an agent, set the effort parameter to match the profile:
```typescript
// In agent spawn logic
const profile = getActiveProfile();
const agentConfig = {
  model: profile.model,
  effort: profile.effort,  // Passed to Claude Code's effort system
  // ... other config
};
```

**What happens if we do NOT do this:** Our profiles and Claude Code's effort system work independently. A "budget" profile might spawn a Haiku agent, but the platform still applies high-effort reasoning. Or a "quality" profile on Opus might have its reasoning budget constrained by a low effort setting. The result is unpredictable cost and quality: sometimes we pay for reasoning we do not get, sometimes we get reasoning we did not pay for. Estimated waste: 10-20% of token budget misallocated due to profile/effort mismatch.

### 5. Implement Memory Survey Pattern

**Priority:** P1 - High
**Effort:** 6 hours (3 hours implementation, 2 hours testing, 1 hour memory restructuring)
**Dependencies:** None
**Blocks:** #10 (context-packet integration), #12 (active memory system)

Claude Code's `memory_survey` string suggests the platform scores memory relevance before loading content into context. Our MEMORY.md currently loads everything in the HOT section (~4,000 tokens) regardless of the current task. This is wasteful: when working on hook implementations, the NASA mission catalog details and Seattle 360 engine state are irrelevant context that consumes tokens and potentially confuses the agent.

**The problem quantified:** Our MEMORY.md HOT section contains:
- Trust system build plan (~400 tokens)
- NASA mission series state (~500 tokens)
- Seattle 360 engine state (~400 tokens)
- Key subsystems inventory (~600 tokens)
- Fox Companies standing instruction (~300 tokens)
- Standing rules (~400 tokens)
- Muse team details (~300 tokens)
- Various other entries (~1,100 tokens)

Total: approximately 4,000 tokens loaded on every session start. For a hook implementation task, perhaps 800 of those tokens are relevant (standing rules, key subsystems, tech stack). The remaining 3,200 tokens are wasted.

**Implementation:**

Add a relevance scoring step to memory loading. The scorer examines the current task context (files being worked on, commands being run, topics being discussed) and rates each memory entry.

```typescript
interface MemoryEntry {
  id: string;           // e.g., "trust-system", "nasa-missions"
  section: 'hot' | 'warm' | 'cold';
  keywords: string[];   // extracted from content
  content: string;
  tokenCount: number;
}

interface RelevanceScore {
  entryId: string;
  score: number;        // 0.0 to 1.0
  reason: string;       // why this score
}

function scoreMemoryRelevance(
  entries: MemoryEntry[],
  taskContext: { files: string[], topics: string[], commands: string[] }
): RelevanceScore[] {
  return entries.map(entry => {
    let score = 0;
    const reasons: string[] = [];

    // Keyword overlap with task context
    const contextWords = [
      ...taskContext.files.flatMap(f => f.split(/[\/\-_.]/)),
      ...taskContext.topics,
      ...taskContext.commands.flatMap(c => c.split(/\s+/))
    ].map(w => w.toLowerCase());

    const overlap = entry.keywords.filter(k => contextWords.includes(k.toLowerCase()));
    if (overlap.length > 0) {
      score += 0.3 * Math.min(overlap.length / 3, 1);
      reasons.push(`keyword overlap: ${overlap.join(', ')}`);
    }

    // Standing rules always load (they contain hard constraints)
    if (entry.id === 'standing-rules') {
      score = 1.0;
      reasons.push('standing rules: always relevant');
    }

    // Section boost: HOT entries get a base relevance boost
    if (entry.section === 'hot') score += 0.2;

    return { entryId: entry.id, score: Math.min(score, 1.0), reason: reasons.join('; ') };
  });
}
```

The loader applies a threshold (default: 0.3) and loads only entries above it:

```typescript
function loadRelevantMemories(
  entries: MemoryEntry[],
  taskContext: TaskContext,
  threshold: number = 0.3,
  tokenBudget: number = 2000
): MemoryEntry[] {
  const scores = scoreMemoryRelevance(entries, taskContext);
  const relevant = scores
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score);

  const loaded: MemoryEntry[] = [];
  let tokensUsed = 0;

  for (const score of relevant) {
    const entry = entries.find(e => e.id === score.entryId);
    if (!entry) continue;
    if (tokensUsed + entry.tokenCount > tokenBudget) break;
    loaded.push(entry);
    tokensUsed += entry.tokenCount;
  }

  return loaded;
}
```

**What happens if we do NOT do this:** Every session starts with 4,000 tokens of memory context, most of which is irrelevant to the current task. This wastes approximately $0.06 per session at Opus pricing (4K input tokens at $15/M), and more importantly, it occupies context window space that could be used for task-relevant information. Over 50 sessions, that is $3.00 in wasted tokens and hundreds of thousands of context tokens that could have been used for actual work. The waste compounds with session length: in a 3-hour session with 2 compactions, the memory is re-loaded each time, tripling the waste.

### 6. Standardize Notification Types

**Priority:** P1 - High
**Effort:** 4 hours (2 hours research/mapping, 2 hours implementation)
**Dependencies:** None
**Blocks:** None

Claude Code's binary contains 567 references to the notification system -- more than any other hook type. The 10+ notification types (`NotificationType0` through `NotificationType9`) represent a rich event model that we are entirely ignoring.

**The problem:** Each notification type is an opportunity to inject intelligence into the platform's behavior. We are currently handling 6 of 14 known hook types. The notification system alone contains more types than all other hooks combined. By not subscribing to notifications, we are blind to system-level events.

**Implementation:**

First, map the notification types by subscribing to the Notification hook and logging what we receive:

```javascript
#!/usr/bin/env node
// notification-logger.js -- Phase 1: discovery
const fs = require('fs');
const path = require('path');
const os = require('os');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const logPath = path.join(os.tmpdir(), `claude-notifications-${data.session_id}.jsonl`);
    fs.appendFileSync(logPath, JSON.stringify({
      ts: Date.now(),
      type: data.notification_type || data.type,
      data: data
    }) + '\n');
  } catch {
    process.exit(0);
  }
});
```

After collecting notification data across several sessions, build targeted handlers for the most useful types. Expected high-value notification types:

| Likely Type | Expected Content | Our Handler |
|------------|-----------------|-------------|
| Context warning | Approaching context limit | Escalate the existing context-monitor with more precise data |
| Update available | New Claude Code version | Log for session-awareness, warn if breaking changes expected |
| Agent completion | Subagent finished work | Trigger convoy progress tracking in Gastown |
| Error notification | System-level error | Log for post-session analysis |

**settings.json addition:**
```json
{
  "Notification": [
    {
      "hooks": [{ "type": "command", "command": "node .claude/hooks/notification-logger.js" }]
    }
  ]
}
```

**What happens if we do NOT do this:** We remain blind to the richest event stream in Claude Code's architecture. The 567 binary references indicate the notification system is central to internal operation. By not subscribing, we miss context warnings (relying instead on our manual context-monitor polling), agent lifecycle events (relying on filesystem observation), and system events (relying on error detection after the fact). This is like ignoring the Linux kernel's netlink socket and polling `/proc` instead -- it works, but it is slower, less reliable, and more expensive.

## Medium-Term Improvements (Next 2-4 Weeks)

### 7. PermissionDenied Recovery

**Priority:** P2 - Medium
**Effort:** 3 hours
**Dependencies:** None
**Blocks:** None

When a tool call is denied by the permission system (sandbox restriction, user rejection, allowlist miss), the `PermissionDenied` hook fires. Currently, the agent simply sees an error in the conversation and tries to adapt. A hook can provide structured guidance and prevent retry loops.

**The problem:** Permission denials are not bugs -- they are boundary signals. But agents treat them like errors and retry, sometimes repeatedly. Each retry wastes context tokens on an action that will never succeed. In a multi-agent scenario, a denied action can cascade: the polecat retries 3 times, each failure consumes context, and the witness observes the stall but cannot distinguish "denied" from "stuck."

**Implementation (`permission-recovery.js`):**
```javascript
#!/usr/bin/env node
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

    // Track denials to detect retry loops
    const denyPath = path.join(os.tmpdir(), `claude-denied-${sessionId}.json`);
    let denials = {};
    try { denials = JSON.parse(fs.readFileSync(denyPath, 'utf8')); } catch {}

    const key = `${tool}:${(data.tool_input?.command || data.tool_input?.file_path || '').slice(0, 80)}`;
    denials[key] = (denials[key] || 0) + 1;
    fs.writeFileSync(denyPath, JSON.stringify(denials));

    const parts = [];

    if (denials[key] >= 2) {
      parts.push(`RETRY LOOP DETECTED: "${key}" has been denied ${denials[key]} times. ` +
        'Do NOT retry this action. Find an alternative approach or ask the user for permission.');
    }

    // Tool-specific recovery guidance
    const guidance = {
      'Bash': 'Shell command denied. Try: (1) use Read/Write/Grep tools instead of shell commands, ' +
              '(2) check if the command needs sudo, (3) verify the path is within the sandbox.',
      'Write': 'File write denied. Check: (1) is the path within the project directory? ' +
               '(2) is the file in a restricted location (.env, credentials)? (3) does the sandbox allow this path?',
      'Edit': 'File edit denied. Same as Write -- check path restrictions and sandbox rules.',
      'Agent': 'Agent spawn denied. Check: (1) is agent spawning allowed in current mode? ' +
               '(2) has the agent limit been reached? (3) does the agent name match an allowed pattern?'
    };

    if (guidance[tool]) parts.push(guidance[tool]);

    if (parts.length) {
      const output = {
        hookSpecificOutput: {
          hookEventName: "PermissionDenied",
          additionalContext: parts.join('\n\n')
        }
      };
      process.stdout.write(JSON.stringify(output));
    }
  } catch {
    process.exit(0);
  }
});
```

**What happens if we do NOT do this:** Agents continue to retry denied actions, burning 100-300 tokens per retry on operations that will never succeed. In multi-agent scenarios, this waste compounds: 4 polecats each hitting permission walls waste 400-1,200 tokens on retries before adapting. The witness observes the stall but has no signal to distinguish "denied" from "stuck," so it sends nudges that do not help. Estimated waste: 200-500 tokens per denial event, 3-5 denial events per complex session.

### 8. Agent Type Taxonomy Alignment

**Priority:** P2 - Medium
**Effort:** 4 hours
**Dependencies:** #4 (effort levels provide the cost optimization foundation)
**Blocks:** None

Claude Code classifies agents as `agent:builtin` (platform-provided) vs `agent:custom` (user-defined). Our 34+ agent types are all "custom" from the platform's perspective, but they have dramatically different complexity requirements. A simple file-reading task should use a builtin agent with low effort; a complex orchestration task needs our custom mayor with high effort and Opus-level reasoning.

**The problem:** Without taxonomy alignment, we cannot make optimal routing decisions. Today, we route based on the task (if it needs orchestration, use a mayor; if it needs simple execution, use a polecat). But we do not express to the platform that the polecat needs less reasoning budget than the mayor. The platform treats all custom agents the same.

**Implementation:**

Tag each agent definition with performance metadata:

```yaml
# .claude/agents/gsd-executor.md frontmatter extension
---
name: gsd-executor
model: opus
isolation: worktree
effort: high
complexity: high
typical_duration: 300-600s    # 5-10 minutes
typical_tokens: 15000-30000   # input tokens per execution
extends: agent:custom         # explicit platform type mapping
---
```

Create a routing function that uses these tags:

```typescript
function selectAgent(task: Task): AgentConfig {
  if (task.complexity === 'simple' && !task.requiresOrchestration) {
    // Simple tasks: use builtin agent behavior with low effort
    return { type: 'builtin', effort: 'low', model: 'haiku' };
  }
  if (task.complexity === 'moderate' && !task.requiresOrchestration) {
    // Moderate tasks: use custom polecat with medium effort
    return { type: 'custom', agent: 'polecat-worker', effort: 'medium', model: 'sonnet' };
  }
  // Complex tasks: use custom executor or mayor with high effort
  return { type: 'custom', agent: 'gsd-executor', effort: 'high', model: 'opus' };
}
```

**What happens if we do NOT do this:** Every agent runs at the same cost tier regardless of task complexity. Simple file reads that could use Haiku at $0.25/M tokens instead use Opus at $15/M tokens -- a 60x cost difference. Across a convoy of 6 agents where 2 are doing simple work and 4 are doing complex work, misalignment wastes approximately 30% of the token budget on over-provisioned simple agents.

### 9. Worktree State Management

**Priority:** P2 - Medium
**Effort:** 6 hours (3 hours implementation, 2 hours testing, 1 hour integration with Gastown)
**Dependencies:** None
**Blocks:** None

The `worktree-state` string in Claude Code's binary suggests more sophisticated worktree lifecycle management than we currently use. Our agents use `isolation: worktree` in their frontmatter, and Claude Code creates worktrees for them, but we do not track worktree lifecycle -- creation, health, cleanup, cross-worktree communication.

**The problem:** Abandoned worktrees accumulate. After an agent crashes or a session ends abnormally, its worktree persists on disk with uncommitted changes, stale state files, and a detached HEAD. These zombie worktrees consume disk space (a typical worktree is 50-200 MB) and can cause confusion when listing branches or inspecting git state. In a project that runs multi-agent sessions regularly, we can accumulate 10-20 zombie worktrees over a week.

**Implementation:**

**WorktreeCreate hook (`worktree-init.js`):**
```javascript
#!/usr/bin/env node
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
    const worktreePath = data.worktree_path || data.cwd;

    // Register worktree in session tracking
    const registryPath = path.join(os.tmpdir(), `claude-worktrees-${sessionId}.json`);
    let registry = [];
    try { registry = JSON.parse(fs.readFileSync(registryPath, 'utf8')); } catch {}

    registry.push({
      path: worktreePath,
      created: Date.now(),
      session_id: sessionId,
      status: 'active'
    });

    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  } catch {
    process.exit(0);
  }
});
```

**Worktree cleanup script (`worktree-cleanup.sh`):**
```bash
#!/bin/bash
# Run periodically or on SessionEnd to clean up abandoned worktrees

WORKTREE_DIR=".claude/worktrees"
MAX_AGE_HOURS=24

if [ -d "$WORKTREE_DIR" ]; then
  for wt in "$WORKTREE_DIR"/*/; do
    # Check if worktree has uncommitted changes
    if git -C "$wt" status --short 2>/dev/null | grep -q '^'; then
      echo "WARN: Worktree $wt has uncommitted changes -- skipping cleanup"
      continue
    fi
    # Check age
    if find "$wt" -maxdepth 0 -mmin +$((MAX_AGE_HOURS * 60)) 2>/dev/null | grep -q .; then
      echo "Cleaning up stale worktree: $wt"
      git worktree remove "$wt" --force 2>/dev/null
    fi
  done
fi
```

**What happens if we do NOT do this:** Zombie worktrees accumulate at a rate of 2-5 per week during active multi-agent development. Over a month, this is 8-20 abandoned worktrees consuming 0.4-4 GB of disk space, each with a stale branch that clutters `git branch` output. More critically, orphaned worktrees with uncommitted changes represent lost work that could have been recovered if the worktree was properly closed.

## Architectural Insights for Long-Term

### 10. Context-Packet Integration

**Priority:** P3 - Low
**Effort:** 8 hours
**Dependencies:** #5 (memory survey provides the relevance scoring foundation)
**Blocks:** None

If the `context-packet` pattern (from gsd-build) evolves, it would dramatically improve inter-agent context passing. Currently, agents receive full prompts with all context included; a DAG-resolved context packet with token budgets would allow selective, budget-constrained context loading.

**Implementation:**

Design agent prompts to be context-packet-compatible -- structured sections that can be independently resolved and budget-constrained:

```typescript
interface ContextPacket {
  sections: ContextSection[];
  totalBudget: number;          // max tokens for the entire packet
  resolvedTokens: number;       // tokens used after resolution
}

interface ContextSection {
  id: string;                   // e.g., "project-state", "task-definition", "memory"
  priority: number;             // higher = loaded first
  content: string;
  tokenCount: number;
  dependencies: string[];       // sections that must load before this one
  optional: boolean;            // can be dropped if budget exceeded
}

function resolveContextPacket(sections: ContextSection[], budget: number): ContextPacket {
  // Topological sort by dependencies
  const sorted = topologicalSort(sections);
  const loaded: ContextSection[] = [];
  let used = 0;

  for (const section of sorted) {
    if (used + section.tokenCount > budget && section.optional) continue;
    loaded.push(section);
    used += section.tokenCount;
  }

  return { sections: loaded, totalBudget: budget, resolvedTokens: used };
}
```

**What happens if we do NOT do this:** No immediate risk. This is future-proofing for a pattern that may or may not become platform-supported. Current agent context passing works; it is just less efficient than it could be. The memory survey (#5) provides most of the benefit for single-agent scenarios. Context packets would primarily help in multi-agent scenarios where agents pass context between each other.

### 11. Skill Lifecycle Management

**Priority:** P3 - Low
**Effort:** 4 hours
**Dependencies:** None
**Blocks:** None

The binary references `skills-2025-10-02`, suggesting skills have versioned activation dates. This implies a lifecycle: created -> active -> deprecated -> removed.

**Implementation:**

Add lifecycle fields to skill frontmatter:

```yaml
---
name: gupp-propulsion
description: Interrupt controller for proactive agent execution
version: 1.2.0
created: 2026-02-15
status: active              # active | deprecated | experimental
deprecated_by: null         # replacement skill name, if deprecated
min_platform_version: 2.1.0 # minimum Claude Code version
---
```

Add a skill inventory command that reports lifecycle status:

```bash
# gsd skill-inventory
# Output:
# Active (32): gupp-propulsion@1.2.0, runtime-hal@1.1.0, ...
# Deprecated (1): old-dispatch@0.9.0 (replaced by sling-dispatch@1.0.0)
# Experimental (1): context-packet@0.1.0
```

**What happens if we do NOT do this:** Skills accumulate without versioning or lifecycle management. We cannot safely deprecate a skill because nothing tracks which other skills or agents depend on it. We cannot safely upgrade because there is no version to compare against. With 34 skills, this is manageable through human memory. At 50+ skills, it becomes a maintenance burden.

### 12. Memory as a First-Class Active System

**Priority:** P3 - Low
**Effort:** 12 hours (6 hours design, 4 hours implementation, 2 hours testing)
**Dependencies:** #5 (memory survey provides the scoring foundation for active operations)
**Blocks:** None

Claude Code's source reveals memory as a sophisticated subsystem: `memory-command`, `memory-select`, `memory_survey`, `memory_files_completed`, `memory_files_started`, `memory_saved`. These strings indicate memory is not just a file -- it is an active system that tracks access patterns, scores relevance, manages lifecycle, and consolidates knowledge.

Our MEMORY.md is well-structured but passive. It is a file that the session-start hook loads. It does not track which memories are accessed during a session, it does not score relevance dynamically, it does not consolidate observations into structured knowledge, and it does not prune stale entries.

**Implementation (phased):**

**Phase A: Access tracking**
Track which memory entries are referenced during a session. After SessionEnd, write access counts to a metadata file. Entries that are never accessed across 10+ sessions are candidates for demotion from HOT to WARM, or WARM to COLD.

**Phase B: Dynamic relevance**
Combine the memory survey (#5) with access tracking to score memories by both content relevance and historical access frequency. A memory that is content-relevant AND frequently accessed gets the highest score. A memory that is content-relevant but never accessed may have poor keywords (update the keywords). A memory that is frequently accessed but not content-relevant may be too broadly tagged.

**Phase C: Consolidation (inspired by KAIROS autoDream)**
At the end of each session, run a consolidation pass:
1. Merge observations that say the same thing in different words
2. Remove contradictions (newer overrides older)
3. Convert raw observations ("we did X in session Y") into structured facts ("X is the established pattern")
4. Promote frequently-referenced WARM entries to HOT
5. Demote never-referenced HOT entries to WARM

This is the most ambitious improvement on the list. It moves our memory system from a static document toward an active knowledge base that improves with every session.

**What happens if we do NOT do this:** Memory remains a static document that grows monotonically. Every new project, decision, and pattern gets added to MEMORY.md, and nothing gets removed or consolidated. The token cost of memory loading increases linearly with project history. At our current rate of memory accumulation, MEMORY.md will double in size within 6 months, from ~4,000 tokens to ~8,000 tokens. Without relevance scoring (#5) or consolidation (#12), this means every session pays an increasing tax for loading an increasingly irrelevant memory corpus.

## Dependency Graph

```
#3 (Dead Cleanup)     #1 (PostCompact)     #2 (FileChanged)
         |                     |                    |
         v                     v                    v
#4 (Effort Levels)    #5 (Memory Survey)   #6 (Notifications)
         |                     |
         v                     v
#8 (Agent Taxonomy)   #10 (Context Packet)
                               |
                               v
                      #12 (Active Memory)

#7 (PermissionDenied)  -- independent
#9 (Worktree State)    -- independent
#11 (Skill Lifecycle)  -- independent
```

The critical path is: **3 -> 1 -> 5 -> 12** (cleanup -> compaction recovery -> memory scoring -> active memory). Each step builds on the previous: you cannot score memory relevance without loading memory efficiently, you cannot consolidate memory without scoring it, and you cannot trust any of it without cleaning up the noise first.

The secondary path is: **4 -> 8** (effort alignment -> agent routing). These are smaller improvements that compose well: once you know the effort level, you can make better agent selection decisions.

The independent improvements (7, 9, 11) can be done in any order, at any time, without blocking or being blocked by the critical path.

## What This All Means

The architecture analysis reveals that gsd-skill-creator and Claude Code are evolving in the same direction. The platform is building more sophisticated skills, agents, teams, memory, and orchestration -- exactly the features we have been extending. The 12 improvements in this document are not speculative enhancements -- they are concrete responses to specific gaps identified through source-level analysis of the platform we build on.

Our strategy remains: **stay one step ahead on the patterns, and align immediately when the platform catches up.**

This means:
- Continue innovating where the platform has gaps (GUPP, DACP, trust, chipsets, convoy)
- Build innovations as extensions of platform features, not replacements
- When the platform ships a feature we have built (teams, effort levels), adapt our implementation to use theirs as the foundation
- Share our patterns back (Skills-and-Agents project) so the ecosystem benefits
- Execute the improvements in priority order, starting with the P0 items that address real quality issues today

The code release did not create a threat -- it confirmed that our direction is right and gave us a specific list of things to improve. Now we execute.
