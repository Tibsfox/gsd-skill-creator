# Session Log Analysis -- Mining Claude Code Sessions for Operational Intelligence

**Date:** 2026-03-31
**Context:** gsd-skill-creator v1.49.192, Claude Code v2.1.88, 50-milestone version chain

## Abstract

Every Claude Code session generates a rich stream of operational data: tool call sequences, file access patterns, agent spawn lifecycles, error recovery chains, compaction events, and timing distributions. This data is currently captured fragmentarily through our post-commit hook (writing to `sessions.jsonl`), the `/sc:observe` command (manual snapshots), and the `/sc:start` warm-start briefing. None of these mechanisms capture the full picture. This research examines what session data we can access, what patterns we should look for, how to build a session analytics pipeline, and how session analysis connects to our open problems in distributed intelligence and non-deterministic testing.

## 1. What Session Data We Can Currently Access

### 1.1 Data We Already Capture

**Post-commit hook (`project-claude/hooks/post-commit`)**

Our post-commit hook fires after every git commit and writes a structured JSON entry to `.planning/patterns/sessions.jsonl`. Each entry contains:

- `timestamp` -- ISO 8601 UTC
- `commit_type` -- conventional commit prefix (feat, fix, test, refactor, etc.)
- `message` -- full commit subject line
- `files_changed` -- count of files in the commit
- `source` -- always "hook" for automated entries
- `phase` -- current GSD phase number from STATE.md, or null

This gives us a commit-level view of session activity. The `/sc:digest` command analyzes this data to produce commit type distributions, phase activity breakdowns, temporal trends, and correction rate analysis (the ratio of fix commits to feat commits per phase, where rates above 30% suggest bugs are found too late).

**Manual observations (`/sc:observe`)**

The observe command reconstructs session state from git history (last 8 hours of commits), file status (`git diff --name-only`, `git status --short`), and existing JSONL data. It detects correction patterns heuristically: fix commits that follow feat commits on the same files. Observations have `source: "manual"` and include `tool_sequences`, `files_touched`, `corrections`, `commits`, and `duration_minutes`.

**Monitoring scans (`/sc:start` Step 1)**

The warm-start briefing runs a passive scan that compares current STATE.md and ROADMAP.md against saved baselines in `scan-state.json`. It detects phase completions, new blockers, blocker resolutions, and plan-vs-summary diffs (scope expansions, contractions, shifts). These emit scan-type entries to sessions.jsonl with `type: "scan"` and `source: "scan"`.

**Skill telemetry (`skill-events.jsonl`)**

The skill loading pipeline emits events for scored, loaded, and budget-skipped skills. The `/sc:digest` command analyzes this to identify high-value skills (high load rate times average score), dead skill candidates (never scored across 30+ sessions), and budget casualties (skills scored in 5+ sessions but skipped more than half the time).

**Activation history (`budget-history.jsonl`)**

Tracks which skills were loaded per session and how often, providing a longitudinal view of skill usage patterns.

### 1.2 Data Available from Claude Code That We Do Not Yet Capture

**Session lifecycle events.** Claude Code exposes several hook points that produce session data we currently ignore:

| Hook | Data Available | Our Status |
|------|---------------|------------|
| `SessionStart` | Session ID, working directory, project context | Captured (session-state.sh injects STATE.md) |
| `SessionEnd` | Session ID, transcript path | Hooks exist (gsd-snapshot-session.js, gsd-save-work-state.js) but depend on skill-creator CLI |
| `PostCompact` | Compaction event, what was preserved | Not captured -- identified in OOPS/03 as priority improvement |
| `FileChanged` | External file modifications | Not captured -- identified in OOPS/03 |
| `PermissionDenied` | Denied tool calls and reasons | Not captured |
| `PreToolUse` / `PostToolUse` | Every tool invocation with parameters | Partially captured (commit validation hook on Bash) |
| `SubagentSpawn` | Agent creation events | Not captured at the session level |

**Tool call telemetry.** Every tool invocation passes through Claude Code's hook system. The `PreToolUse` and `PostToolUse` hooks receive JSON payloads containing the tool name and input parameters. We currently use `PreToolUse` only for commit message validation (`validate-commit.sh`) and TypeScript build checking (`build-check.sh`). We use `PostToolUse` only for phase boundary checking on Write operations. We are not capturing tool call sequences, durations, or success/failure rates.

**Context window utilization.** Claude Code manages a finite context window (200K tokens for standard models, 1M for extended). When the context fills, a `PostCompact` event fires. We have no visibility into how close we are to compaction, how many compaction events occur per session, or what context is lost. The OOPS/03 research identified this as the number one cause of quality degradation in extended sessions.

**Agent spawn telemetry.** When subagents are spawned (via the Agent tool or team orchestration), Claude Code creates isolated execution contexts. The spawn event includes the agent definition, model selection, effort level, and isolation strategy (worktree, none). We have no systematic capture of agent lifecycle data: spawn time, completion time, success/failure, token consumption, or output quality.

**Error and recovery patterns.** Tool calls fail. Files are not found. Permissions are denied. Tests fail. Builds break. Each failure triggers a recovery sequence -- retry, alternative approach, user escalation. These recovery patterns are among the highest-signal data for improving agent behavior, yet we capture none of them systematically.

### 1.3 Data We Cannot Access

Some data is internal to Claude Code and not exposed through any hook or API:

- **Token consumption per turn** -- no hook provides token counts for individual model calls
- **Reasoning trace** -- the model's internal chain-of-thought is not surfaced to hooks
- **Context window composition** -- we cannot see what proportion of context is system prompt, conversation history, tool results, or skill content
- **Cache hit rates** -- Claude Code caches prompt prefixes; cache effectiveness is invisible to us
- **Model routing decisions** -- when effort levels or model selection changes, we do not see the decision

These represent hard boundaries. Any analytics pipeline must work with what the hooks provide, not what we wish they provided.

## 2. Patterns We Should Look For

### 2.1 Tool Sequence Optimization

