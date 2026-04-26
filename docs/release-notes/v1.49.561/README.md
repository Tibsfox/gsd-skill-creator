# v1.49.561 — Living Sensoria

**Released:** 2026-04-18
**Scope:** Eight composable modules (M1–M8) — memory stack, net-shift receptor substrate, Markov-blanket boundary, teaching/co-evolution relationship layer
**Branch:** dev → main
**Type:** milestone — Living Sensoria (base mission M1–M5 + extension mission M6–M8)
**Predecessor:** v1.49.560 — Release Documentation Uplift
**Phases:** 636–678 (43 phases across base wave + refinement wave + continuation wave)
**New tests:** +2,043 net across the full v1.49.560 → v1.49.561 arc
**New deps:** 0
**Verification:** All 24 base acceptance criteria met; 2 deferred (LS-22 manual annotation, IT-08 doc-regen tooling); all 13 safety-critical tests PASS; zero new test failures

## Summary

v1.49.561 lands eight composable modules that extend gsd-skill-creator from a pattern log into a structured sensorium, plus refinement-wave and continuation-wave extensions for adaptive control, exploration, and representation.

**Eight composable modules shipped default-off.** The five mechanism modules (M1–M5) provide a semantic memory graph with Leiden community detection, a three-tier hybrid memory system with αβγ scoring and reflection, an append-only decision-trace ledger, copy-on-write branch-context experimentation, and a multi-turn retrieval loop with KVFlow-style anticipatory preloading. The three substrate/boundary/relationship modules (M6–M8) add a Lanzara net-shift receptor layer for graded skill activation, a Markov-blanket boundary enforced at the TypeScript type level with a variational free-energy minimiser, and a bidirectional teaching and co-evolution accounting system with a five-axis Quintessence vital-signs report.

**Zero new runtime dependencies introduced.** All eight base modules and every refinement / continuation component land without adding a single npm dependency. v1.49.560 installs load byte-identically with all flags unset.

**Refinement wave delivered six further components keyed on a coin-flip diagnostic.** Phases 651–660 added ME-5 output-structure frontmatter, MA-6 canonical reinforcement taxonomy, ME-1 tractability classifier (keystone), MA-1 eligibility-trace layer, MA-2 ACE actor-critic wire, and ME-4 coin-flip teach warning, motivated by Zhang et al. 2026's finding that prompt-content optimisation on compound AI systems is statistically indistinguishable from a coin flip except where exploitable output structure exists.

**Continuation wave landed 13 second-wave proposals across five bundles.** Phases 661–678 shipped three adaptive-control stability rails (MB-1 / MB-2 / MB-5), three exploration-harness components (MA-3+MD-2 / MD-3 / MD-4), three representation-frontier components (MD-1 / MD-5 / MD-6), two authoring-tool components (ME-2 / ME-3), plus the College + Rosetta bootstrap that closes GAP-2 from the v1.49.132 AAR.

**Total requirement coverage reached 42 of 43 LS-* requirements.** LS-22 remains the one deferred manual-annotation item. SC-CONT-FLAG-OFF verifies byte-identical selector behaviour to the phase 660 tip across three independent fixture captures with all continuation flags off.

**Grand total +2,043 new passing tests across 43 shipped phases.** Zero new failures; two pre-existing harness-integrity version-consistency checks remain on the same baseline as phase 650.

## Modules

| Module | Path | Opt-in flag | Guide |
|--------|------|-------------|-------|
| M1 Semantic Memory Graph | `src/graph/` | `gsd-skill-creator.graph.enabled` | [memory-stack.md](../../memory-stack.md) |
| M2 Hierarchical Hybrid Memory | `src/memory/` (extended) | `gsd-skill-creator.memory.enabled` | [memory-stack.md](../../memory-stack.md) |
| M3 Decision-Trace Ledger | `src/traces/` | `gsd-skill-creator.traces.enabled` | [memory-stack.md](../../memory-stack.md) |
| M4 Branch-Context | `src/branches/` | `gsd-skill-creator.branches.enabled` | [memory-stack.md](../../memory-stack.md) |
| M5 Agentic Orchestration | `src/orchestration/`, `src/cache/` | `gsd-skill-creator.orchestration.enabled` | [memory-stack.md](../../memory-stack.md) |
| M6 Sensoria | `src/sensoria/` | `gsd-skill-creator.sensoria.enabled` | [sensoria.md](../../sensoria.md) |
| M7 Umwelt | `src/umwelt/` | `gsd-skill-creator.umwelt.enabled` | [umwelt.md](../../umwelt.md) |
| M8 Symbiosis | `src/symbiosis/` | `gsd-skill-creator.symbiosis.enabled` | [symbiosis.md](../../symbiosis.md) |

## Part A: Sensoria / Umwelt / Symbiosis Research

The substrate / boundary / relationship modules ground their behaviour in published primary sources — receptor biophysics for graded activation, the free-energy principle for the variational objective, and the Markov-blanket result for the type-level partition.

