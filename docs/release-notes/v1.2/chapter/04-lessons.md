# Lessons — v1.2

3 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Automated test case generation from observation patterns creates a flywheel.**
   Real usage produces observations, observations become test cases, test cases validate the system that produces observations.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #9_

2. **Benchmarking infrastructure at v1.2 sets a performance baseline early.**
   Without it, performance regressions from v1.3+ would be invisible until they became painful.
---
   _🤖 Status: `investigate` · lesson #10 · needs review_
   > LLM reasoning: v1.48 Physical Infrastructure pack is unrelated to benchmarking infrastructure continuity.

3. **18 requirements across 14 plans for a test infrastructure release is heavy.**
   Test infrastructure should be lean enough to not need its own extensive test suite -- though the complexity here reflects the non-trivial activation logic being tested.
   _🤖 Status: `investigate` · lesson #11 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack is unrelated to trimming test infrastructure complexity.
