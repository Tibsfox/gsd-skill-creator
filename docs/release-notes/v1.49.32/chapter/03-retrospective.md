# Retrospective — v1.49.32

## What Worked

- **Root cause analysis over symptom treatment.** The release notes gap had been flagged in multiple retrospectives but treated as "remember to do it." Tracing the actual workflow — two disconnected manual steps — revealed the structural fix: a single command that connects them.
- **Minimal heartbeat design.** One timestamp file, one poller, one notification. No escalation ladders, no agent hierarchies, no nudge protocols. The five designs that existed (watchdog agent, witness observer, deacon heartbeat, observer agent, flight-ops) were all over-engineered for the actual problem.
- **Retrospective review as input.** Reading all 95 lessons learned chronologically surfaced both the release notes pattern and the agent silence pattern in a single session.

## What Could Be Better

- **Heartbeat thresholds are untested.** 10 minutes alert, 30 minutes reminder — these are starting values with no data behind them. Real data-intensive workloads will calibrate them.
- **No CI enforcement of release notes.** The script is a manual gate. A pre-push hook or CI check could enforce it automatically, but warning mode is the right default for new tooling.

## Lessons Learned

1. **Two disconnected manual steps will always drift.** If writing release notes and publishing them are separate actions, they will eventually desynchronize. One command that does both eliminates the class of error.
2. **The simplest watchdog is the best first watchdog.** A timestamp and a poller. Everything else — escalation, nudges, restarts — can be added when the data says it's needed. Start with visibility.
3. **Retrospective reviews compound.** Reading 95 lessons in sequence revealed patterns that individual retrospectives couldn't show. The release notes gap was mentioned in v1.49.28, v1.49.29, v1.49.30, and v1.49.31 — but only a cross-cutting review made it actionable.