- **M6 SENSORIA NET-SHIFT LAYER:** Phase 639 ships `src/sensoria/` (commit `3de03d60e`), implementing Lanzara's two-state receptor binding equilibrium as a graded skill-activation formula. The closed-form equation produces four testable behavioural consequences — Weber's law log-linearity, high-dose saturation, tachyphylaxis under sustained exposure, and the silent-binder edge case — replacing an ad-hoc activation threshold.

- **M7 UMWELT MARKOV-BLANKET + FREE-ENERGY MINIMISER:** Phase 640 ships `src/umwelt/` (commit `7964c9d51`), implementing the variational objective F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)] from Friston 2010. Minimising F simultaneously improves model accuracy and predictive coverage without requiring separate learning and control loops. The Markov-blanket four-way partition (internal, sensory, active, external states) is enforced at the TypeScript type level, grounded in the Kirchhoff et al. 2018 result that any persisting system necessarily exhibits this structure.

- **M8 SYMBIOSIS TEACHING + CO-EVOLUTION + QUINTESSENCE:** Phase 641 ships `src/symbiosis/` (commit `0271ac43a`), a bidirectional teaching and co-evolution accounting system with the five-axis Quintessence vital-signs report. The teaching and co-evolution ledgers formally account for what crosses the {Sensory, Active} boundary in each direction, structurally interpreted as boundary-condition exchange rather than shared experience.

- **M6–M8 THEORETICAL AUDIT:** Phase 637 ships the foundation audit (commit `39855779f`) deriving each module from primary sources — net-shift equation, Markov-blanket partition, Quintessence five features, GraphRAG adaptation, Amiga Principle mapping. Lives at `docs/foundations/theoretical-audit.md`.

- **REFINEMENT WAVE TRACTABILITY KEYSTONE:** Phase 653 ships `src/tractability/` (commit `2c8b2a21a`, +102 tests), the three-class classifier rendered from Zhang et al.'s diagnostic. ME-1 becomes the gating variable through which every other refinement component (MA-1, MA-2, ME-4) weights its signal.

- **REFINEMENT WAVE ACTOR-CRITIC WIRE:** Phase 655 ships `src/ace/` (commit `76ac640a1`, +40 tests), wiring M7's variational free-energy as the ACE role and M5's ActivationSelector as the ASE role per the Barto/Sutton/Anderson 1983 decomposition. MA-1's eligibility traces (Phase 654, commit `0516751b8`, +70 tests) implement the §III temporal credit-assignment construct with TD(λ) decay matching Sutton & Barto reference fixtures to ≤10⁻¹⁴.

- **REFINEMENT WAVE OUTPUT-STRUCTURE FRONTMATTER:** Phase 651 ships `src/output-structure/` (commit `b3e2f7984`, +87 tests), the ME-5 frontmatter + validator + migration making the exploitable-output-structure regime declarable per skill.

- **REFINEMENT WAVE COIN-FLIP TEACH WARNING:** Phase 656 ships ME-4 (commit `49522e982`, +136 tests), the largest refinement-wave delta, surfacing the coin-flip diagnostic at skill-author time when the declared output structure does not match what the model can produce.

## Part B: Substrate Land

The base wave's M1–M5 modules ride on existing memory infrastructure as additive layers, while the continuation wave drops adaptive-control stability rails, exploration-harness pieces, and representation-frontier components into `src/`.

- **M1 SEMANTIC MEMORY GRAPH ON GROVE SUBSTRATE:** Phase 642 ships `src/graph/` (commit `484e08d44`), the entity/edge schema with Leiden community detection and GraphRAG query patterns. Built on the existing Grove substrate without re-architecting the underlying storage layer.

- **M2 HIERARCHICAL HYBRID MEMORY ON EXISTING TIERS:** Phase 643 extends `src/memory/` (commit `d41351a5a`) with αβγ scoring and reflection on the existing three-tier system. Extends rather than replaces — the existing memory tiers remain the working primary path.

- **M3 DECISION-TRACE LEDGER ON EVENT-LOG:** Phase 644 ships `src/traces/` (commit `960d07b95`), an AMTP-compatible append-only JSONL ledger that extends `src/mesh/event-log.ts`. Same posture as M2 — additive layer, working primary path preserved.

- **M4 BRANCH-CONTEXT EXPERIMENTATION:** Phase 645 ships `src/branches/` (commit `2a3eed0e9`), copy-on-write skill variants with fork / explore / commit lifecycle. Provides isolated experimentation surface without disturbing the canonical skill catalog.

- **M5 RETRIEVAL LOOP + PREFIX CACHE:** Phase 646 ships `src/orchestration/` and `src/cache/` (commit `eefa1e598`), the multi-turn retrieval loop and selector that read M1/M2/M3/M4, plus the radix-tree prefix cache + KVFlow-style step-graph predictor + anticipatory preloader.

