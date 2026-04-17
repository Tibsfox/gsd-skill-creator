# Lessons — v1.33

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **NASA SE phase gates force honest scope assessment.**
   The 14-phase structure with explicit "Not Yet Executed" ratings is more useful than pretending everything shipped. The methodology's rigor exposed what was actually delivered vs. planned.
   _🤖 Status: `investigate` · lesson #174 · needs review_
   > LLM reasoning: Upstream Intelligence Pack doesn't address SE phase gate methodology for scope honesty.

2. **Chipset validation should be automated, not just counted.**
   118/118 checks passing is a strong signal, but the value compounds when those checks run on every change, not just at definition time.
   _🤖 Status: `investigate` · lesson #175 · needs review_
   > LLM reasoning: Git workflow skill and coverage reporting don't specifically automate chipset validation on every change.

3. **Domain skill packs need token budgets from day one.**
   The 8K/30K budget constraint shaped every skill's design. Without it, OpenStack skills would have ballooned into reference manuals that exceed context windows.
   _🤖 Status: `investigate` · lesson #176 · needs review_
   > LLM reasoning: v1.42 git support doesn't address token budgets for domain skill packs.

4. **Dual-index runbooks (task intent + failure symptom) solve the "how do I find the right runbook" problem.**
   44 runbooks with only one index would be a lookup nightmare. Two indexes make the same content accessible from two mental models.
---
   _🤖 Status: `investigate` · lesson #177 · needs review_
   > LLM reasoning: Agent-ready static site with llms.txt is discovery-adjacent but not a dual-index runbook system.

5. **14 phases for a single domain pack is heavy.**
   33 plans across 14 phases and 124 commits suggests the mission scope was too large for a single release. The 3 "Not Yet Executed" phases confirm scope exceeded capacity.
   _🤖 Status: `investigate` · lesson #178 · needs review_
   > LLM reasoning: Gource visualization pack doesn't address scope-sizing for domain packs.

6. **Cross-cloud translation tables are thin coverage.**
   OpenStack to AWS/GCP/Azure translation is useful but hard to keep accurate without automated verification. These could drift silently.
   _🤖 Status: `investigate` · lesson #179 · needs review_
   > LLM reasoning: Git workflow skill and coverage reporting are unrelated to cross-cloud translation table verification.

7. **Documentation crew (8 roles) may be overspecified.**
   8 documentation roles for a system that also has 12 deployment roles and 8 operations roles pushes the total agent count to 31 -- coordination overhead grows quadratically.
   _🤖 Status: `applied` (applied in `v1.34`) · lesson #180 · needs review_
   > LLM reasoning: v1.34 Documentation Ecosystem Refinement directly addresses overspecified documentation crew.
