# Lessons — v1.49.15

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Multi-model mesh architecture requires a model abstraction layer before anything else.**
   Chip drivers for OpenAI-compatible and Anthropic endpoints normalize the interface so routing, evaluation, and failover can be provider-agnostic.
   _⚙ Status: `investigate` · lesson #331_

2. **Context preservation across mesh boundaries is the hard problem.**
   Transcript summarization with fidelity-adaptive compression is a trade-off between context length and quality. Getting this wrong means models operate with degraded context after handoff.
   _🤖 Status: `investigate` · lesson #332 · needs review_
   > LLM reasoning: Process hardening snippet doesn't directly address transcript summarization or context preservation across mesh boundaries.

3. **MCP infrastructure (queuing, timeout, health monitoring, stale eviction) is unglamorous but essential.**
   Without per-chip queuing and health probing, the mesh degrades silently under load.
   _🤖 Status: `applied` (applied in `v1.49.71`) · lesson #333 · needs review_
   > LLM reasoning: Blue Infrastructure release directly targets unglamorous MCP infrastructure work (queuing, health, eviction).

4. **~17,400 LOC is the largest single-milestone code addition in the v1.49.x series.**
   The mesh architecture is comprehensive but the volume means significant surface area to maintain. The abstraction layer (chip drivers, registry) is the most likely to need updates as LLM provider APIs evolve.
   _🤖 Status: `investigate` · lesson #334 · needs review_
   > LLM reasoning: PNW Research Series is unrelated to mesh LOC maintenance burden or chip driver abstraction upkeep.

5. **Cost-aware routing is mentioned but details are thin.**
   The scoring functions enable cost-aware selection, but the actual cost models for different providers aren't documented in the release notes.
   _🤖 Status: `investigate` · lesson #335 · needs review_
   > LLM reasoning: Chorus Protocol spatial awareness doesn't document per-provider cost models that the lesson flagged as missing.
