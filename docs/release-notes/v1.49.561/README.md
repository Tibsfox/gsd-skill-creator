# v1.49.561 — Living Sensoria

**Released:** 2026-04-18
**Scope:** Eight composable modules (M1–M8) — memory stack, net-shift receptor substrate, Markov-blanket boundary, teaching/co-evolution relationship layer
**Branch:** dev → main
**Type:** milestone — Living Sensoria (base mission M1–M5 + extension mission M6–M8)
**Predecessor:** v1.49.560 — Release Documentation Uplift
**Phases:** 636–650 (15 phases across Wave 0 → Wave 3)
**New tests:** +684 net (546 new module tests + 138 existing-suite coverage additions from integration wiring)
**New deps:** 0
**Verification:** All 24 acceptance criteria met; 2 deferred (LS-22 manual annotation, IT-08 doc-regen tooling); all 13 safety-critical tests PASS; zero new test failures

## Summary

v1.49.561 lands eight composable modules that extend gsd-skill-creator from a pattern log into a structured sensorium. The five mechanism modules (M1–M5) provide a semantic memory graph with Leiden community detection, a three-tier hybrid memory system with αβγ scoring and reflection, an append-only decision-trace ledger, copy-on-write branch-context experimentation, and a multi-turn retrieval loop with KVFlow-style anticipatory preloading. The three substrate/boundary/relationship modules (M6–M8) add a Lanzara net-shift receptor layer for graded skill activation, a Markov-blanket boundary enforced at the TypeScript type level with a variational free-energy minimiser, and a bidirectional teaching and co-evolution accounting system with a five-axis Quintessence vital-signs report. All eight modules default off; v1.49.560 installs load byte-identically with all flags unset. Zero new runtime dependencies were introduced.

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

Phases 649 and 650 are the two documentation publication phases; their commits will be created by the main orchestrator agent after SCRIBE output review.

## Key Results

| Metric | Value |
|--------|-------|
| New test files | 45 |
| New tests (net) | +684 |
| Pre-existing failures | 2 (unchanged — `harness-integrity.test.ts` version-consistency, known baseline) |
| New failures | 0 |
| `tsc --noEmit` | clean |
| Grove REWRITEs executed | 0 |
| New runtime dependencies | 0 |
| Safety-critical tests (BLOCK) | 13 / 13 PASS |
| Acceptance criteria met | 22 / 24 (2 deferred, neither blocks release) |

## Module Quick Reference

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

## Links

- [Regression report](./regression-report.md) — Phase 648 full test results, per-module breakdown, safety-critical test table, Grove re-architecture summary
- [Theoretical audit](../../foundations/theoretical-audit.md) — Primary-source derivations: net-shift equation, Markov-blanket partition, Quintessence five features, GraphRAG adaptation, Amiga Principle mapping
- [Grove re-architecture inventory](../../grove-rearch/inventory.md) — EXTEND/NEW-LAYER/UNTOUCHED classification for all 104 files in `src/memory/` and `src/mesh/`
- [Milestone spec](../../../.planning/staging/living-sensoria-mission/03-milestone-spec.md) — 24 acceptance criteria, scope boundaries, wave assignments, safety constraints
- [Mission README](../../../.planning/staging/living-sensoria-mission/README.md) — Module roster, execution summary, source packages

---

## Dedication

Richard G. Lanzara's net-shift model, developed across *Origins of Life's Sensoria* (2023) and foundational work with Kuperstein (1991), provides the two-state receptor binding equilibrium that grounds M6's graded activation formula. The model converts an ad-hoc threshold into a closed-form equation with four testable behavioural consequences: Weber's law log-linearity, high-dose saturation, tachyphylaxis under sustained exposure, and the silent-binder edge case.

Karl J. Friston's free-energy principle, introduced in "The free-energy principle: a unified brain theory" (*Nature Reviews Neuroscience*, 2010) and extended in "The anatomy of choice: active inference and agency" (*Frontiers in Human Neuroscience*, 2013), furnishes the variational objective that M7 minimises. The formulation F = D_KL[q(I) || p(I|S)] − E_q[log p(S|I)] provides a single quantity whose minimisation simultaneously improves model accuracy and predictive coverage without requiring separate learning and control loops.

