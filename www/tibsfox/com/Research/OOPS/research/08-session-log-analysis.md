# Session Log Analysis — Mining Claude Code Sessions for Operational Intelligence

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

### 2.2 Agent Efficiency Metrics

For multi-agent orchestration (Gastown convoy, team execution), we need per-agent performance data:

- **Task completion time** -- from spawn to final commit
- **Commit count per task** -- single clean commit vs. multiple fix-up commits
- **Correction rate** -- fix commits as a proportion of total commits per agent
- **File touch efficiency** -- files modified vs. files read (high read-to-write ratio suggests wasted context)
- **Stall frequency** -- how often the witness-observer detects stalls per agent type

### 2.3 Common Corrections

User corrections are the highest-signal observation in the skill-creator pipeline. Currently we detect corrections heuristically (fix after feat on same files). A proper correction capture system would record:

- What Claude produced (before correction)
- What the user wanted (after correction)
- The domain (commit message, code style, architecture decision, file location)
- Whether the same correction recurs

Three corrections of the same type should trigger a skill refinement proposal. This is already specified in our bounded learning guardrails but not systematically implemented.

### 2.4 Compaction Impact Analysis

Sessions that hit context compaction are qualitatively different from those that do not. Post-compaction, the agent loses working memory -- variable values, file contents it read earlier, intermediate reasoning. If we capture compaction events, we can measure:

- Sessions per compaction event
- Task completion rate before vs. after compaction
- Whether specific task types (large refactors, multi-file changes) trigger compaction more often
- Recovery time after compaction (how many extra reads to re-establish context)

### 2.5 File Hotspot Analysis

Some files are read or modified far more often than others. Identifying hotspots reveals:

- **Configuration files** read at session start (STATE.md, ROADMAP.md, config.json) -- these should be pre-loaded
- **Frequently modified source files** -- candidates for better test coverage or refactoring
- **Files read but never modified** -- reference material that could be summarized into skills
- **Files modified and then reverted** -- false starts that waste context

## 3. Building a Session Analytics Pipeline

### 3.1 Collection Layer

The collection layer captures raw events from Claude Code's hook system and writes them to structured storage.

**Architecture:**

```
Claude Code Hooks
  |
  |-- SessionStart -----> session-start.sh (already exists)
  |-- PreToolUse -------> tool-tracker.sh (new)
  |-- PostToolUse ------> tool-tracker.sh (new)
  |-- PostCompact ------> compact-tracker.sh (new)
  |-- SubagentSpawn ----> agent-tracker.sh (new)
  |-- PermissionDenied -> error-tracker.sh (new)
  |-- SessionEnd -------> session-end.sh (already exists, needs update)
  |
  v
.planning/patterns/
  |-- sessions.jsonl         (existing -- commit-level data)
  |-- tool-calls.jsonl       (new -- every tool invocation)
  |-- agent-lifecycle.jsonl  (new -- spawn, complete, fail events)
  |-- compaction-events.jsonl (new -- compaction timestamps and context)
  |-- errors.jsonl           (new -- failures and recovery sequences)
```

**Design constraints:**

- All hooks must exit 0 on failure (never block the session)
- POSIX shell only (no Node.js, no npm -- the post-commit hook already demonstrates this pattern)
- JSON construction via jq (safe escaping, no manual string concatenation)
- Append-only writes (no locking required for single-line appends)
- All pattern files in `.gitignore` (`.planning/patterns/` is already excluded)

**Tool call tracker hook (new):**

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

### 3.2 Storage Layer

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

### 3.3 Analysis Layer

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

### 3.4 Action Layer

Analysis is useless without action. The pipeline's output feeds three systems:

**Skill creation.** When a tool sequence repeats 3+ times across sessions, the pipeline proposes a skill that automates or guides that sequence. This is the existing `/sc:suggest` mechanism, but fed with richer data (tool sequences, not just commit patterns).

**Agent tuning.** When agent efficiency metrics show persistent patterns (e.g., a specific agent type consistently has high correction rates), the pipeline recommends adjustments to the agent's prompt, effort level, or assigned task scope.

**Context pre-loading.** When file access patterns show the same files are read at the start of every session of a given type, the pipeline recommends adding those files to the session's startup context (via SessionStart hook injection).

## 4. Connection to OPEN Problems

### 4.1 OPEN Problem #4: Distributed Intelligence

