# Lessons — v1.49.9

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Domain-agnostic frameworks prove themselves on the second domain, not the first.**
   v1.49.8 built the College Structure; v1.49.9 proved it scales. The zero-framework-change replication is the real validation.
   _🤖 Status: `applied` (applied in `v1.49.28`) · lesson #302 · needs review_
   > LLM reasoning: Retro-driven improvements in v1.49.28 represent iterative validation across domains.

2. **Safety wardens must handle domain-specific boundaries.**
   Food safety has temperature floors; mind-body has partner-technique restrictions. The 3-mode enforcement pattern (annotate/gate/redirect) is flexible enough to express both.
   _⚙ Status: `investigate` · lesson #303_

3. **Cultural sensitivity is a safety domain, not a style choice.**
   Treating cultural respect with the same architectural rigor as physical safety (warden-enforced, non-overridable) is the correct design decision.
   _⚙ Status: `investigate` · lesson #304_

4. **16,131 LOC for mind-body content is substantial.**
   Combined with v1.49.8's 17,964 LOC, the `.college/` directory is now 34,000+ LOC across two departments. The flat-atoms architecture from v1.49.10 will address scaling, but the per-department size is worth monitoring.
   _⚙ Status: `investigate` · lesson #305_

5. **Text builds proprioception" is a bold philosophical claim.**
   While it's a deliberate design choice, movement instruction without visual reference is genuinely harder. The Try Sessions mitigate this with minimal-equipment, no-prerequisite entry points, but the limitation is real.
   _⚙ Status: `investigate` · lesson #306_
