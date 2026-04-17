# Lessons — v1.27

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Uniform pack structure enables generic tooling.**
   The 5-file pack format (vision, modules, activities, assessment, resources) means the pack browser, progress tracker, and skill tree visualization all work without pack-specific code. Adding pack #36 requires zero tool changes.
   _🤖 Status: `investigate` · lesson #142 · needs review_
   > LLM reasoning: Candidate snippet only names a pack title without showing pack-structure tooling evidence.

2. **Learning pattern detection should be confidence-scored, not binary.**
   Threshold filtering on confidence scores means the system doesn't overreact to noise. A single fast completion doesn't trigger acceleration; a sustained pattern does.
   _⚙ Status: `applied` (applied in `v1.44`) · lesson #143_

3. **AMIGA EventEnvelope as the bridge format pays off here.**
   The KnowledgeEventBridge converting pack events to AMIGA format with priority escalation for pack_complete means the knowledge system integrates with the broader event infrastructure without a custom integration layer.
---
   _🤖 Status: `investigate` · lesson #144 · needs review_
   > LLM reasoning: PyDMD dogfood snippet doesn't mention AMIGA EventEnvelope or KnowledgeEventBridge integration.

4. **35 packs at 101-level depth only.**
   All packs are introductory. The 3-tier structure (Core Academic, Applied, Specialized) provides breadth, but the prerequisite chains in the dependency graph are necessarily shallow. 201-level packs would test whether the architecture handles deeper prerequisite trees.
   _⚙ Status: `investigate` · lesson #145_

5. **Content authoring at 2.0% token budget.**
   The 8.0% total KP-agent budget with only 2.0% for content authoring may be tight for generating high-quality educational content across 35 packs. The map-reduce topology helps with parallelism but the per-pack budget is thin.
   _🤖 Status: `investigate` · lesson #146 · needs review_
   > LLM reasoning: Static site generator snippet is unrelated to KP-agent content-authoring token budgets.
