# Lessons — v1.24

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Conformance audits should happen regularly, not as a one-time event.**
   The gap between 18 vision documents and implementation grew over multiple releases. Periodic conformance checks would catch drift earlier and keep amendment counts lower.
   _🤖 Status: `investigate` · lesson #126 · needs review_
   > LLM reasoning: v1.46 upstream intelligence monitors external changes, not internal vision-to-implementation conformance drift.

2. **Vision document amendments are a feature, not a failure.**
   The 8 deferral categories document deliberate architectural decisions (AGC as the ISA instead of GSD ISA, native PTY instead of Wetty). These are choices, not bugs.
   _🤖 Status: `applied` (applied in `v1.30`) · lesson #127 · needs review_
   > LLM reasoning: v1.30 Vision-to-Mission Pipeline formalizes vision documents as iterative artifacts, treating amendments as part of the process.

3. **Dependency graph analysis during conformance reveals structural risks.**
   The 15 high-fan-out nodes and 5 critical paths identified in the conformance matrix are the same nodes where a single failure cascades. This analysis doubles as architectural risk assessment.
---
   _🤖 Status: `investigate` · lesson #128 · needs review_
   > LLM reasoning: v1.44 PyDMD dogfood maps concepts into a knowledge graph but doesn't clearly perform dependency-graph risk analysis.

4. **125 amendments out of 336 checkpoints (37%) is a high amendment rate.**
   This reflects ambitious vision documents more than implementation gaps, but it raises the question of whether the visions should be scoped more tightly to what's buildable in one release cycle.
   _🤖 Status: `investigate` · lesson #129 · needs review_
   > LLM reasoning: Candidate v1.42 adds git workflow tooling, not vision-scoping discipline for amendment rates.

5. **Stretch phase (4-VM clean-room verification) was deferred.**
   The hardware inventory shows the capability exists (i7-6700K, 60GB RAM, KVM, 27.5TB storage), but the ~4-6h IaC gap for multi-VM orchestration wasn't prioritized. This would have been the strongest possible proof.
   _🤖 Status: `deferred` · lesson #130 · needs review_
   > LLM reasoning: v1.44 PyDMD dogfood is unrelated to multi-VM clean-room verification IaC work.
