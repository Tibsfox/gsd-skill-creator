# Lessons — v1.20

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Assembly releases are essential after feature sprints.**
   v1.12-v1.19 built 13 independent components. Without this dedicated wiring release, they would remain orphaned demos. Planning for integration work as its own milestone prevents feature sprawl.
   _🤖 Status: `investigate` · lesson #102 · needs review_
   > LLM reasoning: v1.46 is another feature pack, not a dedicated integration/assembly milestone addressing sprawl.

2. **Gray-matter parsing for SKILL.md files makes topology data real.**
   The topology collector reading actual skill/agent/team files means the dashboard shows real state, not mock data. This is the difference between a demo and a tool.
   _🤖 Status: `investigate` · lesson #103 · needs review_
   > LLM reasoning: v1.42 adds git workflow skill but doesn't specifically address gray-matter SKILL.md parsing for topology.

3. **Git commits as activity feed source is clever reuse.**
   The activity feed collector transforming git history into FeedEntry[] means the dashboard shows real project activity with zero additional instrumentation cost.
---
   _🤖 Status: `investigate` · lesson #104 · needs review_
   > LLM reasoning: v1.36 citation management is unrelated to git-history-as-activity-feed reuse.

4. **110 tests across 12 plans is the lightest test count in the v1.12-v1.20 arc.**
   Integration wiring is harder to test than isolated features, but the data collectors especially need contract tests to verify they produce the shapes renderers expect.
   _🤖 Status: `applied` (applied in `v1.42`) · lesson #105 · needs review_
   > LLM reasoning: v1.42 explicitly adds @vitest/coverage-v8 coverage reporting, directly addressing the test-thinness concern.

5. **Console as a 6th generated page adds maintenance burden.**
   Every change to the generator pipeline now affects 6 output pages. A template or component model would reduce duplication.
   _🤖 Status: `applied` (applied in `v1.45`) · lesson #106 · needs review_
   > LLM reasoning: v1.45 introduces a Mustache-style template engine with partials covering 7 page variants, directly addressing the duplication burden.