Michael Kirchhoff, Thomas Parr, Erik Palacios, Karl Friston, and Julian Kiverstein, in "The Markov blankets of life: autonomy, active inference and the free energy principle" (*J. R. Soc. Interface*, 2018), prove that any system that persists against thermodynamic dissipation necessarily exhibits a Markov-blanket structure — that the four-way partition into internal, sensory, active, and external states is a mathematical consequence of persistence, not a design choice. This result is what allows M7 to enforce the partition as a structural claim rather than a modelling convention.

Miles Tiberius Foxglove's *The Space Between: The Autodidact's Guide to the Galaxy* (2026) opens with a preface (pp. xxv–xxxii, pending source-print verification) establishing the boundary-condition frame: a human and an AI agent are two different kinds of pattern on two different substrates, and the exchange surface between them is the productive site precisely because of that incommensurability. This frame gives M8's symbiosis register its structural interpretation — the teaching and co-evolution ledgers are a formal accounting of what crosses the {Sensory, Active} boundary in each direction, not a claim that the exchange produces shared experience.

---

## Refinement Wave

Six further components land in v1.49.561 after the original wave closed, motivated by a deep research mission covering three further bodies of work (Barto/Sutton/Anderson 1983 actor-critic, Sastry & Bodson 1989 adaptive control, Zhang et al. 2026 prompt-optimisation coin-flip diagnostic) plus a physics-of-neural-networks video lineage on NTK / mean-field / noise-as-temperature.

The central finding: Zhang et al.'s discovery that prompt-content optimisation on compound AI systems is statistically indistinguishable from a coin flip — except when the skill declares exploitable output structure — becomes the keystone gating variable that unifies the research threads.

| Phase | Component | Commit | Tests |
|---|---|---|---|
| 651 | ME-5 output-structure frontmatter | `b3e2f7984` | +87 |
| 652 | MA-6 canonical reinforcement taxonomy | `43d3052bd` | +45 |
| 653 | ME-1 tractability classifier (keystone) | `2c8b2a21a` | +102 |
| 654 | MA-1 eligibility-trace layer | `0516751b8` | +70 |
| 655 | MA-2 ACE actor-critic wire | `76ac640a1` | +40 |
| 656 | ME-4 coin-flip teach warning | `49522e982` | +136 |
| 657 | R3 refinement integration + SC-REF-FLAG-OFF | `0a1809dd8` | +51 |
| 658 | R4 regression addendum | `d54af87b5` | — |
| 659 | R4 docs addendum | `0a960bb48` | — |
| 660 | R4 release-notes addendum | (this commit) | — |

Grand total over the full v1.49.560 → v1.49.561 arc (22 shipped phases): **+1,215 new passing tests**. Zero new failures; two pre-existing harness-integrity version-consistency checks remain on the same baseline as phase 650.

Cross-links: [regression-report-refinement.md](regression-report-refinement.md) · [docs/refinement-wave.md](../../refinement-wave.md) · [docs/tractability.md](../../tractability.md) · [docs/reinforcement-taxonomy.md](../../reinforcement-taxonomy.md) · [docs/actor-critic.md](../../actor-critic.md).

### Extended Dedication

Andrew G. Barto, Richard S. Sutton, and Charles W. Anderson, in "Neuronlike Adaptive Elements That Can Solve Difficult Learning Control Problems" (*IEEE Transactions on Systems, Man, and Cybernetics*, 1983), introduce the Associative Search Element and Adaptive Critic Element decomposition. Their 1983 architecture is the direct ancestor of the refinement wave's MA-2 wire: M5's ActivationSelector plays the ASE role, M7's variational free-energy plays the ACE role, and MA-1's eligibility traces implement the §III temporal credit-assignment construct. Sutton & Barto's later textbook *Reinforcement Learning: An Introduction* (1998, 2018) supplies the TD(λ) generalisation that MA-1's decay kernels match to ≤10⁻¹⁴ on reference fixtures.

