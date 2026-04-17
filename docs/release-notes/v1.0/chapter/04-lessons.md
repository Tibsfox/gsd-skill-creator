# Lessons — v1.0

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Start with the loop, not the features.**
   The 6-step cycle defines what the system IS. Getting the loop right at v1.0 means every subsequent version extends rather than restructures.
   _⚙ Status: `investigate` · lesson #1_

2. **Bounded parameters are a design decision, not an optimization.**
   The specific numbers (3 corrections, 7-day cooldown, 20% max change) are assertions about how learning should work -- they encode a philosophy of conservative adaptation.
   _🤖 Status: `investigate` · lesson #2 · needs review_
   > LLM reasoning: Information Design System in v1.18 doesn't clearly address bounded learning parameters philosophy.

3. **Agent generation from stable skill clusters is the natural composition endpoint.**
   The 5+ co-activations over 7+ days threshold means agents emerge from evidence, not speculation.
---
   _🤖 Status: `investigate` · lesson #3 · needs review_
   > LLM reasoning: v1.45 Agent-Ready Static Site is about llms.txt/AGENTS.md generation, not agent emergence from co-activation thresholds.

4. **43 requirements across 15 plans is a lot for a v1.0.**
   The scope is ambitious for a foundation release -- the risk is building more surface area than can be validated before real usage patterns emerge.
   _⚙ Status: `investigate` · lesson #4_

5. **Token budget tracking is speculative at this stage.**
   Without real session data, the savings estimation and cost-benefit flagging are necessarily theoretical.
   _🤖 Status: `applied` (applied in `v1.8`) · lesson #5 · needs review_
   > LLM reasoning: v1.8 Capability-Aware Planning + Token Efficiency directly addresses token budget concerns with real planning logic.