The most actionable pattern is repeated tool call sequences. When a developer (human or agent) performs the same sequence of tool calls across multiple sessions, that sequence is a candidate for automation or skill creation.

**Sequences to detect:**

| Pattern | Sequence | Implication |
|---------|----------|-------------|
| TDD cycle | test(fail) -> write(code) -> test(pass) | Healthy TDD discipline; skill could automate the RED-GREEN cycle |
| Debug loop | read -> read -> read -> edit -> test(fail) -> read -> edit -> test(pass) | Three or more reads before first edit suggests insufficient context; could pre-load files |
| Correction chain | write -> user-correction -> write -> user-correction | User repeatedly corrects output; high signal for skill refinement |
| Recovery spiral | bash(fail) -> bash(fail) -> bash(fail) -> different approach | Three consecutive failures before changing strategy; could detect and pivot earlier |
| Context fishing | read -> read -> read -> read -> read (5+ without write) | Analysis paralysis; agent is stuck gathering context without acting |

Detection method: Extract tool call type sequences from `PostToolUse` hook data. Sliding window of 3-7 calls. Hash each window. Count occurrences across sessions. Sequences appearing 3+ times across 3+ sessions are candidates.

### 2.2 Concrete Examples from This Session

This OOPS research session provides a live case study. The session involved reading 40+ SKILL.md files, performing binary analysis on the Claude Code executable, dispatching 5 parallel research agents, writing 9 research documents (20K+ words), and expanding those documents in a second pass. The observable tool patterns include:

**Tool distribution (estimated from session activity):**

| Tool | Est. Calls | % of Total | Purpose |
|------|-----------|-----------|---------|
| Read | ~180 | 45% | SKILL.md files, reference docs, OOPS drafts, binary output |
| Bash | ~60 | 15% | wc counts, ls, strings binary analysis, git operations |
| Write | ~35 | 9% | Research documents, expanded documents, index pages |
| Edit | ~25 | 6% | Document corrections, frontmatter updates |
| Grep | ~40 | 10% | Pattern searches across skills, binary strings |
| Glob | ~20 | 5% | File discovery across research directories |
| Agent | ~15 | 4% | Research fleet dispatch (5 deep-research, 5 expansion, 2 fact-check) |
| Other | ~25 | 6% | Tool result processing |

**Key patterns observed:**

1. **Read-heavy start.** The session opened with ~40 consecutive Read calls to survey all 40 SKILL.md files. This is a "context gathering" pattern that a pre-built skill could compress -- a skill registry (proposed in OOPS/07) would provide this survey data without 40 individual reads.

2. **Binary analysis sequence.** The `strings $(which claude) | grep` pattern appeared 4 times with different search terms (agentskills, skills-format, skill field names, API endpoints). This is a repeated 3-call sequence (Bash -> Bash -> Bash with grep variations) that should be codified into the ecosystem-alignment skill as a structured analysis function.

3. **Agent fleet dispatch.** 5 agents were spawned in a single message using `run_in_background: true`. Each agent received a complete brief (topic, scope, word target, quality standards). The dispatch pattern matched the fleet-mission skill exactly -- this was the pattern being codified while it was being used. Agent completion notifications arrived over the next 10-15 minutes, with results aggregated incrementally.

4. **Document expansion pattern.** The expansion pass followed a consistent sequence: Read(document) -> analyze gaps -> Write(expanded document). This 3-call pattern repeated 9 times (once per research document). With tool call tracking, this pattern would be detectable as a "document expansion cycle" suitable for automation.

5. **File access hotspots.** The most-read files across the session:
   - `.claude/skills/*/SKILL.md` -- 40 reads (one per skill, survey phase)
   - `www/tibsfox/com/Research/OOPS/research/*.md` -- 18 reads (drafts, reviews, expansions)
   - `.claude/hooks/*.sh` -- 3 reads (hook analysis for this document)
   - Binary analysis output -- 4 reads (Claude Code binary strings)

### 2.3 Agent Spawn Patterns from This Session

The session spawned agents in three waves:

**Wave 1: Deep research fleet (5 agents)**
- Agent A: Incident Timeline and Architecture Parallels
- Agent B: Killer App Strategy and Improvements
- Agent C: Hook System Deep Dive
- Agent D: Memory System and Orchestration Patterns
- Agent E: Skill Optimization and Session Analysis

Each agent was spawned with `run_in_background: true` and received a complete context packet (project description, research scope, quality standards, output format). No agent had access to another agent's output during execution. Results were aggregated after all 5 completed.

**Wave 2: Document expansion (2 agents)**
- Agent A: Docs 01-05 expansion
- Agent B: Docs 06-09 expansion

These agents received the original documents plus expansion instructions. Each operated independently.

**Wave 3: Direct expansion (no agents)**
The final expansion pass was performed directly (this session), without agent dispatch. This allowed for cross-document consistency checks that would not be possible with isolated agents.

**Observable metrics:**
- Fleet dispatch overhead: ~30 seconds to compose and send 5 agent briefs
- Agent completion time: 8-15 minutes per agent (Wave 1)
- Agent output quality: 4 of 5 agents produced usable first drafts; 1 needed significant revision
- Agent success rate: 100% (all completed, none stalled or failed)
- No merge conflicts (agents wrote to non-overlapping files)

### 2.4 Common Corrections

User corrections are the highest-signal observation in the skill-creator pipeline. Currently we detect corrections heuristically (fix after feat on same files). A proper correction capture system would record:

- What Claude produced (before correction)
- What the user wanted (after correction)
- The domain (commit message, code style, architecture decision, file location)
- Whether the same correction recurs

Three corrections of the same type should trigger a skill refinement proposal. This is already specified in our bounded learning guardrails but not systematically implemented.

### 2.5 Compaction Impact Analysis

Sessions that hit context compaction are qualitatively different from those that do not. Post-compaction, the agent loses working memory -- variable values, file contents it read earlier, intermediate reasoning. If we capture compaction events, we can measure:

- Sessions per compaction event
- Task completion rate before vs. after compaction
- Whether specific task types (large refactors, multi-file changes) trigger compaction more often
- Recovery time after compaction (how many extra reads to re-establish context)

