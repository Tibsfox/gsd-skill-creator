# Lessons — v1.32

6 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Phase-based agent activation matrices are essential for multi-agent brainstorming.**
   The Critic being active only during Converge and blocked during Diverge is Osborn's core insight implemented architecturally. Without this, evaluation kills ideation.
   _🤖 Status: `investigate` · lesson #168 · needs review_
   > LLM reasoning: SSH Agent Security is unrelated to phase-based agent activation matrices for brainstorming.

2. **Transition confidence scoring with weighted signals prevents premature phase advancement.**
   timer (0.2) + saturation (0.3) + user_signal (0.4) + min_threshold (0.1) means user intent is the strongest signal but not the only one. The system won't advance if saturation is low even if the user signals readiness.
   _⚙ Status: `investigate` · lesson #169_

3. **Affinity mapping with TfIdf clustering (2-8 clusters) and 100% placement guarantee.**
   Every idea gets placed in a cluster -- no orphans. This is important because unplaced ideas are invisible ideas, and brainstorming's value comes from seeing all contributions.
   _🤖 Status: `investigate` · lesson #170 · needs review_
   > LLM reasoning: PyDMD knowledge extraction is unrelated to affinity mapping or TfIdf clustering of ideas.

4. **PRESSURE_PHRASES runtime guard (6 banned phrases) protects the brainstorming space.**
   Phrases like "we need to hurry" or "time is running out" undermine psychological safety. Blocking them at the facilitator level keeps the environment non-judgmental by default.
---
   _🤖 Status: `investigate` · lesson #171 · needs review_
   > LLM reasoning: The Space Between snippet provides no evidence of addressing PRESSURE_PHRASES runtime guard.

5. **8 agents in leader-worker topology is the most complex multi-agent system in the project.**
   Facilitator, Ideator, Questioner, Analyst, Mapper, Persona, Critic, Scribe -- each with phase-specific activation rules. The interaction matrix (which agents are active in which phases) is correct but dense. A visual activation timeline would help understanding.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #172_

6. **Figure storming with 9 constructive historical figures and 6 blocked hostile terms.**
   The blocklist approach (blocking hostile personas) is reactive rather than proactive. An allowlist of constructive-only personas would be a stronger safety guarantee, though it limits creative flexibility.
   _🤖 Status: `investigate` · lesson #173 · needs review_
   > LLM reasoning: Upstream Intelligence Pack does not address allowlist vs blocklist for figure storming personas.
