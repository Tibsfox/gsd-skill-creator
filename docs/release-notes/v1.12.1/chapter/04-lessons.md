# Lessons — v1.12.1

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Typed object architecture for collectors (not HTML generation) separates data from presentation.**
   Collectors produce structured data; renderers produce HTML. This lets the same collector feed multiple views or export formats.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #64_

2. **Planning quality metrics (accuracy scores, emergent work ratio) make the planning process measurable.**
   Without them, planning quality is a subjective assessment. With them, you can track whether plans are getting more accurate over time.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #65_

3. **Graceful degradation for all missing data sources prevents dashboard crashes in new projects.**
   A dashboard that requires every data source to exist is unusable on a project that just started. Missing data shows empty sections, not errors.
---
   _⚙ Status: `applied` (applied in `v1.49.7`) · lesson #66_

4. **Per-section JavaScript refresh with independent polling rates adds complexity to the browser runtime.**
   Multiple independent timers polling different data sources at different rates can cause visual jitter and race conditions in the DOM.
   _🤖 Status: `superseded` (superseded by `v1.45`) · lesson #67 · needs review_
   > LLM reasoning: v1.45 shifts to a static site build pipeline (agent-ready static output), replacing per-section JS polling with static generation.

5. **7 phases for what is functionally a metrics extension to v1.12 suggests scope expansion.**
   The three-tier engine, data collectors, and four dashboard sections could arguably have been 3-4 phases.
   _🤖 Status: `deferred` · lesson #68 · needs review_
   > LLM reasoning: Candidate is an unrelated Aminet extension pack; no evidence scope-expansion concern was acted upon.