The core challenge of distributed intelligence is coordination: how do multiple agents share knowledge without overwhelming each other's context? Session log analysis directly informs this:

**What agents actually need to know.** By analyzing file access patterns across agent sessions, we can determine which files each agent type actually reads. The mayor-coordinator currently pushes full context to every polecat. If analysis shows that polecats working on test tasks only ever read test files and source files (never documentation or configuration), we can prune the context passed to test-focused agents.

**Communication overhead.** The witness-observer's patrol loop generates nudge and mail messages. By measuring how often nudges result in actual stall recovery vs. false positives, we can tune patrol intervals and stall thresholds empirically rather than guessing.

**Convoy efficiency.** The Gastown convoy model runs multiple agents in parallel with sequential commit merging. Session logs can measure the actual parallelism achieved: how much time agents spend working vs. waiting for merge slots. If merge contention is high, we need more refinery capacity or smarter work partitioning.

### 4.2 OPEN Problem #5: Non-Deterministic Testing

Non-deterministic tests are tests that sometimes pass and sometimes fail without code changes. Session log analysis helps in two ways:

**Flaky test detection.** If the same test file appears in both passing and failing test runs across sessions (same code, different outcomes), it is flaky. By correlating tool call data (test invocations and their exit codes) with git state (no code changes between runs), we can automatically identify non-deterministic tests.

**Environment sensitivity.** By capturing system state at test execution time (available memory, CPU load, disk I/O, running processes), we can correlate test failures with environmental conditions. If a test only fails when system memory is below a threshold, that is an environment sensitivity bug, not a code bug.

**Recovery pattern analysis.** When a test fails and the agent retries it (perhaps with different flags or after clearing caches), the recovery sequence tells us what the test actually depends on. If clearing `node_modules` or restarting a server reliably fixes the failure, the test has an implicit dependency that should be made explicit.

## 5. Specific Metrics to Track

### 5.1 Session-Level Metrics

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

### 5.2 Agent-Level Metrics

| Metric | Unit | Source | Why It Matters |
|--------|------|--------|----------------|
| Agent completion rate | % | agent-lifecycle.jsonl | Reliability |
| Agent task duration | minutes | spawn to completion | Efficiency |
| Agent correction rate | % | fix commits per agent session | Quality per agent type |
| Agent file efficiency | ratio | files written / files read | Context utilization |
| Agent stall frequency | count | witness-observer nudge data | Health |
| Agent spawn-to-first-commit | minutes | lifecycle + sessions | Startup efficiency |

### 5.3 Skill-Level Metrics

| Metric | Unit | Source | Why It Matters |
|--------|------|--------|----------------|
| Skill load rate | % | skill-events.jsonl | Usage frequency |
| Skill relevance score | 0-1 | skill-events.jsonl (avg score) | Quality of activation triggers |
| Skill budget impact | chars | sc:status data | Context cost |
| Skill-associated correction rate | % | correlation of loaded skills with correction commits | Skill effectiveness |
| Skill activation-to-action latency | tool calls | tool-calls.jsonl after skill load | Time from loading to first use |

## 6. How Session Analysis Feeds Back Into Skill Improvement

The learning loop is: observe -> store -> analyze -> propose -> review -> apply -> observe again.

**Step 1: Observe.** Hooks capture raw events (tool calls, commits, errors, compaction, agent lifecycle).

**Step 2: Store.** Events append to JSONL files in `.planning/patterns/`.

**Step 3: Analyze.** The `/sc:digest` command (enhanced with tool call analysis) identifies patterns: repeated sequences, high correction rates, file hotspots, agent inefficiencies.

**Step 4: Propose.** When patterns cross the `min_occurrences` threshold (default 3), the pipeline writes a suggestion to `suggestions.json`. The suggestion includes the pattern evidence, proposed skill content, and confidence level.

**Step 5: Review.** The `/sc:suggest` command presents suggestions to the user. Accept, dismiss, or defer. Human judgment is always in the loop -- this is a non-negotiable guardrail.

**Step 6: Apply.** Accepted suggestions become skills (via `skill-creator create`) or agent prompt adjustments. Skills enter the loading pipeline and begin affecting future sessions.

**Step 7: Measure.** The next cycle's analysis measures whether the new skill reduced the target pattern. If correction rate dropped, the skill is working. If it did not, the skill needs refinement or the pattern diagnosis was wrong.