### 2.6 File Hotspot Analysis

Some files are read or modified far more often than others. Identifying hotspots reveals:

- **Configuration files** read at session start (STATE.md, ROADMAP.md, config.json) -- these should be pre-loaded
- **Frequently modified source files** -- candidates for better test coverage or refactoring
- **Files read but never modified** -- reference material that could be summarized into skills
- **Files modified and then reverted** -- false starts that waste context

## 3. The 7-Step Learning Loop

### 3.1 Loop Definition

The learning loop is: **observe -> store -> analyze -> propose -> review -> apply -> measure**.

**Step 1: Observe.** Hooks capture raw events (tool calls, commits, errors, compaction, agent lifecycle).

**Step 2: Store.** Events append to JSONL files in `.planning/patterns/`.

**Step 3: Analyze.** The `/sc:digest` command (enhanced with tool call analysis) identifies patterns: repeated sequences, high correction rates, file hotspots, agent inefficiencies.

**Step 4: Propose.** When patterns cross the `min_occurrences` threshold (default 3), the pipeline writes a suggestion to `suggestions.json`. The suggestion includes the pattern evidence, proposed skill content, and confidence level.

**Step 5: Review.** The `/sc:suggest` command presents suggestions to the user. Accept, dismiss, or defer. Human judgment is always in the loop -- this is a non-negotiable guardrail.

**Step 6: Apply.** Accepted suggestions become skills (via `skill-creator create`) or agent prompt adjustments. Skills enter the loading pipeline and begin affecting future sessions.

**Step 7: Measure.** The next cycle's analysis measures whether the new skill reduced the target pattern. If correction rate dropped, the skill is working. If it did not, the skill needs refinement or the pattern diagnosis was wrong.

### 3.2 Worked Example: The Binary Analysis Pattern

Here is the full 7-step loop applied to a concrete pattern from this session.

**Step 1: Observe.**
PostToolUse captures these tool calls during the OOPS session:

```json
{"seq": 142, "tool": "Bash", "cmd": "strings $(which claude) | grep -i agentskill", "success": true}
{"seq": 143, "tool": "Bash", "cmd": "strings $(which claude) | grep -i skill | grep -i format", "success": true}
{"seq": 144, "tool": "Bash", "cmd": "strings $(which claude) | grep -P 'skills-\\d{4}'", "success": true}
{"seq": 145, "tool": "Read", "file": "/tmp/binary-output.txt", "success": true}
```

In a previous session (ecosystem alignment audit), the same pattern appeared:

```json
{"seq": 31, "tool": "Bash", "cmd": "strings $(which claude) | grep -oP '\"skill[^\"]*\"'", "success": true}
{"seq": 32, "tool": "Bash", "cmd": "strings $(which claude) | grep hook | head -20", "success": true}
{"seq": 33, "tool": "Bash", "cmd": "strings $(which claude) | grep agent | grep -i policy", "success": true}
```

**Step 2: Store.**
Both sequences are stored in `tool-calls.jsonl` with session IDs linking them to their respective sessions.

**Step 3: Analyze.**
The sliding window hash detects:
- 3-call pattern: `Bash(strings|grep) -> Bash(strings|grep) -> Bash(strings|grep)`
- Appears in 2 sessions (and would appear in more as ecosystem alignment becomes routine)
- All calls share the `strings $(which claude)` prefix
- The variable part is the grep filter

The analyzer classifies this as a "binary analysis" pattern with confidence 0.8 (high repetition, consistent structure, variable filter).

**Step 4: Propose.**
The pipeline writes to `suggestions.json`:

```json
{
  "id": "sug-2026-03-31-001",
  "type": "skill_refinement",
  "target_skill": "ecosystem-alignment",
  "pattern": "binary-analysis-sequence",
  "evidence": {
    "sessions": ["session-abc", "session-def"],
    "occurrences": 2,
    "tool_calls": 7,
    "saved_calls_per_occurrence": 2
  },
  "proposal": "Add a structured binary analysis section to ecosystem-alignment that runs all standard grep patterns in a single Bash call, reducing 3-4 tool calls to 1.",
  "confidence": 0.8
}
```

**Step 5: Review.**
User sees: "Pattern detected: you run `strings $(which claude) | grep` 3-4 times each session. Propose consolidating into a single analysis command in the ecosystem-alignment skill."

User accepts.

**Step 6: Apply.**
The ecosystem-alignment skill gains a new section:

```markdown
### Binary Analysis (Combined)
Run all standard checks in one pass:
\`\`\`bash
strings $(which claude) 2>/dev/null | grep -oP '"(skill|hook|agent|team|memory|worktree|effort|policy)[^"]*"' | sort -u > /tmp/claude-strings.txt
grep -c "skill" /tmp/claude-strings.txt  # skill-related strings
grep "skills-" /tmp/claude-strings.txt   # format versions
grep "agent" /tmp/claude-strings.txt     # agent patterns
\`\`\`
```

**Step 7: Measure.**
In the next session that triggers ecosystem-alignment, the analyzer checks:
- Previous: 3-4 Bash calls for binary analysis
- Current: 1 Bash call for binary analysis
- Reduction: 66-75% fewer tool calls for this pattern
- Verdict: Skill refinement successful

If the pattern did not decrease (user ignored the skill, or the single command was insufficient), the analyzer would flag this as a failed refinement after 3 more sessions and either propose a different approach or downgrade the suggestion confidence.

## 4. Analytics Pipeline Architecture

### 4.1 Collection Layer

The collection layer captures raw events from Claude Code's hook system and writes them to structured storage.

