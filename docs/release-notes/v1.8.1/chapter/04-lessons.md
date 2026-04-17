# Lessons — v1.8.1

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Adversarial audits should happen at natural pause points.**
   v1.8.1 follows the v1.8 pipeline release -- a good boundary to stop adding features and stress-test what exists.
   _⚙ Status: `investigate` · lesson #37_

2. **Embedding cache with content-based invalidation and TTL cleanup solves the v1.1 cold-start problem.**
   The HuggingFace model loading that made tests slow (5-second timeout) is now cached, eliminating the performance penalty while keeping the semantic capability.
   _🤖 Status: `investigate` · lesson #38 · needs review_
   > LLM reasoning: v1.46 cache manager is for pipeline state with TTL, not embedding cache invalidation.

3. **Path traversal prevention must be wired into every store.**
   SkillStore, AgentGenerator, TeamStore all needed `assertSafePath` -- one missed store is one vulnerability.
---
   _🤖 Status: `investigate` · lesson #39 · needs review_
   > LLM reasoning: Static site builder snippet doesn't address assertSafePath wiring across stores.

4. **20+ failing tests from mock constructor issues suggests the original test strategy was fragile.**
   Factory function mocks that don't match constructor signatures are a design smell -- the mocks and the real code drifted apart without detection.
   _🤖 Status: `investigate` · lesson #40 · needs review_
   > LLM reasoning: v1.42 adds git workflow skill and coverage reporting but doesn't address mock/constructor drift directly.

5. **37 hard-coded path references accumulated across v1.0-v1.8 before being extracted.**
   Each version added paths without centralizing them. A `paths.ts` module should have existed from v1.0.
   _🤖 Status: `investigate` · lesson #41 · needs review_
   > LLM reasoning: v1.44 PyDMD dogfood is unrelated to centralizing hard-coded path references.
