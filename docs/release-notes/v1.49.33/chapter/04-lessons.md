# Lessons — v1.49.33

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Integrate as you build.**
   Series index updates should ship with the module, not accumulate. LED, TIBS, FFA, and SYS integration all landed in this release when they could have been incremental.
   _⚙ Status: `investigate` · lesson #433_

2. **Working code validates research.**
   The SYS PoC server proves the trust-based throttling model works. A 528-line zero-dependency server is worth more than 1,000 lines of description. Build the thing you're documenting.
   _🤖 Status: `investigate` · lesson #434 · needs review_
   > LLM reasoning: AWF Living Systems Research snippet suggests research work but doesn't clearly show a working-code-validates-research build.

3. **Handoff documents are session insurance.**
   The SYS handoff captured 167 lines of context including Fox infrastructure company design, personal history, and philosophical threads. All of it survived the session boundary intact.
   _⚙ Status: `investigate` · lesson #435_

4. **27K LOC exceeds the 15K flag.**
   Two full research studies in one release is large. LED and SYS were built in separate sessions but shipped together because the intermediate work (process tooling, release notes) hadn't been released yet.
   _⚙ Status: `investigate` · lesson #436_

5. **LED integration was carried from prior session.**
   The LED module was built but not integrated into the series index until this release. Earlier integration would have kept releases smaller.
   _⚙ Status: `investigate` · lesson #437_