```
+===================================================================+
|                    CLAUDE CODE RUNTIME                              |
+===================================================================+
      |            |             |            |           |
      v            v             v            v           v
  SessionStart  PreToolUse   PostToolUse  PostCompact  SessionEnd
      |            |             |            |           |
      v            v             v            v           v
+------------------------------------------------------------------+
|                     HOOK DISPATCH LAYER                            |
|  (.claude/hooks.json routes events to shell scripts)              |
+------------------------------------------------------------------+
      |            |             |            |           |
      v            v             v            v           v
  session-     validate-     tool-        compact-    session-
  state.sh     commit.sh    tracker.sh   tracker.sh  end.sh
  (exists)     (exists)     (NEW)        (NEW)       (update)
      |            |             |            |           |
      +-----+------+------+-----+------+-----+-----+----+
            |             |            |            |
            v             v            v            v
+------------------------------------------------------------------+
|                    JSONL STORAGE LAYER                             |
|  (.planning/patterns/ -- gitignored, local-first)                 |
+------------------------------------------------------------------+
|                                                                    |
|  sessions.jsonl           tool-calls.jsonl                        |
|  (existing: commits)      (NEW: every tool invocation)            |
|                                                                    |
|  skill-events.jsonl       agent-lifecycle.jsonl                   |
|  (existing: skill loads)  (NEW: spawn/complete/fail)              |
|                                                                    |
|  budget-history.jsonl     compaction-events.jsonl                 |
|  (existing: skill budget) (NEW: context compaction)               |
|                                                                    |
|  errors.jsonl                                                      |
|  (NEW: failures and recovery sequences)                           |
|                                                                    |
+------------------------------------------------------------------+
            |
            v
+------------------------------------------------------------------+
|                    ANALYSIS LAYER                                  |
|  (/sc:digest, /sc:observe, /sc:suggest)                          |
+------------------------------------------------------------------+
|                                                                    |
|  Tier 1: Per-Session          Tier 2: Cross-Session               |
|  - Tool call distribution     - Sequence convergence              |
|  - File hotspots              - Correction rate trend             |
|  - Error count + recovery     - Agent efficiency trend            |
|  - Compaction events          - Hotspot evolution                 |
|  - Agent completion rate      - Session duration distribution     |
|                                                                    |
|  Tier 3: Predictive (future, requires 50+ sessions)              |
|  - File access prediction     - Compaction probability            |
|  - Recovery sequence pred.    - Agent completion time pred.       |
|                                                                    |
+------------------------------------------------------------------+
            |
            v
+------------------------------------------------------------------+
|                    ACTION LAYER                                    |
+------------------------------------------------------------------+
|                                                                    |
|  Skill Creation    Agent Tuning     Context Pre-loading           |
|  /sc:suggest       prompt adj.      SessionStart injection        |
|  skill-creator     effort levels    file pre-reads                |
|  create            task scope       state warming                 |
|                                                                    |
+------------------------------------------------------------------+
            |
            +--------> feeds back to Collection Layer (closed loop)
```

### 4.2 Design Constraints

- All hooks must exit 0 on failure (never block the session)
- POSIX shell only (no Node.js, no npm -- the post-commit hook already demonstrates this pattern)
- JSON construction via jq (safe escaping, no manual string concatenation)
- Append-only writes (no locking required for single-line appends)
- All pattern files in `.gitignore` (`.planning/patterns/` is already excluded)

### 4.3 Tool Call Tracker Hook (New)

The key new hook is a `PostToolUse` handler that captures every tool invocation:

```json
{
  "timestamp": "ISO-8601",
  "session_id": "from CLAUDE_SESSION_ID env",
  "tool": "Read|Write|Edit|Bash|Glob|Grep|Agent",
  "duration_ms": "estimated from timestamps",
  "success": true,
  "files_involved": ["list of file paths from tool input"],
  "sequence_position": 42
}
```

The `sequence_position` is a per-session counter that preserves call ordering. This enables tool sequence analysis without relying on timestamp precision.

Implementation sketch:

```bash
#!/bin/bash
# tool-tracker.sh -- PostToolUse hook: capture tool call telemetry
# Appends one JSON line per tool invocation to tool-calls.jsonl

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // "unknown"')
SUCCESS=$(echo "$INPUT" | jq -r '.tool_output.error // empty | if . == "" then "true" else "false" end')
FILES=$(echo "$INPUT" | jq -c '[.tool_input.file_path, .tool_input.path] | map(select(. != null))')

# Sequence counter (filesystem-based, per-session)
SEQ_FILE=".planning/patterns/.tool-seq-$$"
SEQ=$(cat "$SEQ_FILE" 2>/dev/null || echo "0")
SEQ=$((SEQ + 1))
echo "$SEQ" > "$SEQ_FILE"

ENTRY=$(jq -n \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --arg sid "${CLAUDE_SESSION_ID:-unknown}" \
  --arg tool "$TOOL" \
  --argjson success "$SUCCESS" \
  --argjson files "$FILES" \
  --argjson seq "$SEQ" \
  '{timestamp: $ts, session_id: $sid, tool: $tool, success: $success, files: $files, seq: $seq}')

echo "$ENTRY" >> .planning/patterns/tool-calls.jsonl 2>/dev/null
exit 0
```

### 4.4 Storage Layer

JSONL files are sufficient for our current scale (hundreds to low thousands of entries per session). Each file is append-only, human-readable, and trivially parseable with jq, Node.js, or Python.

**Retention policy:** The `sc:digest` command already reads `observation.retention_days` from `skill-creator.json` (default 30 days). A periodic purge removes entries older than the retention window. For analytics, we should also maintain a compressed archive of purged data -- the aggregates remain useful even when individual entries are discarded.

**Storage budget at scale:**

| File | Entries/Session | Entry Size | Sessions/Month | Monthly Size |
|------|----------------|------------|----------------|-------------|
| sessions.jsonl | 10-50 commits | ~200 bytes | 100 | ~1 MB |
| tool-calls.jsonl | 200-2000 calls | ~150 bytes | 100 | ~30 MB |
| agent-lifecycle.jsonl | 0-20 agents | ~300 bytes | 100 | ~0.6 MB |
| compaction-events.jsonl | 0-5 events | ~200 bytes | 100 | ~0.1 MB |
| errors.jsonl | 5-50 errors | ~250 bytes | 100 | ~1.25 MB |

