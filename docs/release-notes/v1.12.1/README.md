# v1.12.1 — Live Metrics Dashboard

**Shipped:** 2026-02-12
**Phases:** 94-100 (7 phases) | **Plans:** 14 | **Requirements:** 30

Real-time visibility into GSD session activity, phase velocity, planning quality, and historical trends -- sampled at rates matching each metric's natural update frequency.

### Key Features

**Three-Tier Sample Rate Engine:**
- Hot tier (1-2s): Live session pulse, active metrics
- Warm tier (5-10s): Phase velocity, planning quality
- Cold tier (on-change): Historical trends, milestone comparisons
- Per-section JavaScript refresh with independent polling rates

**Data Collectors:**
- Git metrics, session observations, and planning artifact collectors
- Typed object architecture (not HTML generation)
- Graceful degradation for all missing data sources

**Live Session Pulse (Hot Tier):**
- Active session card with ticking duration and heartbeat indicator
- Commit feed showing recent commits
- Message queue counters (pending/done)

**Phase Velocity Metrics (Warm Tier):**
- Timeline visualization showing phase progression
- Per-phase stats table (duration, commits, status)
- TDD rhythm analysis (RED/GREEN cycle detection)

**Planning Quality Metrics (Warm Tier):**
- Accuracy scores (plan vs actual), emergent work ratio
- Deviation summaries and accuracy trend sparkline

**Historical Trends (Cold Tier):**
- Milestone comparison table, commit type distribution
- Velocity curves over time, file hotspots

### Technical Details

- CSS-only visualizations (no D3/Chart.js) -- works from `file://` protocol
- Full pipeline integration: parser -> collector -> renderer with `--live` flag
- 221 new metric tests, 460 total dashboard tests across 37 test files

---
