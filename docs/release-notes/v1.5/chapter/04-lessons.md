# Lessons — v1.5

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **File co-occurrence analysis detects implicit relationships.**
   Files that are always modified together reveal structural coupling that isn't visible in import graphs or dependency declarations.
   _🤖 Status: `investigate` · lesson #19 · needs review_
   > LLM reasoning: v1.42 git workflow skill doesn't implement file co-occurrence analysis.

2. **Draft skill generation closes the loop from observation to action.**
   Without it, pattern discovery produces interesting data but no executable output. The draft is the bridge from "we noticed this" to "here's what to do about it."
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #20_

3. **CLI commands (`scan`, `patterns`) make discovery an on-demand operation.**
   The user decides when to look for patterns, which keeps the system predictable rather than surprising.
---
   _⚙ Status: `applied` (applied in `v1.42`) · lesson #21_

4. **Confidence scoring on draft skills needs validation against real acceptance rates.**
   Without feedback on whether generated drafts are actually useful, the confidence scores are uncalibrated -- they measure internal consistency, not external value.
   _🤖 Status: `investigate` · lesson #22 · needs review_
   > LLM reasoning: v1.42 git support doesn't calibrate confidence scoring against acceptance rates.

5. **20 plans across 27 requirements is heavy for a discovery system.**
   The discovery pipeline itself is now complex enough to need its own testing -- and it will need its own test cases from v1.2's infrastructure.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #23_
