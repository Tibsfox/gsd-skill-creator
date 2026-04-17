# Retrospective — v1.44

## What Worked

- **Dogfooding sc:learn against a real scientific computing library (PyDMD) tests the pipeline on external, unfamiliar content.** The Space Between dogfood (v1.40) tested ingestion of the project's own material. PyDMD is truly external -- different authors, different domain conventions, different code structure. This is a harder test.
- **Tutorial replay engine validates extraction accuracy against ground truth.** Rather than just extracting and hoping, replaying PyDMD tutorials through the pipeline and checking outputs against known-good documentation creates a closed-loop verification system.
- **Observation bridge connecting learn pipeline to pattern detection.** This means sc:learn isn't a standalone ingestor -- it feeds observations into the same pattern detection system that monitors all of skill-creator's operations. Learning becomes visible to the rest of the system.

## What Could Be Better

- **284 tests for 54 files and 12,932 insertions.** The test-to-LOC ratio is lower than the Space Between dogfood (v1.40: 362 tests for ~7.2K LOC). A larger codebase with fewer tests suggests some pipeline paths are under-tested.
- **Concept mapping to the knowledge graph with dependency edges needs validation against PyDMD's actual dependency structure.** Mathematical concepts in DMD have real prerequisite relationships (SVD before DMD, eigendecomposition before mode analysis). If the extracted dependency edges don't match the mathematical prerequisites, the graph is misleading.

## Lessons Learned

1. **Two dogfood runs (v1.40 internal, v1.44 external) test complementary aspects of the learn pipeline.** Internal content tests whether the system can ingest what it already knows. External content tests whether it can learn something genuinely new. Both are necessary; neither is sufficient alone.
2. **Accuracy checking against ground truth documentation is the only reliable measure of extraction quality.** Counting extracted concepts is easy. Verifying that extracted concepts are correct requires comparison against a trusted source.
3. **Structured dogfood report templates (11 sections in v1.40, similar here) make ingestion outcomes comparable across runs.** Without a standard report format, each dogfood run produces ad hoc observations that can't be systematically compared.
