# Lessons — v1.40

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Dogfooding reveals pipeline gaps that unit tests miss.**
   Testing sc:learn against The Space Between exercises the full chain: PDF extraction, chapter detection, concept extraction, Complex Plane positioning, cross-referencing, verification, and reporting. Each handoff is a potential failure point.
   _⚙ Status: `applied` (applied in `v1.46`) · lesson #214_

2. **Checkpoint-based ingestion is essential for large documents.**
   A 33-chapter, 923-page document cannot be processed atomically. Checkpoints with SHA-256 integrity hashes make the pipeline resumable and auditable.
   _🤖 Status: `investigate` · lesson #215 · needs review_
   > LLM reasoning: v1.44 PyDMD extraction mentions pipeline but no explicit checkpoint/SHA-256 resumability.

3. **Knowledge patches as proposals (requiresReview=true) enforce human-in-the-loop at the right granularity.**
   The system can identify what to learn and propose changes, but applying those changes requires explicit human review. This is the safety boundary between autonomous analysis and autonomous modification.
---
   _🤖 Status: `investigate` · lesson #216 · needs review_
   > LLM reasoning: v1.44 snippet describes extraction/replay but no explicit requiresReview proposal gate.

4. **Dual-track learning (Track A: Parts I-V, Track B: Parts VI-X) with ~100K tokens per track is a large context budget.**
   The token budget per track may not leave enough room for the merge and verification phases that follow. Budget accounting across the full pipeline would be more informative than per-track limits.
   _🤖 Status: `investigate` · lesson #217 · needs review_
   > LLM reasoning: PyDMD dogfood release doesn't address pipeline-wide token budget accounting across tracks.

5. **362 tests is the lowest count in the v1.33-v1.40 range relative to scope.**
   A pipeline that ingests 923 pages, extracts concepts, positions them on the Complex Plane, verifies coverage, and generates improvement tickets has many failure modes. The test count may be adequate but the risk surface is large.
   _🤖 Status: `applied` (applied in `v1.42`) · lesson #218 · needs review_
   > LLM reasoning: v1.42 adds @vitest/coverage-v8 coverage reporting, directly addressing test adequacy on large risk surface.
