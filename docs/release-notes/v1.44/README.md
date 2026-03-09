# v1.44 — SC Learn PyDMD Dogfood

**Shipped:** 2026-02-26 | **Phases:** 5 (403-407) | **Plans:** 11 | **Commits:** 22 | **Tests:** 284

## Overview

Dogfooded the sc:learn pipeline by ingesting PyDMD (Python Dynamic Mode Decomposition library) — testing knowledge extraction, skill generation, and verification against a real scientific computing codebase.

## Key Features

- **PyDMD Knowledge Extraction**: Automated extraction of DMD concepts, algorithms, and API patterns from PyDMD documentation and source
- **Concept Mapping**: Mapped PyDMD's mathematical concepts to skill-creator's knowledge graph with dependency edges
- **Tutorial Replay Engine**: Engine for replaying PyDMD tutorials through the learning pipeline to validate extraction accuracy
- **Accuracy Checker**: Verification system comparing extracted knowledge against ground truth documentation
- **Observation Bridge**: Bridge connecting learn pipeline observations to skill-creator's pattern detection
- **Dogfood Report Template**: Structured template for documenting ingestion outcomes, accuracy metrics, and improvement recommendations
- **E2E Integration Tests**: End-to-end pipeline tests and contract tests validating the full learn→verify→report cycle

## Wave Execution

| Wave | Phases | Description |
|------|--------|-------------|
| 0 | 403 | Foundation types and PyDMD knowledge schema |
| 1 | 404 | Knowledge extraction pipeline |
| 2 | 405 | Concept mapping and dependency wiring |
| 3 | 406 | Accuracy checker and tutorial replay |
| 4 | 407 | Integration testing and dogfood report |

## Stats

54 files changed, 12,932 insertions, 284 tests

## Retrospective

### What Worked
- **Dogfooding sc:learn against a real scientific computing library (PyDMD) tests the pipeline on external, unfamiliar content.** The Space Between dogfood (v1.40) tested ingestion of the project's own material. PyDMD is truly external -- different authors, different domain conventions, different code structure. This is a harder test.
- **Tutorial replay engine validates extraction accuracy against ground truth.** Rather than just extracting and hoping, replaying PyDMD tutorials through the pipeline and checking outputs against known-good documentation creates a closed-loop verification system.
- **Observation bridge connecting learn pipeline to pattern detection.** This means sc:learn isn't a standalone ingestor -- it feeds observations into the same pattern detection system that monitors all of skill-creator's operations. Learning becomes visible to the rest of the system.

### What Could Be Better
- **284 tests for 54 files and 12,932 insertions.** The test-to-LOC ratio is lower than the Space Between dogfood (v1.40: 362 tests for ~7.2K LOC). A larger codebase with fewer tests suggests some pipeline paths are under-tested.
- **Concept mapping to the knowledge graph with dependency edges needs validation against PyDMD's actual dependency structure.** Mathematical concepts in DMD have real prerequisite relationships (SVD before DMD, eigendecomposition before mode analysis). If the extracted dependency edges don't match the mathematical prerequisites, the graph is misleading.

## Lessons Learned

1. **Two dogfood runs (v1.40 internal, v1.44 external) test complementary aspects of the learn pipeline.** Internal content tests whether the system can ingest what it already knows. External content tests whether it can learn something genuinely new. Both are necessary; neither is sufficient alone.
2. **Accuracy checking against ground truth documentation is the only reliable measure of extraction quality.** Counting extracted concepts is easy. Verifying that extracted concepts are correct requires comparison against a trusted source.
3. **Structured dogfood report templates (11 sections in v1.40, similar here) make ingestion outcomes comparable across runs.** Without a standard report format, each dogfood run produces ad hoc observations that can't be systematically compared.
