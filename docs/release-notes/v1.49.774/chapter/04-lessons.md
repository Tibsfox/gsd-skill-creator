# Lessons — v1.49.774

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Substrate-vocabulary token-repetition collapse in long sub-agent prose is a distinct trip class.**
   Future dispatch prompts should explicitly require dedication paragraph to be ≤200 words AND forbid the word "substrate" appearing more than 5 times in any single paragraph.
   _⚙ Status: `investigate` · lesson #11132_

2. **Main-context salvage for sidebar + dedication + nav-card is ~5 Edits.**
   Cost is bounded; pattern is reliable.
   _⚙ Status: `investigate` · lesson #11133_

3. **8 consecutive fresh-builds + 2 salvages = 10/10 successful ships in this run.**
   Path A pattern with salvage is robust at this scale.
   _⚙ Status: `investigate` · lesson #11134_

4. **Two consecutive sub-agent trips in this autonomous run**
   (v772 + v774). Trip mechanism is now characterized: substrate-vocabulary token-repetition collapse in dedication paragraph during long prose generation. Forward-preventive: future dispatch prompts should (a) cap dedication paragraph word count, (b) explicitly forbid substrate-vocabulary repetition in dedication, or (c) author dedication in main-context rather than sub-agent.
   _⚙ Status: `investigate` · lesson #11135_

5. **API error analysis added to handoff**
   for forward-preventive reference.
   _⚙ Status: `investigate` · lesson #11136_
