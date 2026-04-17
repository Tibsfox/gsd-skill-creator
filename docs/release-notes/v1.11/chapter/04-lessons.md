# Lessons — v1.11

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Graceful degradation is the integration contract.**
   If skill loading fails, the GSD command runs normally. This means the integration can never make things worse -- only better or neutral.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #54_

2. **Scan-on-demand architecture (triggered by slash/wrapper commands) avoids background processing costs.**
   The system only does work when asked, which means idle sessions consume zero resources.
   _🤖 Status: `investigate` · lesson #55 · needs review_
   > LLM reasoning: v1.42 git skill is unrelated to scan-on-demand architecture.

3. **STATE.md transition detection bridges two systems with a shared artifact.**
   Both GSD and skill-creator read STATE.md, which makes it a natural integration point without introducing new IPC mechanisms.
---
   _🤖 Status: `investigate` · lesson #56 · needs review_
   > LLM reasoning: v1.46 upstream intelligence pack doesn't directly address STATE.md integration.

4. **6 slash commands and 4 wrapper commands create a wide command surface.**
   `/sc:start`, `/sc:status`, `/sc:suggest`, `/sc:observe`, `/sc:digest`, `/sc:wrap`, plus `/wrap:execute`, `/wrap:verify`, `/wrap:plan`, `/wrap:phase` -- users need to learn 10 new commands. A single entry point with subcommands would be more discoverable.
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #57_

5. **Plan-vs-summary diffing for scope changes is valuable but requires consistent plan formatting.**
   If plans and summaries use different structures, the diff will produce false positives.
   _🤖 Status: `applied` (applied in `v1.12`) · lesson #58 · needs review_
   > LLM reasoning: v1.12 dashboard provides consistent plan formatting enabling reliable diffing.
