# Lessons — v1.44

5 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Two dogfood runs (v1.40 internal, v1.44 external) test complementary aspects of the learn pipeline.**
   Internal content tests whether the system can ingest what it already knows. External content tests whether it can learn something genuinely new. Both are necessary; neither is sufficient alone.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #231_

2. **Accuracy checking against ground truth documentation is the only reliable measure of extraction quality.**
   Counting extracted concepts is easy. Verifying that extracted concepts are correct requires comparison against a trusted source.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #232_

3. **Structured dogfood report templates (11 sections in v1.40, similar here) make ingestion outcomes comparable across runs.**
   Without a standard report format, each dogfood run produces ad hoc observations that can't be systematically compared.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #233_

4. **284 tests for 54 files and 12,932 insertions.**
   The test-to-LOC ratio is lower than the Space Between dogfood (v1.40: 362 tests for ~7.2K LOC). A larger codebase with fewer tests suggests some pipeline paths are under-tested.
   _🤖 Status: `investigate` · lesson #234 · needs review_
   > LLM reasoning: v1.46 Upstream Intelligence Pack doesn't visibly address test-to-LOC ratio for the prior pipeline.

5. **Concept mapping to the knowledge graph with dependency edges needs validation against PyDMD's actual dependency structure.**
   Mathematical concepts in DMD have real prerequisite relationships (SVD before DMD, eigendecomposition before mode analysis). If the extracted dependency edges don't match the mathematical prerequisites, the graph is misleading.
   _⚙ Status: `applied` (applied in `v1.45`) · lesson #235_
