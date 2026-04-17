# Lessons — v1.8

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Capability manifests make skills self-describing.**
   A skill that declares what it needs (model capabilities, phase context) can be filtered without loading and inspecting its content. This is metadata-driven activation.
   _🤖 Status: `investigate` · lesson #32 · needs review_
   > LLM reasoning: Heritage Skills Educational Pack snippet doesn't clearly address capability manifests or metadata-driven activation.

2. **Composable pipelines beat monolithic functions every time.**
   The v1.7 orchestrator loaded skills in one step. The v1.8 pipeline breaks that into 6 stages, each independently testable and replaceable.
   _🤖 Status: `investigate` · lesson #33 · needs review_
   > LLM reasoning: Release Integrity & Agent Heartbeat snippet doesn't clearly demonstrate pipeline decomposition into composable stages.

3. **Wave-based execution from dependency analysis is the natural parallelization strategy for plans.**
   Tasks with no dependencies run in parallel; tasks with dependencies wait. The plan's DAG structure determines the execution schedule.
---
   _🤖 Status: `investigate` · lesson #34 · needs review_
   > LLM reasoning: v1.42 SC Git Support is about git workflows, not wave-based dependency execution.

4. **Cache-aware skill ordering (cacheTier metadata) depends on prompt cache behavior that may change.**
   Optimizing for prompt cache hit rates couples the system to LLM implementation details that aren't part of any stable API contract.
   _🤖 Status: `investigate` · lesson #35 · needs review_
   > LLM reasoning: Upstream Intelligence Pack watches Anthropic changelog but doesn't directly address cacheTier metadata coupling to prompt cache.

5. **The parallelization advisor analyzes plan dependencies to suggest wave-based execution, but wave execution itself isn't implemented yet.**
   The advisor produces recommendations that can't be acted on automatically until later versions add execution support.
   _🤖 Status: `investigate` · lesson #36 · needs review_
   > LLM reasoning: Dashboard snippet doesn't mention wave execution implementation.
