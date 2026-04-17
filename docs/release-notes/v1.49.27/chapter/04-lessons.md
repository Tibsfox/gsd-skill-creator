# Lessons — v1.49.27

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Build-check hooks catch what tests miss.**
   The 285 tests all passed but `tsc --noEmit` caught the Zod v4 type error. Runtime behavior was correct (Zod v3 accepts single-arg `z.record()`), but the type signatures were wrong. Hooks as quality gates work.
   _⚙ Status: `investigate` · lesson #395_

2. **Explicit phase advancement > timer-based for testability.**
   The Frog Protocol could have used `setTimeout` for phase transitions, but explicit `advancePhase()` calls made every state transition deterministic and testable. This is the right pattern for any protocol state machine.
   _⚙ Status: `investigate` · lesson #396_

3. **Physical output mapping makes abstract systems concrete.**
   Seeing "ASSESS = orange, pulsing at 1Hz" on an LED strip or DMX fixture gives immediate feedback about system state that log files can't match. The output synthesis layer is an investment in operational visibility.
   _🤖 Status: `investigate` · lesson #397 · needs review_
   > LLM reasoning: A sysadmin handbook doesn't clearly demonstrate physical LED/DMX output synthesis for system state.

4. **The Paula Chipset is growing.**
   With audio-engineering (Release 1) and spatial-awareness (Release 2), the chipset architecture is proving extensible. Each release adds modules without modifying existing ones — the barrel export pattern and typed interfaces keep modules orthogonal.
   _⚙ Status: `investigate` · lesson #398_

5. **Two `z.record(z.unknown())` calls slipped through to Wave 0.**
   The Zod v4 incompatibility (needs `z.record(z.string(), z.unknown())`) was documented in the handoff but wasn't caught until the build-check hook blocked the push. Future waves should run `tsc --noEmit` as part of the pre-commit, not just pre-push.
   _🤖 Status: `investigate` · lesson #399 · needs review_
   > LLM reasoning: Candidate snippet about Inclusionary Wave doesn't address Zod validation or pre-commit tsc hooks.

6. **Wave 2+3 combined into a single commit.**
   Ideally the Frog Protocol (Wave 2) and verification suites (Wave 3) would have separate commits for cleaner bisect history. The session boundary forced a combined commit.
   _🤖 Status: `investigate` · lesson #400 · needs review_
   > LLM reasoning: Inclusionary Wave snippet doesn't indicate any change to wave commit separation practices.
