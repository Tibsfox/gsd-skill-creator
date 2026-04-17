# Lessons — v1.9

7 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Shell injection prevention for `$ARGUMENTS` in `!command` context is a security requirement, not a feature.**
   The v1.10 security hardening release follows immediately, but this specific fix couldn't wait.
   _🤖 Status: `applied` (applied in `v1.10`) · lesson #42 · needs review_
   > LLM reasoning: v1.10 is explicitly the Security Hardening release following the v1.9 shell injection concern.

2. **Ephemeral observation promotion (2+ sessions becomes persistent) is the right learning threshold.**
   One occurrence is noise; two occurrences across sessions is signal. This is the minimum viable evidence bar.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #43_

3. **Mermaid diagrams of skill relationships (`skill-creator graph`) make the system legible.**
   As the skill graph grows, visualization becomes essential for understanding what connects to what.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #44_

4. **A/B evaluation with t-test statistical significance prevents premature optimization.**
   Without statistical rigor, small differences in activation performance would drive changes that are actually noise.
---
   _⚙ Status: `investigate` · lesson #45_

5. **9 phases, 37 plans, and 49 requirements make v1.9 the densest release yet.**
   Spec alignment, progressive disclosure, portability, evaluator-optimizer, MCP, enhanced topologies, session continuity, agentic RAG, and quality-of-life are arguably 3-4 separate releases compressed into one.
   _🤖 Status: `investigate` · lesson #46 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack doesn't address release-density/scope-splitting concerns.

6. **Agentic RAG with corrective iterations (max 3) and diminishing returns check adds complexity to the search path.**
   Simple searches now have a multi-iteration fallback path that's harder to debug when results are unexpected.
   _🤖 Status: `investigate` · lesson #47 · needs review_
   > LLM reasoning: v1.45 static site generator is unrelated to agentic RAG iteration debugging complexity.

7. **Deadlock detection for inter-team communication suggests the team model is approaching distributed systems complexity.**
   Circular wait prevention is a real concern, but it signals that team coordination may be getting harder to reason about.
   _🤖 Status: `investigate` · lesson #48 · needs review_
   > LLM reasoning: PyDMD dogfood is about knowledge extraction, not team coordination complexity or deadlock detection.