**Closing the loop on specific patterns:**

| Pattern Detected | Proposed Action | Success Metric |
|-----------------|----------------|----------------|
| Same 5 files read at session start | Pre-load via SessionStart hook | Reduction in early-session Read calls |
| Agent type X has 40% correction rate | Refine agent prompt with common corrections | Correction rate drops below 20% |
| Test failures followed by cache clear | Add cache-clear step to test runner | Flaky test rate drops |
| Context fishing (5+ reads without write) | Provide context summary skill for the target domain | Read-to-write ratio improves |
| Tool sequence repeats 5+ times | Create automation skill for the sequence | Sequence collapses to fewer calls |

## 7. Implementation Plan

### Phase 1: Instrument (1-2 sessions)

1. Add `PostToolUse` hook that writes to `tool-calls.jsonl`
2. Add `PostCompact` hook that writes to `compaction-events.jsonl`
3. Add `PermissionDenied` hook that writes to `errors.jsonl`
4. Update `settings-hooks.json` with new hook entries
5. All hooks follow the post-commit hook pattern: POSIX shell, jq, exit 0 on failure

### Phase 2: Basic Analysis (1-2 sessions)

1. Extend `/sc:digest` to read `tool-calls.jsonl` and report tool call distribution
2. Add tool sequence detection (sliding window, hash, count)
3. Add file hotspot detection from tool call file paths
4. Add compaction frequency reporting

### Phase 3: Agent Telemetry (2-3 sessions)

1. Add agent lifecycle tracking (requires `SubagentSpawn` hook or mayor instrumentation)
2. Correlate agent sessions with commit data
3. Report per-agent-type efficiency metrics
4. Feed agent metrics into witness-observer thresholds

### Phase 4: Closed-Loop Learning (ongoing)

1. Connect tool sequence patterns to the suggestion pipeline
2. Add "context pre-load" suggestions based on file access patterns
3. Add "agent prompt refinement" suggestions based on correction rates
4. Implement skill effectiveness measurement (before/after metrics)

### Phase 5: Predictive Layer (future, requires 50+ sessions of data)

1. Build per-task-type file access predictors
2. Build compaction probability estimator
3. Build agent completion time predictor
4. Integrate predictions into mayor-coordinator dispatch decisions

## 8. Risks and Mitigations

**Performance overhead.** Every hook adds latency to tool calls. Mitigation: hooks are shell scripts that append a single line to a file. Measured overhead should be under 5ms per hook invocation. If it exceeds 20ms, switch to asynchronous writes (background process).

**Storage growth.** Tool call data grows linearly with session activity. At 2000 calls/session and 100 sessions/month, that is 200K entries/month. Mitigation: enforce retention policy, compress archived data, consider sampling for high-frequency events.

**Analysis noise.** Not every pattern is meaningful. A tool sequence that repeats 3 times might be coincidence, not a real pattern. Mitigation: cross-session validation (pattern must appear in 3+ distinct sessions), user review gate (no auto-application), and the bounded learning guardrails (20% max change per refinement, 7-day cooldown).

**Privacy.** Session logs contain file paths, commit messages, and tool parameters. For shared repos, `.planning/patterns/` is already in `.gitignore`. For local analysis, data never leaves the machine. If we ever add remote aggregation, it must be opt-in with explicit consent.

**Circular improvement.** If skills are refined based on patterns that were themselves influenced by earlier skills, the system could converge on a local optimum rather than improving. Mitigation: periodically review skill effectiveness with fresh data (sessions where the skill was NOT loaded) to confirm the skill adds value.

## Conclusion

The data is there. Claude Code's hook system exposes tool calls, session lifecycle, file changes, errors, and compaction events. Our existing infrastructure captures a slice of this (commits, manual observations, skill telemetry). The gap is systematic tool call capture, agent lifecycle tracking, and compaction monitoring.

The implementation path is incremental: add hooks, extend analysis, connect to the suggestion pipeline, measure effectiveness. Each phase delivers value independently -- we do not need the full pipeline to start benefiting from tool call distributions or file hotspot detection.

The deepest value is in closing the loop: patterns detected in session data become skills that change future sessions, and we measure whether those changes actually improved the metrics that triggered them. That is not machine learning in the statistical sense -- it is empirical systems engineering. Observe, hypothesize, intervene, measure. The same cycle that built 190+ research projects and 50 milestones, now applied to the tooling itself.
