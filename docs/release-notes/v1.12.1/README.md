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

## Retrospective

### What Worked
- **Three-tier sample rate engine (hot 1-2s, warm 5-10s, cold on-change) matches refresh frequency to metric volatility.** Session pulse changes every second; historical trends change when milestones complete. Polling everything at the same rate wastes resources; tiered sampling is the right design.
- **CSS-only visualizations (no D3/Chart.js) continue the `file://` protocol discipline from v1.12.** Sparklines, timelines, and distribution charts rendered with pure CSS keep the zero-dependency constraint intact.
- **TDD rhythm analysis (RED/GREEN cycle detection) in the phase velocity metrics provides unique insight.** Most dashboards show commits over time; this one detects whether the development process is following the planned test-driven pattern.
- **460 total dashboard tests across 37 test files (221 new) shows the dashboard test suite is scaling with features.**

### What Could Be Better
- **Per-section JavaScript refresh with independent polling rates adds complexity to the browser runtime.** Multiple independent timers polling different data sources at different rates can cause visual jitter and race conditions in the DOM.
- **7 phases for what is functionally a metrics extension to v1.12 suggests scope expansion.** The three-tier engine, data collectors, and four dashboard sections could arguably have been 3-4 phases.

## Lessons Learned

1. **Typed object architecture for collectors (not HTML generation) separates data from presentation.** Collectors produce structured data; renderers produce HTML. This lets the same collector feed multiple views or export formats.
2. **Planning quality metrics (accuracy scores, emergent work ratio) make the planning process measurable.** Without them, planning quality is a subjective assessment. With them, you can track whether plans are getting more accurate over time.
3. **Graceful degradation for all missing data sources prevents dashboard crashes in new projects.** A dashboard that requires every data source to exist is unusable on a project that just started. Missing data shows empty sections, not errors.

---
