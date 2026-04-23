# Lessons — v1.49.569

8 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Insert an Opus editorial pass between W0 foundation and W1 parallel surveys on any citation-heavy research milestone.**
   Phase 684.1 resolved 24 papers as `supported`, flagged 5 as `partial`, produced zero mismatches — the single highest-return intervention in v1.49.569. Without it, five partials would have propagated into the 42-page final doc and surfaced at the W3 hard-block gate under emergency-revision conditions. Apply whenever a milestone cites ≥15 primary sources with numerical claims.
   _⚙ Status: `investigate` · lesson #9881_

2. **Parallel Wave-1 tracks require cache-hot session residency plus an independent-outputs discipline.**
   Phases 685/686/687 ran concurrently in a single session with zero file contention because each wrote to a distinct `modules/<module>.tex` under the same gitignored `work/` tree. Token share reached 43% (above DRIFT-10's 40% floor). Apply whenever a milestone has ≥3 independent research-track deliverables that share the same source corpus.
   _⚙ Status: `investigate` · lesson #9882_

3. **Per-task commit discipline is load-bearing, not ceremonial.**
   Two API 500s interrupted Wave-7 (phases 697, 698) mid-task. Both resumed from the last committed state with zero work loss. Ceremony that feels like overhead during the happy path is the only thing that saves you during the bad path. Apply uniformly — never batch multiple tasks into a single commit just because they're related.
   _⚙ Status: `investigate` · lesson #9883_

4. **Advisory CAPCOM gates catch real issues earlier than hard-block gates.**
   The W2 advisory gate tightened two loose renderings (`abdelnabi2024taskdrift` "near-perfect ROC AUC", `dongre2025equilibria` stable-equilibrium framing) before Module D synthesis. The hard-block at W3 would have caught them too — but only after synthesis work had to be redone. Apply the advisory/blocking layering (warn mid-wave, block at publication) to any multi-stage authoring pipeline.
   _⚙ Status: `investigate` · lesson #9884_

5. **Default-off invariance is a zero-blast-radius upgrade contract.**
   Every Half B defense module shipped with `settings.json` defaults of `false`, and Phase 698 enforces this via `default-off-invariance.test.ts` golden-output tests. Consumers who have not opted in see byte-identical v1.49.568 behavior. Adopt this contract for any feature that could change downstream behavior — the invariance test is the commitment.
   _⚙ Status: `investigate` · lesson #9885_

6. **The two-halves single-release pattern is repeatable.**
   Research reference (Half A) followed by codebase defenses (Half B) under one version number forces the code to be designed from findings, not speculation. The pattern works when (a) the research directly informs substrate work, and (b) the substrate work is bounded enough to fit in the same release cadence. Apply to any topic where a formal investigation precedes implementation.
   _⚙ Status: `investigate` · lesson #9886_

7. **Unplanned utilities that emerge during execution are signals, not bugs.**
   `scripts/drift/bci-validate.mjs` wasn't in the roadmap but emerged naturally during Phase 694 as a standalone BCI validation entry point. It ships permanent alongside the four planned scripts. Apply: when an executor introduces an unplanned utility, evaluate for reuse value before archiving — don't reflexively cut it because "it wasn't planned."
   _⚙ Status: `investigate` · lesson #9887_

8. **Test density is a module-property, not a milestone-property.**
   DRIFT-24 grounding-faithfulness has 49 assertions in one file; DRIFT-26 drift-audit CLI has 12 across four integration tests. Neither number is "wrong" — each matches the natural complexity of the domain it's testing. Don't impose uniform per-module test counts; let the surface dictate the density.
   _⚙ Status: `investigate` · lesson #9888_
