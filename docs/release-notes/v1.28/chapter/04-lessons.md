# Lessons — v1.28

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Overhead verification (<1% of context) is a critical metric.**
   Multi-agent coordination systems can easily consume more context on coordination than on actual work. Proving the overhead stays below 1% means the agents spend their budget on execution, not bureaucracy.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #147_

2. **Deterministic YAML parsing with reproducibility proof for chipsets builds trust.**
   If the same chipset YAML produces different results on different runs, the system is unreliable. The reproducibility proof in Phase 260 ensures that chipset configuration is deterministic.
   _🤖 Status: `investigate` · lesson #148 · needs review_
   > LLM reasoning: Static site build orchestrator snippet doesn't address chipset YAML determinism or reproducibility proofs.

3. **Go/no-go readiness checks and atomic phase transitions prevent partial execution.**
   The Coordinator's readiness checks mean work doesn't start until preconditions are met. Atomic transitions mean phases either complete fully or don't advance -- no half-done states.
---
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #149_

4. **675 tests for a 7-phase coordination system is solid, but the integration exercise (Phase 261) does heavy lifting.**
   The end-to-end lifecycle flow with 4 topology profiles and 7 recovery scenarios is where most integration bugs would surface. More isolated fault injection tests for each division would strengthen confidence.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #150_

5. **ISA compact encoding for the message bus is mentioned but not detailed.**
   The 8 priority levels and dispatcher routing are clear, but the encoding format itself -- how messages are serialized and discriminated -- isn't specified in the release notes.
   _⚙ Status: `investigate` · lesson #151_
