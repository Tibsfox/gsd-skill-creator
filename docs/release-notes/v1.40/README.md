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

---