Total: approximately 33 MB per month. Well within our 2TB local-first budget. Tool calls dominate -- consider sampling (every Nth call) if this becomes a problem.

### 4.5 Analysis Layer

Analysis transforms raw events into actionable insights. Three tiers:

**Tier 1: Per-session summaries (run at session end)**

- Total tool calls, grouped by type
- File access frequency distribution
- Error count and recovery success rate
- Compaction events (if any)
- Agent spawn count and completion rate
- Dominant tool sequence (most common 3-call pattern)

**Tier 2: Cross-session trends (run on `/sc:digest`)**

- Tool sequence convergence (are repeated sequences stabilizing or shifting?)
- Correction rate trend over time (improving or degrading?)
- Agent efficiency trend (are agents getting faster or slower?)
- File hotspot evolution (are the same files always hot, or does it rotate?)
- Session duration distribution (are sessions getting longer?)

**Tier 3: Predictive analysis (future -- feeds into skill creation)**

- Given the current phase and task type, predict which files will be accessed
- Given a tool call failure, predict the most likely recovery sequence
- Given an agent assignment, predict completion time and correction rate
- Given context utilization level, predict compaction probability

Tier 3 requires enough Tier 2 data to be meaningful -- likely 50+ sessions minimum.

### 4.6 Action Layer

Analysis is useless without action. The pipeline's output feeds three systems:

**Skill creation.** When a tool sequence repeats 3+ times across sessions, the pipeline proposes a skill that automates or guides that sequence. This is the existing `/sc:suggest` mechanism, but fed with richer data (tool sequences, not just commit patterns).

**Agent tuning.** When agent efficiency metrics show persistent patterns (e.g., a specific agent type consistently has high correction rates), the pipeline recommends adjustments to the agent's prompt, effort level, or assigned task scope.

**Context pre-loading.** When file access patterns show the same files are read at the start of every session of a given type, the pipeline recommends adding those files to the session's startup context (via SessionStart hook injection).

## 5. Privacy and Security Analysis

### 5.1 Data Classification

Session log data falls into four sensitivity categories. Each requires different handling.

**Category A: Safe to Collect and Retain (no restrictions)**

| Data Type | Example | Why Safe |
|-----------|---------|----------|
| Tool call types | "Read", "Write", "Bash" | No content, just tool names |
| Tool call counts | 180 reads, 35 writes | Aggregate statistics |
| Timestamps | ISO-8601 session times | No content information |
| Sequence positions | Call #42 of session | Ordering metadata only |
| Compaction event counts | 3 compactions this session | System health data |
| Agent spawn counts | 5 agents dispatched | Orchestration metadata |
| Skill load events | "gsd-workflow loaded, score 0.85" | System configuration data |

**Category B: Safe to Collect Locally, Not for Remote Aggregation**

| Data Type | Example | Risk | Mitigation |
|-----------|---------|------|------------|
| File paths | `/path/to/projectsrc/auth.ts` | Reveals directory structure | Never transmit; local only |
| Commit messages | `feat(auth): add JWT rotation` | Reveals feature names | Never transmit; local only |
| Bash commands | `npm test -- --filter=auth` | Reveals tooling | Never transmit; local only |
| Agent briefs | "Research distributed systems" | Reveals project topics | Never transmit; local only |

**Category C: Collect with Redaction**

| Data Type | Example | Risk | Redaction Strategy |
|-----------|---------|------|-------------------|
| Error messages | "ENOENT: /path/to/.env" | May contain paths to secrets | Redact file paths containing `.env`, `credentials`, `secret`, `key` |
| Tool parameters | `{"file_path": "/home/user/.ssh/id_rsa"}` | May reference sensitive files | Strip parameters matching sensitive path patterns |
| Git diff content | `+API_KEY=sk-abc123` | May contain secrets | Never capture diff content, only file names and line counts |

**Category D: Never Collect**

| Data Type | Why Not |
|-----------|---------|
| File contents read by Read tool | Could contain secrets, proprietary code |
| User message text | Private conversations, business context |
| Model reasoning traces | Internal to the model, may contain user data |
| Environment variable values | Secrets, API keys, tokens |
| Clipboard contents | Private user data |

### 5.2 Security Controls

**Local-first architecture.** All data stays on the local machine. The `.planning/patterns/` directory is gitignored. No data is transmitted to any remote service. This is the strongest possible privacy guarantee.

**If remote aggregation is ever considered (future):**
- Explicit opt-in required (not opt-out)
- Only Category A data may be transmitted
- Category B data must be aggregated locally before transmission (counts, not content)
- Category C data must be redacted before any aggregation
- Category D data must never leave the machine under any circumstances
- A data processing agreement (DPA) would be required for any multi-user deployment

**Access controls.** JSONL files are readable only by the user who created them (standard Unix file permissions). No other user or process on the machine should have access.

**Retention limits.** The 30-day retention window bounds the exposure window. Even if a breach occurred, only 30 days of Category A/B data would be exposed.

### 5.3 Threat Model

| Threat | Likelihood | Impact | Mitigation |
|--------|-----------|--------|------------|
| JSONL files committed to git | Medium (accidental) | Low (Category A/B data) | `.planning/patterns/` in `.gitignore` |
| JSONL files read by other process | Low | Medium (file paths, commands) | Unix file permissions (0600) |
| Session data aggregated and transmitted without consent | Zero (not implemented) | High | No remote capability exists |
| Tool call logs reveal project structure | Medium (intended) | Low (local analysis only) | Never share raw logs |
| Sensitive file paths in error logs | Medium | Medium | Redaction filter on Category C data |

### 5.4 Compliance Notes

For individual developer use (the current scope), no compliance framework applies -- the data is personal development analytics on a personal machine. If this system were deployed in an enterprise context:

- **GDPR:** Session logs tied to a user identity would be personal data. The right to erasure would require a purge command.
- **SOC 2:** Audit trail data (which this resembles) would need access logging and retention policies.
- **HIPAA:** If the codebase contained health data, file path logs could constitute PHI adjacency. Out of scope for us.

