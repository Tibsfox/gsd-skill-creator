# Lessons — v1.25

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Dependency DAGs should be built early, not as a catch-up exercise.**
   At 20 nodes and 48 edges, the ecosystem is already complex enough that manual dependency tracking is unreliable. Building this DAG earlier would have informed build sequencing decisions throughout v1.16-v1.24.
   _🤖 Status: `investigate` · lesson #131 · needs review_
   > LLM reasoning: v1.44 mentions dependency edges in a knowledge graph but not ecosystem-wide DAG build sequencing.

2. **inotify budget is a real constraint on Linux systems.**
   The 9-factor rationale for inotify over fanotify and the per-subscriber allocation model show that filesystem watching at scale requires explicit resource planning, not just "add a watcher."
   _🤖 Status: `investigate` · lesson #132 · needs review_
   > LLM reasoning: Bio-Physics Sensing snippet is too sparse to confirm inotify budget planning was addressed.

3. **Partial-build compatibility matrices enable incremental adoption.**
   The 3-state degradation tables (full/degraded/unavailable) and 3-tier capability probe protocol mean users can run subsets of the system without everything installed. This is essential for a project of this size.
---
   _🤖 Status: `investigate` · lesson #133 · needs review_
   > LLM reasoning: macOS compatibility hardening hints at platform degradation handling but snippet lacks detail on 3-state matrices.

4. **10,558 lines of specification with no implementation.**
   This release is entirely analytical -- 17 spec documents, zero code changes. The value is real (ecosystem clarity), but the gap between specification and enforcement means these specs could drift if not actively maintained.
   _🤖 Status: `investigate` · lesson #134 · needs review_
   > LLM reasoning: Candidate snippet is unrelated to spec-vs-implementation drift.

5. **99 known-issues cross-referenced but categorization may not age well.**
   The 51 aspirational, 26 environment-dependent, 9 permanent, 13 resolved breakdown is a snapshot. Without a process to re-evaluate periodically, the categories become stale.
   _⚙ Status: `investigate` · lesson #135_
