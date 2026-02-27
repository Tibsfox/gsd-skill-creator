# v1.46 Lessons Learned — Upstream Intelligence Pack

## LLIS-46-01: Proactive Upstream Monitoring

**Category:** Architecture
**Impact:** High

Rather than reacting to breaking changes after they occur, the upstream intelligence pack detects changes early and generates adaptation patches proactively. This shifts the cost from emergency fixes to planned adaptations.

**Recommendation:** Any project depending on external APIs should have automated upstream monitoring, not just version pinning.

## LLIS-46-02: Agent-Per-Concern for Monitoring

**Category:** Architecture
**Impact:** Medium

Five specialized agents (SENTINEL, ANALYST, TRACER, PATCHER, HERALD) perform better than a single monitoring agent because each concern has different cadence, complexity, and failure modes.

**Recommendation:** Decompose monitoring into specialized agents that can operate, fail, and recover independently.

## LLIS-46-03: Historical Test Corpus Pattern

**Category:** Testing
**Impact:** High

Building a corpus of 50 real historical change events (not synthetic) enabled realistic pipeline validation. The corpus also serves as documentation of actual upstream change patterns.

**Recommendation:** For any data pipeline, build a test corpus from real historical data before writing tests against it.
