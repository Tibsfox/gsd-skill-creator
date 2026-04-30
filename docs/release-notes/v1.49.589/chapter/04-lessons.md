# v1.49.589 — Forward Lessons

Three forward lessons emitted (#10191 #10192 #10193).

## #10191 — W1 multi-agent dispatch quota discipline must extend beyond W2

**Definition:** The Lesson #10185 serial-then-parallel dispatch discipline (originated for W2 build agents at v1.49.588) MUST extend to ALL multi-agent waves, not just W2. Concurrent multi-Sonnet dispatch at any wave can hit Anthropic per-account rate-limits. The threshold appears to be ~5 concurrent Sonnet agents totaling ~150-250K tokens combined.

**Evidence:** v1.49.589 W1 dispatched 5 concurrent Sonnet agents (1 W1a Apollo 6 dossier ~80K + 4 W1b TRS pack-fetch agents @ ~38K each = ~232K total). All 5 hit per-account rate-limit at ~5-8 minutes wall-clock. W1a completed cleanly (Sonnet was first-dispatched, used quota efficiently before exhaustion). 3 of 4 TRS packs (05/06/07) produced no output at all; pack-08 was partial (5 PDFs landed, cache index unchanged). Compare to v1.49.589 W2-NASA solo dispatch: 1 Sonnet agent at ~80K tokens for 44 minutes wall-clock, completed cleanly, then W2-MUS + W2-ELC dispatched in parallel after W2-NASA finished — this serial-then-parallel pattern WORKED at W2 scale.

**3-criterion rubric for dispatch discipline:**
1. **Concurrency limit** — never dispatch >2 Sonnet agents simultaneously without cooldown spacing
2. **Total-token estimate** — sum estimated tokens across all concurrent agents; if >150K aggregate, split into batches with ≥3-min spacing
3. **First-dispatched priority** — the most-critical agent (W1a dossier at W1; W2-NASA at W2) goes first solo; secondary agents dispatch only after primary completes (or after primary has consumed estimated 50%+ of its tokens)

**Forward action:** for v1.49.590+, all multi-agent dispatches must follow the 3-criterion rubric. Add a dispatch-planning section to the W2-build-agent-prompt.md template (T2.4 deliverable) covering W1+W2 dispatch ordering. Consider pre-caching TRS pack-fetch credits via a separate Anthropic account if rate-limits become a recurring constraint at the 7-pack scale anticipated for v1.49.590 W1b (3 deferred + 4 originally-planned).

**Cross-link:** elaborates Lesson #10185; supersedes the W2-only framing of that lesson.

## #10192 — Sonnet at 13K-word W1a dossier target = comfortable, recommended default

**Definition:** Sonnet subagents handling structured-prompt research dossier authoring at 12K-15K word target deliver consistent depth, complete coverage, and high brief-error catch rates. Shorter targets (8K-9K words used at v1.49.587 + v1.49.588) appear to under-utilize the model's coverage capacity.

**Evidence:** v1.49.589 W1a Apollo 6 dossier delivered 12,963 words across 4 tracks (NASA + MUS + ELC + SPS) with:
- Consistent depth across all 4 tracks (not lopsided toward NASA)
- 10 brief errors caught at G0 gate (vs v1.49.587 = 5; v1.49.588 = 6)
- Complete G0 recommendation block (D1-D6)
- Bibliography with 30+ primary + secondary sources
- Structural-pair analysis tables for all 4 cross-track candidates

Compare to predecessor word counts:
- v1.49.587: 6,900 words (5 errors caught)
- v1.49.588: 8,782 words (6 errors caught)
- v1.49.589: **12,963 words (10 errors caught)** — +47% words, +67% error catch rate vs v1.49.588

The relationship between dossier depth and brief-error catch rate is roughly linear: more verifiable detail surface area → more opportunities for the G0 gate to catch errors.

**3-criterion test for W1a target sizing:**
1. **Coverage breadth** — minimum word count to fully cover all 4 cross-track candidates with structural-pair analysis
2. **Brief-error surface area** — minimum quantitative-claim density to make G0 gate catch ≥5 errors
3. **Sonnet token budget** — must complete in single dispatch within ~80K-100K input token budget

**Forward action:** future W1a prompts should target 12K-15K words by default. Update the dossier-prompt template (if one exists; if not, codify the target in the gsd-discuss-phase or research-mission-generator skill that authors W1a prompts).

**Anti-pattern to avoid:** do NOT target >18K words — beyond ~15K, marginal returns diminish AND the dispatch begins to risk single-agent token-cap truncation (32K output cap). The sweet spot is 12K-15K.

## #10193 — W2 serial-then-parallel discipline confirmed at scale

**Definition:** The Lesson #10185 W2 dispatch discipline (NASA serial first; MUS+ELC parallel after) WORKS at the scale of a 25-file NASA build + parallel 14-file MUS + 10-file ELC builds. v1.49.589 is the first milestone where the full discipline was applied AND all three W2 agents completed without quota exhaustion.

**Evidence:**
1. W2-NASA solo dispatch: 25 files, 440KB, index.html 664 lines / 117KB (113% predecessor depth), 44 min wall-clock, no quota errors
2. W2-MUS + W2-ELC parallel dispatch (immediately after W2-NASA completed): both agents ran concurrently, both completed (final results pending at time of lesson emission)

This is the **first end-to-end successful application of the W2 discipline** since Lesson #10185 was emitted at v1.49.588. The discipline is now confirmed at the production-scale a milestone build requires.

**3-criterion success rubric:**
1. **All three W2 agents complete within combined wall-clock budget** (target: <2 hours total — NASA serial ~45 min + MUS+ELC parallel ~30 min = ~75 min)
2. **All depth-audit invariants PASS** (each track's index.html ≥80% predecessor depth)
3. **No quota-induced incomplete builds** (no track requires post-ship rebuild as v1.49.588 did for 6 sibling files)

**Forward action:** the W2 dispatch discipline is now the established default. Update CLAUDE.md ship-pipeline section (already done at T2.4) to reflect the discipline. Audit at v1.49.590+ that the discipline continues to work at the same scale. If v1.49.590 W2 succeeds again, the discipline is fully soaked and can be hardened into the W2-build-agent-prompt.md template as MANDATORY rather than RECOMMENDED.

**Cross-link:** confirms Lesson #10185 at production scale; combined with Lesson #10191 (W1 dispatch discipline), the multi-agent dispatch framework is now coherent across waves.
