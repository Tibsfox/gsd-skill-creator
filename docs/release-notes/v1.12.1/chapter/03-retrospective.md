# Retrospective — v1.12.1

## What Worked

- **Three-tier sample rate engine (hot 1-2s, warm 5-10s, cold on-change) matches refresh frequency to metric volatility.** Session pulse changes every second; historical trends change when milestones complete. Polling everything at the same rate wastes resources; tiered sampling is the right design.
- **CSS-only visualizations (no D3/Chart.js) continue the `file://` protocol discipline from v1.12.** Sparklines, timelines, and distribution charts rendered with pure CSS keep the zero-dependency constraint intact.
- **TDD rhythm analysis (RED/GREEN cycle detection) in the phase velocity metrics provides unique insight.** Most dashboards show commits over time; this one detects whether the development process is following the planned test-driven pattern.
- **460 total dashboard tests across 37 test files (221 new) shows the dashboard test suite is scaling with features.**

## What Could Be Better

- **Per-section JavaScript refresh with independent polling rates adds complexity to the browser runtime.** Multiple independent timers polling different data sources at different rates can cause visual jitter and race conditions in the DOM.
- **7 phases for what is functionally a metrics extension to v1.12 suggests scope expansion.** The three-tier engine, data collectors, and four dashboard sections could arguably have been 3-4 phases.

## Lessons Learned

1. **Typed object architecture for collectors (not HTML generation) separates data from presentation.** Collectors produce structured data; renderers produce HTML. This lets the same collector feed multiple views or export formats.
2. **Planning quality metrics (accuracy scores, emergent work ratio) make the planning process measurable.** Without them, planning quality is a subjective assessment. With them, you can track whether plans are getting more accurate over time.
3. **Graceful degradation for all missing data sources prevents dashboard crashes in new projects.** A dashboard that requires every data source to exist is unusable on a project that just started. Missing data shows empty sections, not errors.

---