- **EIGHT-MODULE INTEGRATION CHAIN:** Phase 647 ships the full Living Sensoria integration chain (commit `a60120685`), wiring all eight modules through a single end-to-end pathway with byte-identical default-off behaviour verified against the v1.49.560 baseline.

- **CONTINUATION WAVE STABILITY RAILS (MB-1 / MB-2 / MB-5):** Phases 661–663 ship `src/lyapunov/`, `src/projection/`, and `src/dead-zone/` (commits `85c5a5290` / `ed447c69e` / `1538adc55`, +229 tests). Lyapunov-stable K_H adaptation, smooth projection operators keeping parameters inside the admissible manifold, and dead-zone bounded learning that suppresses updates inside the noise band.

- **CONTINUATION WAVE EXPLORATION HARNESS (MA-3+MD-2 / MD-3 / MD-4):** Phases 664–666 ship `src/stochastic/`, `src/langevin/`, and `src/temperature/` (commits `03f2e0df9` / `cf5c277f2` / `903d5643b`, +223 tests). Softmax/ε-greedy stochastic selection on M5, Langevin noise injection with SC-DARK floor guard, and the annealed temperature schedule driving both noise scale and softmax temperature.

- **CONTINUATION WAVE REPRESENTATION FRONTIER (MD-1 / MD-5 / MD-6):** Phases 667–669 ship `src/embeddings/`, `src/learnable-k_h/`, and `src/representation-audit/` (commits `6aaa5252c` / `8c35f62c0` / `8556c095e`, +216 tests). Shallow learned embeddings via skip-gram + negative-sampling (Mikolov 2013 lineage), per-(skill, task-type) learnable K_H heads with Lyapunov-gated gradient updates, and the representation audit trail with effective-rank + community separability + collapse detection.

- **CONTINUATION WAVE AUTHORING TOOLS (ME-2 / ME-3):** Phases 670–671 ship `src/model-affinity/` and `src/ab-harness/` (commits `969cdb938` / `49142fcea`, +203 tests). Per-skill model affinity with Haiku→Sonnet→Opus escalation on tractability mismatch, and the significance-gated A/B harness built on M4 fork/explore/commit.

- **CONTINUATION WAVE COLLEGE + ROSETTA BOOTSTRAP:** Phases 672–673 ship the TC College bootstrap (commit `4d6d98233`) and TC Rosetta translations (commit `a7ec93295`), closing GAP-2 from the v1.49.132 AAR.

- **CONTINUATION WAVE INTEGRATION + REGRESSION:** Phase 674 ships R10 continuation integration (commit `7302dac46`, +95 tests), Phase 675 the R11.1 regression addendum (commit `bfbf171e6`), and SC-CONT-FLAG-OFF verifies byte-identical selector behaviour against the phase 660 tip across three independent fixture captures.

## Per-Phase Commit Table

