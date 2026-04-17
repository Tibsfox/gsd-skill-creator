# Lessons — v1.7

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **The orchestrator is the system's spine.**
   Everything before v1.7 built components; v1.7 connects them. Without an orchestrator, skills/agents/teams are isolated capabilities with no coordination layer.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #27_

2. **Verbosity levels and confirmation gates are UX decisions, not afterthoughts.**
   A system that does things automatically without asking is terrifying; one that asks about everything is annoying. The gates are the dial between those extremes.
   _⚙ Status: `investigate` · lesson #28_

3. **Event-based skill activation (emit/listen) enables emergent behavior.**
   Skills that react to other skills' outputs create chains that weren't explicitly designed -- this is where the system starts behaving adaptively rather than procedurally.
---
   _🤖 Status: `investigate` · lesson #29 · needs review_
   > LLM reasoning: v1.42 git workflow doesn't introduce emit/listen event-based activation.

4. **16 phases, 38 plans, and 42 requirements make this the largest release so far.**
   The orchestrator is the integration point for everything built in v1.0-v1.6, so the scope is justified, but the surface area is significant.
   _🤖 Status: `investigate` · lesson #30 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack is unrelated to orchestrator scope management from v1.7.

5. **Crash recovery for workflows is mentioned but hard to test.**
   Multi-step skill chains that fail mid-execution need deterministic recovery, which requires simulating partial failures -- a testing challenge that may not be fully addressed yet.
   _🤖 Status: `applied` (applied in `v1.46`) · lesson #31 · needs review_
   > LLM reasoning: v1.46 adds append-only JSONL logger and rollback support for pipeline state recovery, directly addressing crash recovery.
