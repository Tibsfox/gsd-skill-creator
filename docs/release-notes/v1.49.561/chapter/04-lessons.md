# Lessons — v1.49.561

15 lessons extracted. Classification source: ⚙ rule-based · 🤖 LLM tiebreaker (needs review) · 👤 human.

1. **Keystone-first wave organisation beats parallel-but-disconnected.**
   Identifying ME-1 tractability as the refinement-wave keystone before building MA-1, MA-2, ME-4 gave every other component a coherent gating variable to weight against. Recommend repeating the keystone-first pattern for future research-driven waves.
   _⚙ Status: `investigate` · lesson #9931_

2. **Default-off byte-identical verification is cheap when established early.**
   SC-REF-FLAG-OFF (Phase 657) and SC-CONT-FLAG-OFF (Phase 674) reused the same fixture-capture pattern established in Phase 647's base-wave integration chain. The pattern: capture three independent runs, diff against the previous-wave tip, fail on any byte movement.
   _⚙ Status: `investigate` · lesson #9932_

3. **Bundling 13 components into 5 thematic groups beat 13 standalone phases.**
   The stability-rails / exploration-harness / representation-frontier / authoring-tools / college groupings each landed as coherent integration units with shared verification posture, reducing cross-phase coordination cost.
   _⚙ Status: `investigate` · lesson #9933_

4. **Per-module opt-in flags scale to 8+ modules cleanly.**
   Each module gets a `gsd-skill-creator.<name>.enabled` flag and an independent on/off path. Powerset testing remains tractable when individual modules don't cross-couple their state.
   _⚙ Status: `investigate` · lesson #9934_

5. **Primary-source dedications are load-bearing for module credibility.**
   Each module ties back to a published paper (Lanzara 2023, Friston 2010, Kirchhoff 2018, Barto 1983, Sastry 1989, Welling 2011, Mikolov 2013, Narendra 1989, Zhang 2026, Lanzara-Kuperstein 1991) — the dedication-as-acknowledgement pattern doubles as the documentation surface for "why this primitive."
   _⚙ Status: `investigate` · lesson #9935_

6. **Audit-not-replace posture preserves working primary paths.**
   M2 extends `src/memory/`, M3 extends `src/mesh/event-log.ts`, MD-5 sits beside MA-1 rather than replacing it, MD-6 audits without touching the underlying representation. The pattern: new layer composes with the existing path, never replaces it.
   _⚙ Status: `investigate` · lesson #9936_

7. **Coin-flip diagnostic became the organising principle for an entire wave.**
   Zhang et al. 2026's empirical finding — that prompt-content optimisation is statistically indistinguishable from a coin flip except in the exploitable-output-structure regime — gave the refinement wave its conceptual centre and the gating variable for the actor-critic wire.
   _⚙ Status: `investigate` · lesson #9937_

8. **Lyapunov-stability vocabulary clarifies what "converges" means for skill activation.**
   Sastry & Bodson 1989 plus Narendra & Annaswamy 1989 give MB-1, MB-2, MB-5 a formal vocabulary for bounded-learning invariants — the 0.3 tractability floor in MA-2's weighting formula, the per-channel τ constraints in MA-1's decay kernels, and the projection-operator posture on parameter updates all become statements with formal stability content rather than heuristic choices.
   _⚙ Status: `investigate` · lesson #9938_

9. **Shallow embeddings beat heavyweight ML deps for incremental session-log learning.**
   MD-1's skip-gram + negative-sampling implementation matches the Mikolov et al. 2013 word2vec objective without adding any npm dependencies — the embedding matrix stays small enough to be retrained incrementally as the session log grows, no batch infrastructure required.
   _⚙ Status: `investigate` · lesson #9939_

10. **Quintessence five-axis frame attribution corrected mid-wave.**
   The original M8 dedication cited Lanzara 2023 alone; the continuation-wave extended dedication added Kuperstein as co-originator of the 1991 joint formulation. Mid-wave attribution corrections are part of the dedication-as-acknowledgement discipline.
   _⚙ Status: `investigate` · lesson #9940_

11. **Scope grew from 15 phases to 43 across the full arc.**
   The base wave was scoped at 15 phases (636–650); refinement added 10 (651–660) and continuation added 18 (661–678). Each expansion was substantively justified by research-mission output, but a single "Living Sensoria" name covering 43 phases stretches the milestone-shape convention.
   _⚙ Status: `investigate` · lesson #9941_

12. **Two documentation-publication phases (649, 650) absorbed into a third (678) for the combined arc.**
   The wave-commit-marker convention was used to preserve bisect intent, but a single combined release-notes phase makes per-wave provenance harder to recover.
   _⚙ Status: `investigate` · lesson #9942_

13. **LS-22 manual-annotation requirement deferred again.**
   The same annotation surface that was deferred in earlier milestones remains deferred here; recommend either dropping the requirement or finally building the annotation tool in a dedicated micro-milestone.
   _⚙ Status: `investigate` · lesson #9943_

14. **IT-08 doc-regen tooling deferred.**
   The integration-test doc-regen tool would have made the four module guides self-updating; deferral means future module additions still require manual regen.
   _⚙ Status: `investigate` · lesson #9944_

15. **Refinement and continuation wave dedications grew to ~5 paragraphs each.**
   The dedication-as-acknowledgement pattern is load-bearing for primary-source attribution, but the cumulative dedication block is now ~30% of the total document length. Future milestones should consider a separate `DEDICATIONS.md` artifact.
   _⚙ Status: `investigate` · lesson #9945_
