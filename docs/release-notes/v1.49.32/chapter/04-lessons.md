# Lessons — v1.49.32

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Two disconnected manual steps will always drift.**
   If writing release notes and publishing them are separate actions, they will eventually desynchronize. One command that does both eliminates the class of error.
   _⚙ Status: `investigate` · lesson #428_

2. **The simplest watchdog is the best first watchdog.**
   A timestamp and a poller. Everything else — escalation, nudges, restarts — can be added when the data says it's needed. Start with visibility.
   _🤖 Status: `investigate` · lesson #429 · needs review_
   > LLM reasoning: First Frost, Last Frost snippet doesn't clearly describe a minimal timestamp+poller watchdog implementation.

3. **Retrospective reviews compound.**
   Reading 95 lessons in sequence revealed patterns that individual retrospectives couldn't show. The release notes gap was mentioned in v1.49.28, v1.49.29, v1.49.30, and v1.49.31 — but only a cross-cutting review made it actionable.
   _⚙ Status: `investigate` · lesson #430_

4. **Heartbeat thresholds are untested.**
   10 minutes alert, 30 minutes reminder — these are starting values with no data behind them. Real data-intensive workloads will calibrate them.
   _⚙ Status: `investigate` · lesson #431_

5. **No CI enforcement of release notes.**
   The script is a manual gate. A pre-push hook or CI check could enforce it automatically, but warning mode is the right default for new tooling.
   _⚙ Status: `investigate` · lesson #432_
