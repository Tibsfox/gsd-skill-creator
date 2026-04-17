# Retrospective — v1.40

## What Worked

- **Dogfooding sc:learn with a 923-page, 33-chapter source is a real stress test.** The Space Between isn't a toy input -- it's a full-length manuscript with LaTeX math, TikZ diagrams, MusiXTeX notation, exercises, and build labs. If the pipeline handles this, it handles most documents.
- **Atomic checkpoint write/read with SHA-256 integrity hash.** Multi-session resume with validation means a 33-chapter ingestion doesn't have to complete in one session. This is critical for large documents where the pipeline might be interrupted.
- **3-track verification (concept coverage, cross-document consistency, eight-layer progression).** Verification isn't one check -- it's three orthogonal audits. Bidirectional knowledge diffing with Jaccard similarity and an 8-type gap taxonomy with 4-level severity provide specific, actionable feedback.
- **Safety validator enforces bounded learning (<=20%) and blocks auto-application.** Knowledge patches are proposals only (requiresReview=true). The system learns but never auto-applies what it learned. This is the correct safety posture for a self-modifying system ingesting external content.

## What Could Be Better

- **Dual-track learning (Track A: Parts I-V, Track B: Parts VI-X) with ~100K tokens per track is a large context budget.** The token budget per track may not leave enough room for the merge and verification phases that follow. Budget accounting across the full pipeline would be more informative than per-track limits.
- **362 tests is the lowest count in the v1.33-v1.40 range relative to scope.** A pipeline that ingests 923 pages, extracts concepts, positions them on the Complex Plane, verifies coverage, and generates improvement tickets has many failure modes. The test count may be adequate but the risk surface is large.

## Lessons Learned

1. **Dogfooding reveals pipeline gaps that unit tests miss.** Testing sc:learn against The Space Between exercises the full chain: PDF extraction, chapter detection, concept extraction, Complex Plane positioning, cross-referencing, verification, and reporting. Each handoff is a potential failure point.
2. **Checkpoint-based ingestion is essential for large documents.** A 33-chapter, 923-page document cannot be processed atomically. Checkpoints with SHA-256 integrity hashes make the pipeline resumable and auditable.
3. **Knowledge patches as proposals (requiresReview=true) enforce human-in-the-loop at the right granularity.** The system can identify what to learn and propose changes, but applying those changes requires explicit human review. This is the safety boundary between autonomous analysis and autonomous modification.

---
