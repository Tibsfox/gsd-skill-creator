# Lessons — v1.46

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Upstream monitoring is defensive infrastructure.**
   Anthropic API changes, Claude Code updates, and SDK evolution can break skill-creator at any time. Detecting changes early and generating impact assessments automatically converts surprise into planned work.
   _🤖 Status: `investigate` · lesson #242 · needs review_
   > LLM reasoning: Physical Infrastructure Engineering Pack is unrelated to upstream API/SDK change monitoring.

2. **Session recovery with state snapshots makes monitoring pipelines resilient to interruption.**
   A monitoring system that loses its state on restart is useless for tracking changes over time. Channel state persistence with resume capability is essential for continuous monitoring.
   _⚙ Status: `investigate` · lesson #243_

3. **Change provenance (TRACER) is the missing piece in most monitoring systems.**
   Knowing that something changed is useful. Knowing why it changed, who changed it, and what else was affected in the same change set is what makes impact assessment accurate.
   _🤖 Status: `investigate` · lesson #244 · needs review_
   > LLM reasoning: Bio-Physics Sensing Systems snippet does not address TRACER change-provenance for monitoring.

4. **Channel monitors for Anthropic API changelog, Claude Code releases, SDK updates, and community discussions require external connectivity.**
   The monitoring agents depend on external sources that can change format, go offline, or require authentication. The test corpus validates parsing, but not connectivity resilience.
   _🤖 Status: `investigate` · lesson #245 · needs review_
   > LLM reasoning: Candidate 'Cooking With Claude' doesn't address connectivity resilience for monitoring agents.

5. **14 safety-critical + 8 edge case tests is a modest safety test count for a system that proposes code patches.**
   PATCHER generates adaptation patches from upstream changes. Auto-generated patches are a high-risk output that deserves adversarial testing beyond 22 tests.
   _🤖 Status: `investigate` · lesson #246 · needs review_
   > LLM reasoning: Filesystem Management Strategy is unrelated to adversarial testing of PATCHER outputs.