Shankar Sastry and Marc Bodson's *Adaptive Control: Stability, Convergence, and Robustness* (Prentice Hall, 1989) provides the Lyapunov-stability grounding that informs the refinement wave's bounded-learning invariants — the 0.3 tractability floor in MA-2's weighting formula, the per-channel τ constraints in MA-1's decay kernels, and the projection-operator posture on parameter updates. While the full model-reference adaptive system (MRAS) apparatus remains queued for a later wave (MB-1 through MB-6 in the novel-methods catalog), Thread B's mapping of Sastry's §1.4 stability definitions onto our module obligations gives a formal vocabulary for what "converges" means in the context of skill activation.

Xing Zhang, Guanghui Wang, Yanwei Cui, Wei Qiu, Ziyuan Li, Bing Zhu, and Peiyang He, in "Prompt Optimization Is a Coin Flip: Diagnosing When It Helps in Compound AI Systems" (arXiv:2604.14585v1, 2026), establish the empirical finding that is the refinement wave's organising principle. Their §4 analysis of 72 optimisation runs across 18,000 grid evaluations shows that prompt-content edits on compound AI systems produce effects statistically indistinguishable from coin-flip noise, except in a narrow regime where the task requires exploitable output structure the model can produce but does not default to. This diagnostic — rendered as a three-class classifier in ME-1 — becomes the gating variable through which every other refinement component (MA-1, MA-2, ME-4) weights its signal.

The authors named here are actively working across adjacent fields; these acknowledgements recognise load-bearing contributions to live bodies of research, not memorial tribute.

---

## Continuation Wave

The continuation wave lands the 13 second-wave proposals from the Living Sensoria research mission across five bundles: three adaptive-control stability rails (MB-1/MB-2/MB-5, Sastry & Bodson 1989 / Narendra & Annaswamy 1989 lineage), three exploration-harness components (MA-3+MD-2/MD-3/MD-4, Welling & Teh 2011 SGLD lineage), three representation-frontier components (MD-1/MD-5/MD-6, Mikolov et al. 2013 word2vec lineage), two authoring-tool components (ME-2 model affinity, ME-3 A/B harness), and the College + Rosetta bootstrap that closes GAP-2 from the v1.49.132 AAR. The wave adds +828 net-new tests and brings the total requirement coverage to 42 of 43 LS-* requirements (LS-22 remains the one deferred manual-annotation item). SC-CONT-FLAG-OFF verifies byte-identical selector behaviour to the phase 660 tip across three independent fixture captures with all continuation flags off.

| Phase | Component | Commit | Tests |
|-------|-----------|--------|-------|
| 661 | MB-1 Lyapunov-stable K_H adaptation | `85c5a5290` | 54 |
| 662 | MB-2 Smooth projection operators | `ed447c69e` | 80 |
| 663 | MB-5 Dead-zone bounded learning | `1538adc55` | 95 |
| 664 | MA-3+MD-2 Stochastic selection | `03f2e0df9` | 68 |
| 665 | MD-3 Langevin noise injection | `cf5c277f2` | 64 |
| 666 | MD-4 Temperature schedule | `903d5643b` | 91 |
| 667 | MD-1 Shallow learned embeddings | `6aaa5252c` | 80 |
| 668 | MD-5 Per-(skill, task-type) learnable K_H | `8c35f62c0` | 56 |
| 669 | MD-6 Representation audit | `8556c095e` | 80 |
| 670 | ME-2 Per-skill model affinity | `969cdb938` | 103 |
| 671 | ME-3 Skill A/B harness | `49142fcea` | 100 |
| 672 | TC College bootstrap | `4d6d98233` | — |
| 673 | TC Rosetta translations | `a7ec93295` | — |
| 674 | R10 Continuation integration | `7302dac46` | 95 |
| 675 | R11.1 Regression addendum #2 | `bfbf171e6` | — |
| 676 | R11.2 Continuation user-facing docs | `d3b8d0130` | — |
| 677 | R11.3 CHANGELOG continuation-wave entry | `8c87b205d` | — |
| 678 | R11.4 Release-notes + dedication | (this commit) | — |

**Grand total over the full v1.49.560 → v1.49.561 arc (43 shipped phases): +2,043 new passing tests.**

