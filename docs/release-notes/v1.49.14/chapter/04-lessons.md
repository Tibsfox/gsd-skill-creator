# Lessons — v1.49.14

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **One dependency per resolution invocation is the correct blast radius.**
   When something breaks, you know exactly which change caused it. Batch dependency updates are a false efficiency.
   _⚙ Status: `investigate` · lesson #325_

2. **Code absorption has a hard ceiling of applicability.**
   The criteria gate (<=500 LOC, pure functions, no crypto/parsers) correctly identifies the narrow band where internalization is safer than dependency management. Most packages are too large, too stateful, or too security-sensitive.
   _🤖 Status: `investigate` · lesson #326 · needs review_
   > LLM reasoning: Retrospective process hardening doesn't specifically address code absorption criteria gates.

3. **Append-only health logs with mandatory provenance create an auditable supply chain record.**
   Timestamp + packageVersion + decisionRationale in every entry means the "why" of every dependency decision is preserved.
   _⚙ Status: `investigate` · lesson #327_

4. **The <=20% tranche replacement pattern prevents big-bang breakage during absorption.**
   Gradual call-site migration with the old and new implementations running in parallel is the safe path.
   _⚙ Status: `investigate` · lesson #328_

5. **353 new tests for 10,680 LOC across 86 files.**
   The test-to-source ratio (~3.3%) is lower than v1.49.8's coverage. The Absorber module in particular handles complex state transitions that would benefit from more edge case coverage.
   _⚙ Status: `investigate` · lesson #329_

6. **Cross-project pattern learning requires 5+ projects to trigger.**
   For a single-project setup (which is the current default), this feature is dormant. The threshold makes sense for a multi-project ecosystem but provides no value until that ecosystem exists.
   _⚙ Status: `investigate` · lesson #330_
