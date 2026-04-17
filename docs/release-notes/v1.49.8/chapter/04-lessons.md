# Lessons — v1.49.8

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Cooking is the ideal proof-of-concept domain.**
   Universal knowledge, tangible outcomes, hard safety boundaries (food safety temps), and progressive skill building -- it exercises every feature of the College Structure.
   _⚙ Status: `investigate` · lesson #296_

2. **The "teaching reference IS the research" pattern eliminates a full project phase.**
   When the source material is already structured for education, a separate research phase is redundant overhead.
   _🤖 Status: `applied` (applied in `v1.49.22`) · lesson #297 · needs review_
   > LLM reasoning: PNW Research Series leverages pre-structured teaching material as research output, embodying the pattern.

3. **Token budget enforcement at the architecture level (2-5% ceiling) is essential for LLM-integrated education.**
   Without progressive disclosure, any rich educational content will blow the context window.
   _🤖 Status: `investigate` · lesson #298 · needs review_
   > LLM reasoning: Heritage Skills Educational Pack snippet doesn't explicitly mention token budget ceilings or progressive disclosure.

4. **89 commits across 45 plans in ~2 hours demonstrates wave execution with parallelism at scale.**
   5 waves with up to 3 parallel tracks is the throughput ceiling for a single session.
   _🤖 Status: `applied` (applied in `v1.49.60`) · lesson #299 · needs review_
   > LLM reasoning: Inclusionary Wave continues the wave-parallel execution pattern at scale.

5. **17,964 LOC in `.college/` is a large surface area for a proof-of-concept.**
   The 7 wings are thorough but the volume raises questions about maintenance burden as more departments are added.
   _🤖 Status: `superseded` (superseded by `v1.49.10`) · lesson #300 · needs review_
   > LLM reasoning: College Expansion increases surface area rather than addressing maintenance concern, indicating the concern was set aside for growth.

6. **The foxfooding claim (GSD mapped to Rosetta Core, development mapped to Calibration) is architectural assertion, not tested integration.**
   The mapping is conceptually clean but not enforced by code.
   _🤖 Status: `investigate` · lesson #301 · needs review_
   > LLM reasoning: Muse/MCP pipeline doesn't directly test GSD↔Rosetta Core mapping integration.
