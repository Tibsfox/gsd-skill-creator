# v1.49.32 — Release Integrity & Agent Heartbeat

**Shipped:** 2026-03-09
**Commits:** 3
**Files:** 9 changed | **Insertions:** 473 | **Deletions:** 31
**Source:** Retrospective review of 95 lessons learned across 28 releases, gap analysis

## Summary

Closes the release integrity gap that caused GitHub releases to ship without full release notes. Adds agent heartbeat monitoring for silent failure detection. Backfills v1.49.30 release notes and completes v1.49.29 Wave 2 process hardening deliverables (wave commit markers, LOC tracking, speculative infrastructure inventory, TypeScript API doc generation).

This release was driven by a retrospective review that surfaced the recurring pattern: release notes written as in-repo files but not included in GitHub release bodies. The root cause — two disconnected manual steps with no validation between them — is now resolved by `publish-release.sh`.

## Key Features

### 1. Release Integrity Script (`scripts/publish-release.sh`)

Single command to validate and publish GitHub releases:
- Validates `docs/release-notes/v{version}/README.md` exists and is non-empty
- Checks for required sections: Summary, Key Features, Retrospective, What Worked or Lessons Learned
- Validates the git tag exists
- Creates or updates the GitHub release with the full README.md content
- Refuses to proceed without complete notes

Eliminates the gap between writing release notes and publishing them.

### 2. Agent Heartbeat Monitor (local, `.claude/` hooks)

Three-file heartbeat system for silent agent failure detection:
- **`agent-heartbeat.js`** (PostToolUse) — records a timestamp on every tool call. Any signal means alive.
- **`agent-heartbeat-watcher.js`** (background) — polls every 60s, sends desktop notification after 10m of no signal. Reminds every 30m if still silent.
- **`agent-heartbeat-start.js`** (SessionStart) — spawns the watcher, writes initial heartbeat.

Design principles: notification only, never intervenes. Investigation is human-initiated. Thresholds will refine from real data-intensive workloads.

### 3. v1.49.30 Release Notes Backfill

FFA (Fur, Feathers & Animation Arts) release notes created and published to GitHub. 6 research modules, 10 cross-domain bridges, 124+ sources, 33/33 tests PASS.

### 4. v1.49.29 Wave 2 Process Hardening (completed in v1.49.31 commit)

- Wave commit marker hook validation
- LOC-per-release tracking in STATE.md
- Speculative infrastructure inventory (`infra/SPECULATIVE-INVENTORY.md`)
- TypeScript API doc generation (`typedoc.json`, `docs:api` npm script)

## Verification

| # | Criterion | Result |
|---|-----------|--------|
| SC-1 | publish-release.sh validates required sections | PASS |
| SC-2 | publish-release.sh blocks on missing notes file | PASS (tested against v1.49.30 before backfill) |
| SC-3 | publish-release.sh updates existing releases | PASS (v1.49.30, v1.49.31 updated) |
| SC-4 | Agent heartbeat records on tool calls | PASS (PostToolUse hook registered) |
| SC-5 | Agent heartbeat watcher spawns at session start | PASS (SessionStart hook registered) |
| SC-6 | v1.49.30 release notes complete | PASS (all required sections present) |

## Retrospective

### What Worked
- **Root cause analysis over symptom treatment.** The release notes gap had been flagged in multiple retrospectives but treated as "remember to do it." Tracing the actual workflow — two disconnected manual steps — revealed the structural fix: a single command that connects them.
- **Minimal heartbeat design.** One timestamp file, one poller, one notification. No escalation ladders, no agent hierarchies, no nudge protocols. The five designs that existed (watchdog agent, witness observer, deacon heartbeat, observer agent, flight-ops) were all over-engineered for the actual problem.
- **Retrospective review as input.** Reading all 95 lessons learned chronologically surfaced both the release notes pattern and the agent silence pattern in a single session.

### What Could Be Better
- **Heartbeat thresholds are untested.** 10 minutes alert, 30 minutes reminder — these are starting values with no data behind them. Real data-intensive workloads will calibrate them.
- **No CI enforcement of release notes.** The script is a manual gate. A pre-push hook or CI check could enforce it automatically, but warning mode is the right default for new tooling.

## Lessons Learned

1. **Two disconnected manual steps will always drift.** If writing release notes and publishing them are separate actions, they will eventually desynchronize. One command that does both eliminates the class of error.
2. **The simplest watchdog is the best first watchdog.** A timestamp and a poller. Everything else — escalation, nudges, restarts — can be added when the data says it's needed. Start with visibility.
3. **Retrospective reviews compound.** Reading 95 lessons in sequence revealed patterns that individual retrospectives couldn't show. The release notes gap was mentioned in v1.49.28, v1.49.29, v1.49.30, and v1.49.31 — but only a cross-cutting review made it actionable.
