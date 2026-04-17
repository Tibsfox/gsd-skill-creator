# Lessons — v1.49.19

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Absorbing an external project's patterns (not just code) requires integration documentation at the architecture level.**
   The 10-document guide covers security, trust, topology, and communication -- this is the knowledge that doesn't transfer through code alone.
   _🤖 Status: `applied` (applied in `v1.49.20.1`) · lesson #352 · needs review_
   > LLM reasoning: Documentation Reflections in v1.49.20.1 directly continues the architecture-level integration documentation pattern.

2. **4-stage chipset validation is the right pattern for structured configuration.**
   Schema -> budget -> topology -> channels catches errors at the most specific level possible, producing actionable error messages rather than generic "invalid config" failures.
   _⚙ Status: `investigate` · lesson #353_

3. **Atomic writes with crash recovery should be the default persistence pattern.**
   The StateManager's approach (write to temp, fsync, rename) is the correct way to handle any state that must survive process termination.
   _⚙ Status: `investigate` · lesson #354_

4. **10-document integration guide in `docs/gastown-integration/` is substantial documentation for an absorption.**
   The architecture, security model, trust boundaries, agent topology, communication, dispatch/retirement, upstream intelligence, multi-instance, and GSD milestone workflow documents are thorough, but maintaining synchronization between the docs and the evolving implementation is a recurring cost.
   _⚙ Status: `applied` (applied in `v1.49.20.1`) · lesson #355_

5. **18 TypeScript interfaces without published API documentation.**
   The interfaces define the contracts for gastown integration, but consumers need more than type definitions to understand the intended usage patterns.
   _🤖 Status: `investigate` · lesson #356 · needs review_
   > LLM reasoning: Candidate mentions 'Documentation Reflections' generically; no clear evidence it publishes API docs for the 18 interfaces.