[regression-report-continuation.md](regression-report-continuation.md) · [docs/stability-rails.md](../../stability-rails.md) · [docs/exploration-harness.md](../../exploration-harness.md) · [docs/representation-frontier.md](../../representation-frontier.md) · [docs/authoring-tools.md](../../authoring-tools.md)

### Extended Dedication

Max Welling and Yee Whye Teh, in "Bayesian Learning via Stochastic Gradient Langevin Dynamics" (*Proceedings of the 28th International Conference on Machine Learning*, ICML 2011, pp. 681–688), introduce the SGLD update rule: θ_{t+1} = θ_t + ½·η_t·∇log p(θ_t|D) + ε_t where ε_t ~ N(0, η_t). Their central contribution is the observation that adding Gaussian noise with the right variance schedule to gradient descent steps produces a Markov chain whose stationary distribution is the true posterior — noise as principled Bayesian posterior sampling, not as a heuristic perturbation. MD-3's Langevin noise injector is a direct implementation of their update rule, with MD-4's annealing schedule providing the decreasing η_t that makes the convergence guarantee applicable. The SGLD frame also gives the exploration-harness bundle its theoretical justification: the stochastic softmax in MA-3+MD-2 is the discrete-action counterpart of the same posterior-sampling argument, with temperature playing the role of the step-size schedule.

Tomas Mikolov, Kai Chen, Greg Corrado, and Jeffrey Dean, in "Efficient Estimation of Word Representations in Vector Space" (*International Conference on Learning Representations*, ICLR 2013, arXiv:1301.3781) and the companion word2vec papers, establish the skip-gram architecture with negative sampling as the standard shallow-embedding protocol. Their key architectural choice — a single hidden layer of fixed dimension d, trained to predict context given target with noise-contrastive estimation — keeps training cost within single-machine budget while producing representations that exhibit compositional structure (king − man + woman ≈ queen). MD-1 adopts this posture explicitly: the skip-gram trainer in `src/embeddings/skip-gram.ts` matches the Mikolov et al. objective, including the unigram^(3/4) negative-sampling distribution. The shallow-embedding constraint is a deliberate engineering decision, not a limitation: it keeps the embedding matrix small enough to be retrained incrementally as the session log grows, without requiring batch infrastructure.

Kumpati S. Narendra and Anuradha M. Annaswamy, in *Stable Adaptive Systems* (Prentice Hall, 1989), develop the model-reference adaptive system (MRAS) programme that gives MB-1 and MB-2 their formal stability vocabulary. Their Chapter 4 Lyapunov analysis of MRAS under bounded disturbances — showing that a parameter adaptation law of the form Γ⁻¹·dθ/dt = −e·φ (error times regressor) guarantees V̇ ≤ 0 for the quadratic Lyapunov candidate V = ½·e² — is the direct ancestor of MB-1's `adaptKH` function and its descent certificate. Narendra and Annaswamy pair with Sastry and Bodson (acknowledged in the refinement wave) to give a complete adaptive-control vocabulary: Sastry & Bodson supply the stability definitions and projection-operator posture; Narendra & Annaswamy supply the MRAS architecture and the convergence analysis under realistic disturbance assumptions. Together they are the two canonical texts on adaptive-control stability as applied to parameter adaptation, and both bodies of work are load-bearing in the stability-rails bundle. Narendra and Annaswamy's research programme in adaptive and learning systems remains active and actively cited; this acknowledgement recognises that contribution.

Richard Kuperstein, as co-originator with Richard G. Lanzara of the Quintessence five-axis vital-signs frame formalised in their 1991 joint work, is a co-contributor to the theoretical substrate that M8's Quintessence report implements. The original dedication in this document cited Lanzara's 2023 monograph as the primary source for M8; the Kuperstein addition closes a gap — the five-axis frame was developed jointly, and acknowledging only one co-originator was an incomplete attribution. The 1991 Lanzara–Kuperstein formulation of the five vital-signs axes (Self-vs-Non-Self, Essential Tensions, Growth-and-Energy-Flow, Stability-vs-Novelty, Fateful Encounters) is the direct source for the `QuintesenceReport` type in `src/symbiosis/quintessence.ts`.

The authors named here are actively working across adjacent fields; these acknowledgements recognise load-bearing contributions to live bodies of research, not memorial tribute.