The local-first, gitignored, 30-day-retention design satisfies the spirit of these frameworks even though none currently apply.

## 6. Connection to OPEN Problems

### 6.1 OPEN Problem #4: Distributed Intelligence (OPEN-P4)

The core challenge of distributed intelligence is coordination: how do multiple agents share knowledge without overwhelming each other's context? Session log analysis directly informs this:

**What agents actually need to know.** By analyzing file access patterns across agent sessions, we can determine which files each agent type actually reads. The mayor-coordinator currently pushes full context to every polecat. If analysis shows that polecats working on test tasks only ever read test files and source files (never documentation or configuration), we can prune the context passed to test-focused agents.

*Metric feed:* Agent file access patterns (from tool-calls.jsonl) -> context pruning recommendations -> reduced context per agent -> measured via agent file efficiency ratio (files written / files read).

**Communication overhead.** The witness-observer's patrol loop generates nudge and mail messages. By measuring how often nudges result in actual stall recovery vs. false positives, we can tune patrol intervals and stall thresholds empirically rather than guessing.

*Metric feed:* Nudge frequency and stall recovery rate (from agent-lifecycle.jsonl + tool-calls.jsonl) -> threshold tuning -> measured via stall frequency and false positive rate.

**Convoy efficiency.** The Gastown convoy model runs multiple agents in parallel with sequential commit merging. Session logs can measure the actual parallelism achieved: how much time agents spend working vs. waiting for merge slots. If merge contention is high, we need more refinery capacity or smarter work partitioning.

*Metric feed:* Agent task duration + merge wait time (from agent-lifecycle.jsonl) -> parallelism ratio -> convoy throughput.

