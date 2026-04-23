# Retrospective — v1.49.569

## What Worked

1. **Inserting a full-PDF Opus editorial pass between W0 foundation and W1 parallel surveys.** Phase 684.1 resolved 24 papers as `supported` and flagged 5 as `partial` before Wave 1 even started — single highest-return intervention in the milestone. Without it, partials would have propagated into the 42-page final doc and surfaced at the W3 hard-block gate under emergency-revision conditions.
2. **Parallel Wave-1 tracks with cache-hot session residency and independent outputs.** Phases 685/686/687 ran concurrently in a single session with zero file contention — each wrote to a distinct `modules/<module>.tex`. Token share reached 43%, above the DRIFT-10 40% floor.
3. **Per-task atomic commits were load-bearing during API failures.** Two API 500s mid-Wave-7 (governance phases) interrupted execution. Both resumed from the last committed state with zero work loss.
4. **Advisory mid-wave CAPCOM gates caught issues earlier than hard-block gates would have.** The W2 advisory gate tightened two loose renderings (Abdelnabi "near-perfect ROC AUC", Dongre stable-equilibrium framing) before Module D synthesis.
5. **Default-off byte-identity held throughout.** Every Half B defense module shipped with flags false and a golden-output test. Consumers who haven't opted in see v1.49.568 byte-identical behavior.

## Surprises

**684.1 editorial pass was essential — not a nice-to-have.** The user's decision during `/gsd-discuss-phase 684` to insert a full-PDF Opus editorial review before Wave 1 was the most consequential planning decision in the milestone. Skipping it would have left 5 partial-status papers unresolved until the W3 CAPCOM hard-block gate, requiring emergency revisions under the most expensive possible conditions.

**The scope-drift integration tests ran to 25 assertions.** DRIFT-21 (scope-drift formalization) was initially scoped as "≥2 integration tests." The implementation naturally yielded 25 assertions across distinct skill-derivation paths — the formalization document exposed more testable surface than anticipated.

**Grounding-faithfulness became the test-density champion per module.** DRIFT-24 grounding-faithfulness (49 test assertions in a single file) exceeded every other module's per-file density. The angular similarity implementation has many edge cases — zero vectors, perfect alignment, partial overlap, cross-module contamination — each of which warranted a distinct test.

**`scripts/drift/bci-validate.mjs` emerged as an unplanned utility.** During Phase 694 (TraceAlign BCI), the executor introduced `scripts/drift/bci-validate.mjs` as a standalone validation entry point for the BCI computation — not in the original roadmap but a natural companion to `drift-audit.mjs`. It ships as a permanent utility alongside the four planned scripts.

## Lessons Learned

These are the durable, forward-applicable lessons distilled from Process Observations, Surprises, and What to Reuse. Each names a rule, the reason behind it, and the conditions under which it applies.

1. **Insert an Opus editorial pass between W0 foundation and W1 parallel surveys on any citation-heavy research milestone.** Phase 684.1 resolved 24 papers as `supported`, flagged 5 as `partial`, produced zero mismatches — the single highest-return intervention in v1.49.569. Without it, five partials would have propagated into the 42-page final doc and surfaced at the W3 hard-block gate under emergency-revision conditions. Apply whenever a milestone cites ≥15 primary sources with numerical claims.

2. **Parallel Wave-1 tracks require cache-hot session residency plus an independent-outputs discipline.** Phases 685/686/687 ran concurrently in a single session with zero file contention because each wrote to a distinct `modules/<module>.tex` under the same gitignored `work/` tree. Token share reached 43% (above DRIFT-10's 40% floor). Apply whenever a milestone has ≥3 independent research-track deliverables that share the same source corpus.

3. **Per-task commit discipline is load-bearing, not ceremonial.** Two API 500s interrupted Wave-7 (phases 697, 698) mid-task. Both resumed from the last committed state with zero work loss. Ceremony that feels like overhead during the happy path is the only thing that saves you during the bad path. Apply uniformly — never batch multiple tasks into a single commit just because they're related.

4. **Advisory CAPCOM gates catch real issues earlier than hard-block gates.** The W2 advisory gate tightened two loose renderings (`abdelnabi2024taskdrift` "near-perfect ROC AUC", `dongre2025equilibria` stable-equilibrium framing) before Module D synthesis. The hard-block at W3 would have caught them too — but only after synthesis work had to be redone. Apply the advisory/blocking layering (warn mid-wave, block at publication) to any multi-stage authoring pipeline.

5. **Default-off invariance is a zero-blast-radius upgrade contract.** Every Half B defense module shipped with `settings.json` defaults of `false`, and Phase 698 enforces this via `default-off-invariance.test.ts` golden-output tests. Consumers who have not opted in see byte-identical v1.49.568 behavior. Adopt this contract for any feature that could change downstream behavior — the invariance test is the commitment.

6. **The two-halves single-release pattern is repeatable.** Research reference (Half A) followed by codebase defenses (Half B) under one version number forces the code to be designed from findings, not speculation. The pattern works when (a) the research directly informs substrate work, and (b) the substrate work is bounded enough to fit in the same release cadence. Apply to any topic where a formal investigation precedes implementation.

7. **Unplanned utilities that emerge during execution are signals, not bugs.** `scripts/drift/bci-validate.mjs` wasn't in the roadmap but emerged naturally during Phase 694 as a standalone BCI validation entry point. It ships permanent alongside the four planned scripts. Apply: when an executor introduces an unplanned utility, evaluate for reuse value before archiving — don't reflexively cut it because "it wasn't planned."

8. **Test density is a module-property, not a milestone-property.** DRIFT-24 grounding-faithfulness has 49 assertions in one file; DRIFT-26 drift-audit CLI has 12 across four integration tests. Neither number is "wrong" — each matches the natural complexity of the domain it's testing. Don't impose uniform per-module test counts; let the surface dictate the density.
