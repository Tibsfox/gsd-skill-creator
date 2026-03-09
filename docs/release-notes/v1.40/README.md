# v1.40 — sc:learn Dogfood Mission

**Shipped:** 2026-02-26
**Phases:** 384-389 (6 phases) | **Plans:** 12 | **Commits:** 24 | **Requirements:** 44 | **Tests:** 362 | **LOC:** ~7.2K

Dogfood sc:learn by ingesting "The Space Between" (923 pages, 33 chapters) through the full learning pipeline with PDF extraction, checkpoint-based ingestion, dual-track learning, 3-track verification, refinement with actionable patches, and safety validation.

### Key Features

**PDF Extraction Pipeline (Phase 384):**
- pdftotext-based extraction with chapter/part detection
- LaTeX math preservation, TikZ diagram cataloging, MusiXTeX tagging
- Exercise and build-lab extraction with chunk segmentation (8000 token limit)
- JSONL manifest with full metadata
- 118 tests

**Ingestion Harness (Phase 385):**
- Atomic checkpoint write/read with SHA-256 integrity hash
- Multi-session resume with validation
- Per-chapter metrics (tokens, concepts, math density, processing time)
- Dashboard bridge writing JSON to console outbox
- 27 tests

**Dual-Track Learning Pipeline (Phase 386):**
- Track A (Parts I-V) and Track B (Parts VI-X) concept extraction
- Regex-based detection (definitions, theorems, headings)
- Complex plane positioning via PART_ANGULAR_REGIONS
- Progressive depth tracking with ecosystem cross-referencing
- Token budget enforcement (~100K per track)
- 68 tests

**Database Merger (Phase 386):**
- Case-insensitive deduplication across tracks
- Progressive depth preservation
- Coverage statistics and coordinate validation
- 26 tests

**Verification Engine (Phase 387):**
- 3-track verification: concept coverage audit, cross-document consistency, eight-layer progression
- Bidirectional knowledge diffing with Jaccard similarity
- 8-type gap taxonomy with 4-level severity and analysis justification
- Gap deduplication and statistics generation
- 65 tests

**Refinement & Reporting (Phase 388-389):**
- Knowledge patch generator (proposals only, requiresReview=true)
- Improvement ticket generator with reproduction steps
- Skill refiner with complex plane positions
- Comprehensive dogfood report builder (11 sections, actual metrics)
- Safety validator: bounded learning <=20%, checkpoint integrity, no auto-application, regression gate
- 84 tests

## Retrospective

### What Worked
- **Dogfooding sc:learn with a 923-page, 33-chapter source is a real stress test.** The Space Between isn't a toy input -- it's a full-length manuscript with LaTeX math, TikZ diagrams, MusiXTeX notation, exercises, and build labs. If the pipeline handles this, it handles most documents.
- **Atomic checkpoint write/read with SHA-256 integrity hash.** Multi-session resume with validation means a 33-chapter ingestion doesn't have to complete in one session. This is critical for large documents where the pipeline might be interrupted.
- **3-track verification (concept coverage, cross-document consistency, eight-layer progression).** Verification isn't one check -- it's three orthogonal audits. Bidirectional knowledge diffing with Jaccard similarity and an 8-type gap taxonomy with 4-level severity provide specific, actionable feedback.
- **Safety validator enforces bounded learning (<=20%) and blocks auto-application.** Knowledge patches are proposals only (requiresReview=true). The system learns but never auto-applies what it learned. This is the correct safety posture for a self-modifying system ingesting external content.

### What Could Be Better
- **Dual-track learning (Track A: Parts I-V, Track B: Parts VI-X) with ~100K tokens per track is a large context budget.** The token budget per track may not leave enough room for the merge and verification phases that follow. Budget accounting across the full pipeline would be more informative than per-track limits.
- **362 tests is the lowest count in the v1.33-v1.40 range relative to scope.** A pipeline that ingests 923 pages, extracts concepts, positions them on the Complex Plane, verifies coverage, and generates improvement tickets has many failure modes. The test count may be adequate but the risk surface is large.

## Lessons Learned

1. **Dogfooding reveals pipeline gaps that unit tests miss.** Testing sc:learn against The Space Between exercises the full chain: PDF extraction, chapter detection, concept extraction, Complex Plane positioning, cross-referencing, verification, and reporting. Each handoff is a potential failure point.
2. **Checkpoint-based ingestion is essential for large documents.** A 33-chapter, 923-page document cannot be processed atomically. Checkpoints with SHA-256 integrity hashes make the pipeline resumable and auditable.
3. **Knowledge patches as proposals (requiresReview=true) enforce human-in-the-loop at the right granularity.** The system can identify what to learn and propose changes, but applying those changes requires explicit human review. This is the safety boundary between autonomous analysis and autonomous modification.

---