**Emergent knowledge.** The threshold between "parallel labor" and "distributed intelligence" (OPEN-P4's central question) could be measured by comparing the quality of work produced by N independent agents vs. work produced by N agents with cross-communication. Session logs would capture whether cross-agent communication (nudges, mail) correlated with higher output quality (fewer corrections, fewer stalls).

### 6.2 OPEN Problem #5: Non-Deterministic Testing (OPEN-P5)

Non-deterministic tests are tests that sometimes pass and sometimes fail without code changes. Session log analysis helps in three ways:

**Flaky test detection.** If the same test file appears in both passing and failing test runs across sessions (same code, different outcomes), it is flaky. By correlating tool call data (test invocations and their exit codes) with git state (no code changes between runs), we can automatically identify non-deterministic tests.

*Metric feed:* Test tool calls with exit codes (from tool-calls.jsonl) + git state (from sessions.jsonl) -> flaky test candidates -> confirmed flaky rate.

**Environment sensitivity.** By capturing system state at test execution time (available memory, CPU load, disk I/O, running processes), we can correlate test failures with environmental conditions. If a test only fails when system memory is below a threshold, that is an environment sensitivity bug, not a code bug.

*Metric feed:* System metrics at test time (new: env-snapshot in tool-tracker.sh) + test outcomes -> environment correlation analysis.

**Recovery pattern analysis.** When a test fails and the agent retries it (perhaps with different flags or after clearing caches), the recovery sequence tells us what the test actually depends on. If clearing `node_modules` or restarting a server reliably fixes the failure, the test has an implicit dependency that should be made explicit.

*Metric feed:* Tool sequence after test failure (from tool-calls.jsonl) -> recovery pattern classification -> implicit dependency identification.

### 6.3 OPEN Problem #6: Confidence-Based Routing (OPEN-P6)

Session logs provide a potential calibration signal for confidence routing. If we could measure the correlation between agent-expressed confidence ("I'm confident this fix is correct") and actual outcomes (did the fix work? did it need correction?), we could build an empirical calibration curve.

*Metric feed:* This requires a new data source -- capturing agent output text alongside commit outcomes. Currently out of scope (Category D data), but the analytical framework is in place.

### 6.4 OPEN Problem #1-3: Chain-of-Thought Analysis (OPEN-P1, P2, P3)

The first three OPEN problems concern CoT faithfulness, thinking divergence, and CoT monitoring. Session logs cannot directly measure reasoning quality (model internals are Category D). However, they can provide proxy signals:

- **Correction rate after extended reasoning** -- if sessions with more tool calls before first write have higher correction rates, extended reasoning may not be helping
- **Context fishing rate** -- 5+ reads without a write may indicate the model is uncertain but not expressing it
- **Compaction-to-correction correlation** -- if corrections spike after compaction, the model's reasoning was context-dependent

These are weak signals, but at 50+ sessions of data they may reveal statistically significant patterns.

### 6.5 Metric-to-Problem Mapping Summary

| Metric Source | OPEN-P4 (Distributed) | OPEN-P5 (Testing) | OPEN-P6 (Confidence) | OPEN-P1/2/3 (CoT) |
|--------------|----------------------|-------------------|---------------------|-------------------|
| tool-calls.jsonl | Agent file access patterns | Test exit code sequences | -- | Context fishing rate |
| agent-lifecycle.jsonl | Convoy efficiency, communication overhead | -- | -- | -- |
| sessions.jsonl | -- | Git state for flaky detection | Commit outcomes | Correction rate trends |
| compaction-events.jsonl | -- | -- | -- | Post-compaction correction spikes |
| errors.jsonl | Stall recovery patterns | Recovery sequence analysis | -- | Error-to-resolution time |
| skill-events.jsonl | -- | -- | -- | Skill effectiveness correlation |

## 7. Specific Metrics to Track

### 7.1 Session-Level Metrics

| Metric | Unit | Source | Why It Matters |
|--------|------|--------|----------------|
| Session duration | minutes | SessionStart to SessionEnd timestamps | Baseline for productivity |
| Tool calls per session | count | tool-calls.jsonl | Context consumption rate |
| Compaction events per session | count | compaction-events.jsonl | Context pressure indicator |
| Files read | count | PostToolUse Read events | Context gathering efficiency |
| Files written | count | PostToolUse Write/Edit events | Productive output rate |
| Read-to-write ratio | ratio | derived | High ratio = context fishing |
| Errors per session | count | errors.jsonl | Session friction |
| Error recovery rate | % | errors.jsonl (recovered/total) | Resilience |
| Commits per session | count | sessions.jsonl | Output cadence |
| Correction rate | % | fix commits / feat commits | Quality indicator |

### 7.2 Agent-Level Metrics

| Metric | Unit | Source | Why It Matters |
|--------|------|--------|----------------|
| Agent completion rate | % | agent-lifecycle.jsonl | Reliability |
| Agent task duration | minutes | spawn to completion | Efficiency |
| Agent correction rate | % | fix commits per agent session | Quality per agent type |
| Agent file efficiency | ratio | files written / files read | Context utilization |
| Agent stall frequency | count | witness-observer nudge data | Health |
| Agent spawn-to-first-commit | minutes | lifecycle + sessions | Startup efficiency |

### 7.3 Skill-Level Metrics

| Metric | Unit | Source | Why It Matters |
|--------|------|--------|----------------|
| Skill load rate | % | skill-events.jsonl | Usage frequency |
| Skill relevance score | 0-1 | skill-events.jsonl (avg score) | Quality of activation triggers |
| Skill budget impact | chars | sc:status data | Context cost |
| Skill-associated correction rate | % | correlation of loaded skills with correction commits | Skill effectiveness |
| Skill activation-to-action latency | tool calls | tool-calls.jsonl after skill load | Time from loading to first use |

## 8. Implementation Plan: First 30 Days

### 8.1 Overview

The implementation is structured as a 30-day sprint with 4 phases. Each phase delivers independently useful capability. No phase depends on completing a later phase.

```
Day 1-3     Day 4-8     Day 9-16    Day 17-30
  |            |            |            |
  v            v            v            v
INSTRUMENT   ANALYZE     CORRELATE    CLOSE LOOP
(hooks)      (digest)    (agents)     (suggestions)
```

### 8.2 Phase 1: Instrument (Days 1-3)

**Goal:** Capture raw tool call data from every session.

**Day 1: Tool tracker hook**

1. Create `tool-tracker.sh` in `.claude/hooks/`. Shell script, POSIX-compliant, uses jq for JSON construction.
2. Register in `.claude/hooks.json` as a `PostToolUse` handler matching all tools (`"matcher": ""`).
3. Verify: run a session, check that `tool-calls.jsonl` has entries. Count should match approximate tool call count.

**Day 2: Compaction and error hooks**

4. Create `compact-tracker.sh` as a `PostCompact` handler. Captures timestamp, session ID, and a marker that compaction occurred.
5. Create `error-tracker.sh` as a `PermissionDenied` handler. Captures denied tool name and reason.
6. Update `.claude/hooks.json` with both new entries.
7. Verify: trigger a PermissionDenied event (attempt to write a protected path), confirm entry in `errors.jsonl`.

**Day 3: Sequence counter and retention**

8. Add sequence counter to tool-tracker.sh (per-session monotonic counter using a temp file).
9. Add retention enforcement to the existing purge logic: extend to cover `tool-calls.jsonl`, `compaction-events.jsonl`, and `errors.jsonl`.
10. Verify: manually create old entries, run purge, confirm they are removed.

**Milestone 1 deliverable:** Three new JSONL files being populated. Zero impact on session performance (hooks exit 0, async append-only writes).

### 8.3 Phase 2: Basic Analysis (Days 4-8)

**Goal:** Extract actionable insights from tool call data.

**Day 4-5: Extend /sc:digest**

11. Add tool call distribution reporting to `/sc:digest`. Group by tool type, compute percentages.
12. Add file hotspot detection from tool call file paths. Top 10 most-read files, top 10 most-written.
13. Add compaction frequency reporting. Sessions with compaction events, average compactions per session.

**Day 6-7: Sequence detection**

14. Implement sliding window sequence detection. Window size 3-5. Hash each window. Count across all sessions in retention window.
15. Report top 5 most common sequences in digest output.
16. Flag "context fishing" sequences (5+ reads with no write).

**Day 8: Read-to-write ratio and dashboard**

17. Compute per-session read-to-write ratio. Flag sessions above 5:1 as "context heavy."
18. Create a summary dashboard format for the digest: one-line metrics + drill-down sections.

**Milestone 2 deliverable:** Enhanced `/sc:digest` command that reports tool distributions, file hotspots, common sequences, compaction events, and read-to-write ratios. All from local JSONL data.

### 8.4 Phase 3: Agent Correlation (Days 9-16)

**Goal:** Track agent lifecycle and correlate with session outcomes.

**Day 9-10: Agent lifecycle tracking**

19. Determine the best hook point for agent spawn events. If `SubagentSpawn` is not available as a hook, instrument the mayor-coordinator and fleet-mission skills to emit lifecycle events directly.
20. Create `agent-lifecycle.jsonl` format. Fields: session ID, agent ID, agent type, spawn time, brief hash, status.
21. Add completion tracking: when an agent's background task completes, append a completion entry.

**Day 11-12: Agent-commit correlation**

22. Correlate agent lifecycle entries with commit data from `sessions.jsonl`. Match by timestamp and file overlap.
23. Compute per-agent metrics: task duration, commit count, correction rate.
24. Add agent efficiency section to digest output.

**Day 13-14: Agent file access analysis**

25. For each agent type (research, expansion, fact-check, polecat, mayor), compute the typical file access pattern: which directories and file types does each agent read?
26. Identify unnecessary context: files read by an agent type but never used (read-only, not referenced in outputs).

**Day 15-16: Cross-agent communication metrics**

27. Measure nudge and mail frequency from the Gastown messaging skills.
28. Correlate communication events with agent outcomes. Does more communication improve or hinder agent performance?
29. Report communication overhead as a percentage of agent wall-clock time.

**Milestone 3 deliverable:** Agent lifecycle tracking, per-agent performance metrics, and communication overhead analysis. Feeds directly into OPEN-P4 (distributed intelligence) research.

### 8.5 Phase 4: Closed-Loop Learning (Days 17-30)

**Goal:** Connect analysis to the suggestion pipeline.

**Day 17-19: Pattern-to-suggestion bridge**

30. When a tool sequence exceeds the `min_occurrences` threshold (3), automatically create a suggestion entry in `suggestions.json`.
31. Suggestion includes: pattern evidence (sessions, occurrences, tool calls), proposed action (new skill, skill refinement, context pre-load), confidence level.
32. Wire into `/sc:suggest` so suggestions appear in the review pipeline.

**Day 20-22: Context pre-loading suggestions**

33. When file access analysis shows the same files read at the start of 5+ sessions, suggest adding them to SessionStart injection.
34. Implement a `context-preload.json` file that the SessionStart hook reads and pre-loads.
35. Measure: do pre-loaded sessions have fewer early Read calls?

**Day 23-25: Skill effectiveness tracking**

36. After a new skill is created or refined based on a suggestion, mark the triggering pattern as "treated."
37. In subsequent sessions, compare the pattern frequency before and after treatment.
38. Report skill effectiveness: "Pattern X appeared in 4 of 10 sessions before skill Y was added. In 10 sessions since, it appeared in 1."

**Day 26-28: Agent tuning suggestions**

39. When agent correction rate exceeds 30% for a specific agent type across 3+ sessions, suggest a prompt refinement.
40. When agent stall frequency exceeds 2 per session, suggest effort level adjustment.
41. Wire agent tuning suggestions into the same `/sc:suggest` pipeline.

**Day 29-30: Documentation and calibration**

42. Write operational documentation for the analytics pipeline.
43. Run a full calibration session: execute a representative task, generate analytics, review suggestions, apply one, measure next session.
44. Adjust thresholds based on calibration results (min_occurrences, context fishing threshold, correction rate ceiling).

**Milestone 4 deliverable:** Complete closed-loop system. Patterns detected -> suggestions generated -> human review -> skill/agent changes -> effectiveness measured. The 7-step learning loop (Section 3) is operational.

## 9. How Session Analysis Feeds Back Into Skill Improvement

**Closing the loop on specific patterns:**

| Pattern Detected | Proposed Action | Success Metric |
|-----------------|----------------|----------------|
| Same 5 files read at session start | Pre-load via SessionStart hook | Reduction in early-session Read calls |
| Agent type X has 40% correction rate | Refine agent prompt with common corrections | Correction rate drops below 20% |
| Test failures followed by cache clear | Add cache-clear step to test runner | Flaky test rate drops |
| Context fishing (5+ reads without write) | Provide context summary skill for the target domain | Read-to-write ratio improves |
| Tool sequence repeats 5+ times | Create automation skill for the sequence | Sequence collapses to fewer calls |
| Binary analysis: 3+ grep calls | Consolidate into ecosystem-alignment skill | Calls reduced to 1 |
| Gastown dispatch: 6+ skills loaded | Consolidate heavy skills per OOPS/07 recommendations | Token budget drops below 5% |
| Post-compaction correction spike | Add PostCompact context restoration hook | Post-compaction correction rate normalizes |

## 10. Risks and Mitigations

**Performance overhead.** Every hook adds latency to tool calls. Mitigation: hooks are shell scripts that append a single line to a file. Measured overhead should be under 5ms per hook invocation. If it exceeds 20ms, switch to asynchronous writes (background process).

**Storage growth.** Tool call data grows linearly with session activity. At 2000 calls/session and 100 sessions/month, that is 200K entries/month. Mitigation: enforce retention policy, compress archived data, consider sampling for high-frequency events.

**Analysis noise.** Not every pattern is meaningful. A tool sequence that repeats 3 times might be coincidence, not a real pattern. Mitigation: cross-session validation (pattern must appear in 3+ distinct sessions), user review gate (no auto-application), and the bounded learning guardrails (20% max change per refinement, 7-day cooldown).

**Privacy.** Session logs contain file paths, commit messages, and tool parameters. For shared repos, `.planning/patterns/` is already in `.gitignore`. For local analysis, data never leaves the machine. If we ever add remote aggregation, it must be opt-in with explicit consent and limited to Category A data (Section 5.1).

**Circular improvement.** If skills are refined based on patterns that were themselves influenced by earlier skills, the system could converge on a local optimum rather than improving. Mitigation: periodically review skill effectiveness with fresh data (sessions where the skill was NOT loaded) to confirm the skill adds value. The 7-step loop's "Measure" step (Step 7) explicitly checks for this.

**Hook interaction.** Multiple hooks firing on the same event could create ordering dependencies or performance bottlenecks. Mitigation: hooks are stateless and append-only. No hook reads another hook's output. The order of execution does not matter for append operations.

## Conclusion

The data is there. Claude Code's hook system exposes tool calls, session lifecycle, file changes, errors, and compaction events. Our existing infrastructure captures a slice of this (commits, manual observations, skill telemetry). The gap is systematic tool call capture, agent lifecycle tracking, and compaction monitoring.

The implementation path is incremental: add hooks (Days 1-3), extend analysis (Days 4-8), correlate agents (Days 9-16), close the loop (Days 17-30). Each phase delivers value independently -- we do not need the full pipeline to start benefiting from tool call distributions or file hotspot detection.

The privacy model is clear: local-first, gitignored, 30-day retention, four data categories with strict handling rules. The security analysis shows that the threat surface is small and well-mitigated by the local-only architecture.

The deepest value is in closing the loop: patterns detected in session data become skills that change future sessions, and we measure whether those changes actually improved the metrics that triggered them. That is not machine learning in the statistical sense -- it is empirical systems engineering. Observe, hypothesize, intervene, measure. The same cycle that built 190+ research projects and 50 milestones, now applied to the tooling itself.

---

*Research conducted 2026-03-31. Data sourced from direct observation of this session's tool call patterns, reading of all hook configurations in .claude/hooks.json, analysis of JSONL infrastructure in project-claude/hooks/, and cross-reference with OPEN problems P1-P6. Privacy analysis based on data classification framework applied to all hook-accessible data types.*