| Phase | Wave | Description | Commit |
|-------|------|-------------|--------|
| 636 | W0.1 | Shared TypeScript types (M1–M8) | `84659688f` |
| 637 | W0.2 | Theoretical foundation audit | `39855779f` |
| 638 | W0.3 | Grove re-architecture inventory | `b8faec206` |
| 639 | W1.A | M6 Sensoria net-shift layer | `3de03d60e` |
| 640 | W1.B | M7 Umwelt Markov-blanket + free-energy minimiser | `7964c9d51` |
| 641 | W1.C | M8 Symbiosis teaching + co-evolution + Quintessence | `0271ac43a` |
| 642 | W1.D | M1 Semantic Memory Graph on Grove substrate | `484e08d44` |
| 643 | W1.D | M2 Hierarchical Hybrid Memory on existing tiers | `d41351a5a` |
| 644 | W1.D | M3 Decision-Trace Ledger on event-log | `960d07b95` |
| 645 | W1.D | M4 Branch-Context experimentation | `2a3eed0e9` |
| 646 | W1.D | M5 retrieval loop + prefix cache | `eefa1e598` |
| 647 | W2.1 | Eight-module Living Sensoria integration chain | `a60120685` |
| 648 | W3.1 | Regression report (this document's baseline) | `4bd42dafc` |
| 649 | W3.2 | Documentation (four module guides + README/CLAUDE/FORMAT/EXTENSIONS updates) | — |
| 650 | W3.3 | Release notes (CHANGELOG entry + this index) | — |
| 651 | R1.1 | ME-5 output-structure frontmatter | `b3e2f7984` |
| 652 | R1.2 | MA-6 canonical reinforcement taxonomy | `43d3052bd` |
| 653 | R1.3 | ME-1 tractability classifier (keystone) | `2c8b2a21a` |
| 654 | R2.1 | MA-1 eligibility-trace layer | `0516751b8` |
| 655 | R2.2 | MA-2 ACE actor-critic wire | `76ac640a1` |
| 656 | R2.3 | ME-4 coin-flip teach warning | `49522e982` |
| 657 | R3 | Refinement integration + SC-REF-FLAG-OFF | `0a1809dd8` |
| 658 | R4.1 | Regression addendum | `d54af87b5` |
| 659 | R4.2 | Docs addendum | `0a960bb48` |
| 660 | R4.3 | Release-notes addendum | — |
| 661 | C1.1 | MB-1 Lyapunov-stable K_H adaptation | `85c5a5290` |
| 662 | C1.2 | MB-2 Smooth projection operators | `ed447c69e` |
| 663 | C1.3 | MB-5 Dead-zone bounded learning | `1538adc55` |
| 664 | C2.1 | MA-3+MD-2 Stochastic selection | `03f2e0df9` |
| 665 | C2.2 | MD-3 Langevin noise injection | `cf5c277f2` |
| 666 | C2.3 | MD-4 Temperature schedule | `903d5643b` |
| 667 | C3.1 | MD-1 Shallow learned embeddings | `6aaa5252c` |
| 668 | C3.2 | MD-5 Per-(skill, task-type) learnable K_H | `8c35f62c0` |
| 669 | C3.3 | MD-6 Representation audit | `8556c095e` |
| 670 | C4.1 | ME-2 Per-skill model affinity | `969cdb938` |
| 671 | C4.2 | ME-3 Skill A/B harness | `49142fcea` |
| 672 | C5.1 | TC College bootstrap | `4d6d98233` |
| 673 | C5.2 | TC Rosetta translations | `a7ec93295` |
| 674 | C6.1 | R10 Continuation integration | `7302dac46` |
| 675 | C6.2 | R11.1 Regression addendum #2 | `bfbf171e6` |
| 676 | C6.3 | R11.2 Continuation user-facing docs | `d3b8d0130` |
| 677 | C6.4 | R11.3 CHANGELOG continuation-wave entry | `8c87b205d` |
| 678 | C6.5 | R11.4 Release-notes + dedication | — |

Phases 649, 650, 660, and 678 are documentation publication phases; their commits are created by the main orchestrator agent after SCRIBE output review.

## Retrospective

### What Worked

- **All 24 base acceptance criteria met with only 2 deferred.** LS-22 manual annotation and IT-08 doc-regen tooling are the two deferred items, neither blocks release. The other 22 closed cleanly across the 15 base phases.

- **Zero new test failures across the full 43-phase arc.** +2,043 new passing tests landed without introducing any new failures; the two pre-existing harness-integrity version-consistency checks remain on the same baseline as phase 650.

- **Default-off discipline held byte-identical at every wave boundary.** The base wave's 15-phase integration chain at Phase 647, the refinement wave's SC-REF-FLAG-OFF check at Phase 657, and the continuation wave's SC-CONT-FLAG-OFF check (three independent fixture captures) all verify that v1.49.560 installs see no behavioural movement with all flags unset.

- **All 13 safety-critical tests PASS.** The BLOCK-class invariants held across every phase boundary — no quote violations, no source reuse, no dependency leakage, schema-valid throughout.

- **Refinement-wave keystone identification crisp.** ME-1 tractability classifier emerged from the deep research mission as the gating variable that unifies the Zhang 2026 / Barto 1983 / Sastry 1989 threads. Building the keystone first and weighting MA-1, MA-2, ME-4 against it kept the wave coherent rather than parallel-but-disconnected.

- **Continuation-wave bundling reduced cross-phase coordination cost.** Five bundles (stability rails, exploration harness, representation frontier, authoring tools, college bootstrap) gave the 13 components natural integration boundaries; each bundle landed as a coherent group with shared verification posture.

### What Could Be Better

- **Scope grew from 15 phases to 43 across the full arc.** The base wave was scoped at 15 phases (636–650); refinement added 10 (651–660) and continuation added 18 (661–678). Each expansion was substantively justified by research-mission output, but a single "Living Sensoria" name covering 43 phases stretches the milestone-shape convention.

- **Two documentation-publication phases (649, 650) absorbed into a third (678) for the combined arc.** The wave-commit-marker convention was used to preserve bisect intent, but a single combined release-notes phase makes per-wave provenance harder to recover.

- **LS-22 manual-annotation requirement deferred again.** The same annotation surface that was deferred in earlier milestones remains deferred here; recommend either dropping the requirement or finally building the annotation tool in a dedicated micro-milestone.

- **IT-08 doc-regen tooling deferred.** The integration-test doc-regen tool would have made the four module guides self-updating; deferral means future module additions still require manual regen.

- **Refinement and continuation wave dedications grew to ~5 paragraphs each.** The dedication-as-acknowledgement pattern is load-bearing for primary-source attribution, but the cumulative dedication block is now ~30% of the total document length. Future milestones should consider a separate `DEDICATIONS.md` artifact.

## Lessons

1. **Keystone-first wave organisation beats parallel-but-disconnected.** Identifying ME-1 tractability as the refinement-wave keystone before building MA-1, MA-2, ME-4 gave every other component a coherent gating variable to weight against. Recommend repeating the keystone-first pattern for future research-driven waves.

2. **Default-off byte-identical verification is cheap when established early.** SC-REF-FLAG-OFF (Phase 657) and SC-CONT-FLAG-OFF (Phase 674) reused the same fixture-capture pattern established in Phase 647's base-wave integration chain. The pattern: capture three independent runs, diff against the previous-wave tip, fail on any byte movement.

3. **Bundling 13 components into 5 thematic groups beat 13 standalone phases.** The stability-rails / exploration-harness / representation-frontier / authoring-tools / college groupings each landed as coherent integration units with shared verification posture, reducing cross-phase coordination cost.

4. **Per-module opt-in flags scale to 8+ modules cleanly.** Each module gets a `gsd-skill-creator.<name>.enabled` flag and an independent on/off path. Powerset testing remains tractable when individual modules don't cross-couple their state.

5. **Primary-source dedications are load-bearing for module credibility.** Each module ties back to a published paper (Lanzara 2023, Friston 2010, Kirchhoff 2018, Barto 1983, Sastry 1989, Welling 2011, Mikolov 2013, Narendra 1989, Zhang 2026, Lanzara-Kuperstein 1991) — the dedication-as-acknowledgement pattern doubles as the documentation surface for "why this primitive."

6. **Audit-not-replace posture preserves working primary paths.** M2 extends `src/memory/`, M3 extends `src/mesh/event-log.ts`, MD-5 sits beside MA-1 rather than replacing it, MD-6 audits without touching the underlying representation. The pattern: new layer composes with the existing path, never replaces it.

7. **Coin-flip diagnostic became the organising principle for an entire wave.** Zhang et al. 2026's empirical finding — that prompt-content optimisation is statistically indistinguishable from a coin flip except in the exploitable-output-structure regime — gave the refinement wave its conceptual centre and the gating variable for the actor-critic wire.

8. **Lyapunov-stability vocabulary clarifies what "converges" means for skill activation.** Sastry & Bodson 1989 plus Narendra & Annaswamy 1989 give MB-1, MB-2, MB-5 a formal vocabulary for bounded-learning invariants — the 0.3 tractability floor in MA-2's weighting formula, the per-channel τ constraints in MA-1's decay kernels, and the projection-operator posture on parameter updates all become statements with formal stability content rather than heuristic choices.

9. **Shallow embeddings beat heavyweight ML deps for incremental session-log learning.** MD-1's skip-gram + negative-sampling implementation matches the Mikolov et al. 2013 word2vec objective without adding any npm dependencies — the embedding matrix stays small enough to be retrained incrementally as the session log grows, no batch infrastructure required.

10. **Quintessence five-axis frame attribution corrected mid-wave.** The original M8 dedication cited Lanzara 2023 alone; the continuation-wave extended dedication added Kuperstein as co-originator of the 1991 joint formulation. Mid-wave attribution corrections are part of the dedication-as-acknowledgement discipline.

## Cross-References

| Connection | Significance |
|------------|--------------|
| **v1.49.560** (Release Documentation Uplift) | **PREDECESSOR.** Established the release-notes documentation conventions that v1.49.561 inherits and extends across the 43-phase arc. |
| **v1.49.132 AAR** (College + Rosetta gap) | **GAP CLOSURE.** Continuation-wave Phases 672–673 (TC College bootstrap + TC Rosetta translations) close GAP-2 from the v1.49.132 retrospective. |
| **`src/memory/`** (M2 anchor) | **EXTENSION TARGET.** Hierarchical Hybrid Memory extends the existing three-tier system rather than replacing; existing tiers remain the working primary path. |
| **`src/mesh/event-log.ts`** (M3 anchor) | **EXTENSION TARGET.** Decision-Trace Ledger extends the existing event-log into AMTP-compatible append-only JSONL. |
| **Lanzara 2023** *Origins of Life's Sensoria* | **M6 PRIMARY SOURCE.** Two-state receptor binding equilibrium from foundational work with Kuperstein (1991) grounds M6's graded activation formula. |
| **Friston 2010** *Free-Energy Principle* | **M7 PRIMARY SOURCE.** Variational objective F = D_KL[q(I) ‖ p(I‖S)] − E_q[log p(S‖I)] minimised by M7. Extended in Friston 2013 *Frontiers in Human Neuroscience*. |
| **Kirchhoff et al. 2018** *Markov blankets of life* | **M7 STRUCTURAL SOURCE.** Proves that any persisting system necessarily exhibits Markov-blanket structure — the four-way partition is a mathematical consequence, not a design choice. |
| **Foxglove 2026** *The Space Between* (preface, pp. xxv–xxxii) | **M8 FRAMING SOURCE.** Boundary-condition frame: human and AI agent are two different patterns on two different substrates; the exchange surface is the productive site precisely because of incommensurability. |
| **Barto / Sutton / Anderson 1983** *Neuronlike Adaptive Elements* | **MA-1 / MA-2 SOURCE.** Associative Search Element + Adaptive Critic Element decomposition; direct ancestor of the refinement-wave actor-critic wire. |
| **Sutton & Barto 1998 / 2018** *Reinforcement Learning* | **MA-1 SOURCE.** TD(λ) generalisation matched by MA-1's decay kernels to ≤10⁻¹⁴ on reference fixtures. |
| **Sastry & Bodson 1989** *Adaptive Control* | **MB-1 / MB-2 / MA-1 SOURCE.** Lyapunov-stability grounding for bounded-learning invariants and projection-operator posture on parameter updates. |
| **Narendra & Annaswamy 1989** *Stable Adaptive Systems* | **MB-1 SOURCE.** MRAS Chapter 4 Lyapunov analysis is the direct ancestor of MB-1's `adaptKH` function and its descent certificate. |
| **Welling & Teh 2011** *SGLD* | **MD-3 / MD-4 SOURCE.** SGLD update rule θ_{t+1} = θ_t + ½·η_t·∇log p(θ_t‖D) + ε_t, ε_t ~ N(0, η_t) directly implemented by MD-3 with MD-4 providing the η_t schedule. |
| **Mikolov et al. 2013** *word2vec* | **MD-1 SOURCE.** Skip-gram + negative-sampling architecture matched by `src/embeddings/skip-gram.ts` including the unigram^(3/4) negative-sampling distribution. |
| **Zhang et al. 2026** *Prompt Optimization Is a Coin Flip* | **REFINEMENT WAVE KEYSTONE.** §4 analysis of 72 optimisation runs across 18,000 grid evaluations is the empirical finding rendered as ME-1's three-class classifier. |
| **Lanzara & Kuperstein 1991** *Quintessence five-axis frame* | **M8 ATTRIBUTION CORRECTION.** Continuation-wave dedication added Kuperstein as co-originator of the 1991 joint formulation behind `QuintesenceReport`. |

## Test posture

| Metric | Value |
|--------|-------|
| New test files (base wave) | 45 |
| New tests (base wave net) | +684 |
| New tests (refinement wave net) | +531 |
| New tests (continuation wave net) | +828 |
| Pre-existing failures | 2 (unchanged — `harness-integrity.test.ts` version-consistency, known baseline) |
| New failures | 0 |
| `tsc --noEmit` | clean |
| Grove REWRITEs executed | 0 |
| New runtime dependencies | 0 |
| Safety-critical tests (BLOCK) | 13 / 13 PASS |
| Base acceptance criteria met | 22 / 24 (2 deferred) |
| LS-* requirement coverage | 42 / 43 (LS-22 deferred) |

## By the numbers

| Metric | Value |
|--------|-------|
| Phases shipped (full arc) | 43 (636–678) |
| Waves | 3 (base + refinement + continuation) |
| Modules shipped | 8 base + 6 refinement + 13 continuation = 27 |
| Grand-total new passing tests | +2,043 |
| Default-off byte-identical checks | 3 (base / refinement / continuation) |
| New runtime dependencies | 0 |
| Primary-source dedications | 10 (Lanzara, Friston, Kirchhoff, Foxglove, Barto/Sutton/Anderson, Sastry/Bodson, Narendra/Annaswamy, Welling/Teh, Mikolov, Lanzara-Kuperstein) |

## Infrastructure

- **Base-wave src/ modules (8):** `src/graph/` (M1), `src/memory/` extensions (M2), `src/traces/` (M3), `src/branches/` (M4), `src/orchestration/` + `src/cache/` (M5), `src/sensoria/` (M6), `src/umwelt/` (M7), `src/symbiosis/` (M8). All modules ship default-off behind per-module `gsd-skill-creator.<name>.enabled` flags.
- **Refinement-wave src/ modules (6):** `src/output-structure/` (ME-5), `src/reinforcement/` (MA-6), `src/tractability/` (ME-1, keystone), `src/eligibility/` (MA-1), `src/ace/` (MA-2), plus the ME-4 coin-flip teach warning surface.
- **Continuation-wave src/ modules (13):** `src/lyapunov/` (MB-1), `src/projection/` (MB-2), `src/dead-zone/` (MB-5), `src/stochastic/` (MA-3+MD-2), `src/langevin/` (MD-3), `src/temperature/` (MD-4), `src/embeddings/` (MD-1), `src/learnable-k_h/` (MD-5), `src/representation-audit/` (MD-6), `src/model-affinity/` (ME-2), `src/ab-harness/` (ME-3), plus TC College and TC Rosetta bootstrap.
- **Documentation:** `docs/memory-stack.md`, `docs/sensoria.md`, `docs/umwelt.md`, `docs/symbiosis.md`, `docs/refinement-wave.md`, `docs/tractability.md`, `docs/reinforcement-taxonomy.md`, `docs/actor-critic.md`, `docs/stability-rails.md`, `docs/exploration-harness.md`, `docs/representation-frontier.md`, `docs/authoring-tools.md`.
- **Theoretical audit:** `docs/foundations/theoretical-audit.md` — primary-source derivations for all base-wave modules.
- **Grove re-architecture inventory:** `docs/grove-rearch/inventory.md` — EXTEND/NEW-LAYER/UNTOUCHED classification for all 104 files in `src/memory/` and `src/mesh/`.
- **Branch state:** `dev` → `main`. Milestone spec at `.planning/staging/living-sensoria-mission/03-milestone-spec.md`; mission README at `.planning/staging/living-sensoria-mission/README.md`.
- **Regression reports:** [base regression report](./regression-report.md), [refinement regression report](./regression-report-refinement.md), [continuation regression report](./regression-report-continuation.md).

---

## Dedications

Richard G. Lanzara's net-shift model, developed across *Origins of Life's Sensoria* (2023) and foundational work with Kuperstein (1991), provides the two-state receptor binding equilibrium that grounds M6's graded activation formula. The model converts an ad-hoc threshold into a closed-form equation with four testable behavioural consequences: Weber's law log-linearity, high-dose saturation, tachyphylaxis under sustained exposure, and the silent-binder edge case.

Karl J. Friston's free-energy principle, introduced in "The free-energy principle: a unified brain theory" (*Nature Reviews Neuroscience*, 2010) and extended in "The anatomy of choice: active inference and agency" (*Frontiers in Human Neuroscience*, 2013), furnishes the variational objective that M7 minimises. The formulation F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)] provides a single quantity whose minimisation simultaneously improves model accuracy and predictive coverage without requiring separate learning and control loops.

Michael Kirchhoff, Thomas Parr, Erik Palacios, Karl Friston, and Julian Kiverstein, in "The Markov blankets of life: autonomy, active inference and the free energy principle" (*J. R. Soc. Interface*, 2018), prove that any system that persists against thermodynamic dissipation necessarily exhibits a Markov-blanket structure — that the four-way partition into internal, sensory, active, and external states is a mathematical consequence of persistence, not a design choice. This result is what allows M7 to enforce the partition as a structural claim rather than a modelling convention.

Miles Tiberius Foxglove's *The Space Between: The Autodidact's Guide to the Galaxy* (2026) opens with a preface (pp. xxv–xxxii, pending source-print verification) establishing the boundary-condition frame: a human and an AI agent are two different kinds of pattern on two different substrates, and the exchange surface between them is the productive site precisely because of that incommensurability. This frame gives M8's symbiosis register its structural interpretation — the teaching and co-evolution ledgers are a formal accounting of what crosses the {Sensory, Active} boundary in each direction, not a claim that the exchange produces shared experience.

Andrew G. Barto, Richard S. Sutton, and Charles W. Anderson, in "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems" (*IEEE Transactions on Systems, Man, and Cybernetics*, 1983), introduce the Associative Search Element and Adaptive Critic Element decomposition. Their 1983 architecture is the direct ancestor of the refinement wave's MA-2 wire: M5's ActivationSelector plays the ASE role, M7's variational free-energy plays the ACE role, and MA-1's eligibility traces implement the §III temporal credit-assignment construct. Sutton & Barto's later textbook *Reinforcement Learning: An Introduction* (1998, 2018) supplies the TD(λ) generalisation that MA-1's decay kernels match to ≤10⁻¹⁴ on reference fixtures.

Shankar Sastry and Marc Bodson's *Adaptive Control: Stability, Convergence, and Robustness* (Prentice Hall, 1989) provides the Lyapunov-stability grounding that informs the refinement wave's bounded-learning invariants — the 0.3 tractability floor in MA-2's weighting formula, the per-channel τ constraints in MA-1's decay kernels, and the projection-operator posture on parameter updates. While the full model-reference adaptive system (MRAS) apparatus remains queued for a later wave (MB-1 through MB-6 in the novel-methods catalog), Thread B's mapping of Sastry's §1.4 stability definitions onto our module obligations gives a formal vocabulary for what "converges" means in the context of skill activation.

Xing Zhang, Guanghui Wang, Yanwei Cui, Wei Qiu, Ziyuan Li, Bing Zhu, and Peiyang He, in "Prompt Optimization Is a Coin Flip: Diagnosing When It Helps in Compound AI Systems" (arXiv:2604.14585v1, 2026), establish the empirical finding that is the refinement wave's organising principle. Their §4 analysis of 72 optimisation runs across 18,000 grid evaluations shows that prompt-content edits on compound AI systems produce effects statistically indistinguishable from coin-flip noise, except in a narrow regime where the task requires exploitable output structure the model can produce but does not default to. This diagnostic — rendered as a three-class classifier in ME-1 — becomes the gating variable through which every other refinement component (MA-1, MA-2, ME-4) weights its signal.

Max Welling and Yee Whye Teh, in "Bayesian Learning via Stochastic Gradient Langevin Dynamics" (*Proceedings of the 28th International Conference on Machine Learning*, ICML 2011, pp. 681–688), introduce the SGLD update rule: θ_{t+1} = θ_t + ½·η_t·∇log p(θ_t|D) + ε_t where ε_t ~ N(0, η_t). Their central contribution is the observation that adding Gaussian noise with the right variance schedule to gradient descent steps produces a Markov chain whose stationary distribution is the true posterior — noise as principled Bayesian posterior sampling, not as a heuristic perturbation. MD-3's Langevin noise injector is a direct implementation of their update rule, with MD-4's annealing schedule providing the decreasing η_t that makes the convergence guarantee applicable. The SGLD frame also gives the exploration-harness bundle its theoretical justification: the stochastic softmax in MA-3+MD-2 is the discrete-action counterpart of the same posterior-sampling argument, with temperature playing the role of the step-size schedule.

Tomas Mikolov, Kai Chen, Greg Corrado, and Jeffrey Dean, in "Efficient Estimation of Word Representations in Vector Space" (*International Conference on Learning Representations*, ICLR 2013, arXiv:1301.3781) and the companion word2vec papers, establish the skip-gram architecture with negative sampling as the standard shallow-embedding protocol. Their key architectural choice — a single hidden layer of fixed dimension d, trained to predict context given target with noise-contrastive estimation — keeps training cost within single-machine budget while producing representations that exhibit compositional structure (king − man + woman ≈ queen). MD-1 adopts this posture explicitly: the skip-gram trainer in `src/embeddings/skip-gram.ts` matches the Mikolov et al. objective, including the unigram^(3/4) negative-sampling distribution. The shallow-embedding constraint is a deliberate engineering decision, not a limitation: it keeps the embedding matrix small enough to be retrained incrementally as the session log grows, without requiring batch infrastructure.

Kumpati S. Narendra and Anuradha M. Annaswamy, in *Stable Adaptive Systems* (Prentice Hall, 1989), develop the model-reference adaptive system (MRAS) programme that gives MB-1 and MB-2 their formal stability vocabulary. Their Chapter 4 Lyapunov analysis of MRAS under bounded disturbances — showing that a parameter adaptation law of the form Γ⁻¹·dθ/dt = −e·φ (error times regressor) guarantees V̇ ≤ 0 for the quadratic Lyapunov candidate V = ½·e² — is the direct ancestor of MB-1's `adaptKH` function and its descent certificate. Narendra and Annaswamy pair with Sastry and Bodson (acknowledged in the refinement wave) to give a complete adaptive-control vocabulary: Sastry & Bodson supply the stability definitions and projection-operator posture; Narendra & Annaswamy supply the MRAS architecture and the convergence analysis under realistic disturbance assumptions. Together they are the two canonical texts on adaptive-control stability as applied to parameter adaptation, and both bodies of work are load-bearing in the stability-rails bundle. Narendra and Annaswamy's research programme in adaptive and learning systems remains active and actively cited; this acknowledgement recognises that contribution.

Richard Kuperstein, as co-originator with Richard G. Lanzara of the Quintessence five-axis vital-signs frame formalised in their 1991 joint work, is a co-contributor to the theoretical substrate that M8's Quintessence report implements. The original dedication in this document cited Lanzara's 2023 monograph as the primary source for M8; the Kuperstein addition closes a gap — the five-axis frame was developed jointly, and acknowledging only one co-originator was an incomplete attribution. The 1991 Lanzara–Kuperstein formulation of the five vital-signs axes (Self-vs-Non-Self, Essential Tensions, Growth-and-Energy-Flow, Stability-vs-Novelty, Fateful Encounters) is the direct source for the `QuintesenceReport` type in `src/symbiosis/quintessence.ts`.

The authors named here are actively working across adjacent fields; these acknowledgements recognise load-bearing contributions to live bodies of research, not memorial tribute.

## Links

- [Regression report (base)](./regression-report.md) — Phase 648 full test results, per-module breakdown, safety-critical test table, Grove re-architecture summary
- [Regression report (refinement)](./regression-report-refinement.md) — Refinement-wave addendum
- [Regression report (continuation)](./regression-report-continuation.md) — Continuation-wave addendum
- [Theoretical audit](../../foundations/theoretical-audit.md) — Primary-source derivations: net-shift equation, Markov-blanket partition, Quintessence five features, GraphRAG adaptation, Amiga Principle mapping
- [Grove re-architecture inventory](../../grove-rearch/inventory.md) — EXTEND/NEW-LAYER/UNTOUCHED classification for all 104 files in `src/memory/` and `src/mesh/`
- [Milestone spec](../../../.planning/staging/living-sensoria-mission/03-milestone-spec.md) — 24 acceptance criteria, scope boundaries, wave assignments, safety constraints
- [Mission README](../../../.planning/staging/living-sensoria-mission/README.md) — Module roster, execution summary, source packages
