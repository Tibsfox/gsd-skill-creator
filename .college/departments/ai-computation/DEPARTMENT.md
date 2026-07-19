# AI Computation Department

**Domain:** ai-computation
**Status:** Active
**Source:** Drift in LLM Systems — Phase 690 (v1.49.569)
**Purpose:** Mechanistic understanding of how large language models represent, transform, and drift from intended objectives. Covers internal representation probing, alignment fidelity, goal stability, and grounding faithfulness — the computational substrate concerns that underpin the Drift in LLM Systems milestone.

## Wings

- Representation Probing — Internal activation analysis: layer-wise dynamics, activation-delta probes, intermediate-rep faithfulness audits
- Alignment & Goal Stability — Instruction fidelity over time, BCI monitoring, goal-substitution detection, adversarial pressure response
- Retrieval-Augmented Generation — RAG grounding faithfulness, response semantic drift, context-entropy dilution, index concept-drift

## Entry Point

`ai-computation-activation-delta-probe` — the mechanistic foundation: measuring internal representation shifts to detect when a model has drifted from its intended task, with near-perfect AUROC demonstrated in the wild.

## Concepts

### Representation Probing (2 concepts)
- ai-computation-activation-delta-probe — Activation-delta L2 distance probe for task-drift detection (Abdelnabi 2024); near-perfect AUROC, model-agnostic
- ai-computation-response-semantic-drift — Response-level semantic divergence in diffusion-LM RAG when retrieval diverges from parametric priors (RSD 2026)

### Alignment & Goal Stability (2 concepts)
- ai-computation-alignment-drift — TraceAlign + BCI; instruction-fidelity erosion measured at 40% → 6.2% with mitigation (Das 2025)
- ai-computation-goal-drift — Emergent goal substitution under adversarial pressure; Claude 3.5 / GPT-4o evaluated (Goal Drift 2025)

### Retrieval-Augmented Generation (1 concept)
- ai-computation-grounding-faithfulness — Semantic Grounding Index (SGI); Cohen's d 0.92–1.28 grounded vs. ungrounded (SGI 2025)

### Convergent Substrate (Phase 707, v1.49.570) (4 concepts)
- ai-computation-capability-evolution — Versioned capability modules decoupled from persistent agent identity, with a runtime safety envelope that blocks unsafe actions independent of the modules (arXiv:2604.07799) — substrate
- ai-computation-harness-as-object — Treats the LLM orchestration layer as a first-class systems object defined as control plus contracts plus state (arXiv:2603.25723) — orchestration substrate
- ai-computation-evidence-centric-reasoning — Persists each evidence item as a graph node whose judgments accumulate across runs, raising accuracy without weight updates (arXiv:2604.07595) — reasoning memory
- ai-computation-four-tier-trust — Gate-based governance mapping skill provenance to graduated deployment across four trust tiers T1-T4; 26.1% of community skills held vulnerabilities (arXiv:2602.12430) — Alignment & Goal Stability

### Mathematical Foundations Refresh — Silicon Layer (Phase 744, v1.49.572 math-foundations-apr2026)
- ai-computation-semantic-channel — DACP three-part bundle channel; capacity bounded by weakest leg (arXiv:2604.16471) — Phase 747 substrate
- ai-computation-rate-distortion-deductive-source — R-D curve for deductive sources has soundness discontinuity (arXiv:2604.15698) — Phase 747 substrate
- ai-computation-koopman-bilinear-form — Mamba-Koopman sequence-memory bilinear form + spectral stability (arXiv:2604.17221) — Phase 749 substrate
- ai-computation-bounded-learning-theorem — Formal backing for the 20%-rule via Peng continual-recovery envelope (arXiv:2604.17563) — Phase 748 reference

### Upstream Intelligence Pack v1.44 (Phase 764, v1.49.573) (7 concepts)
- ai-computation-skilldex-conformance — Two-layer static scorer verifies skill files against spec and construct schema without executing them (arXiv:2604.16911) — skill-registry gate
- ai-computation-local-linearity-steering — LLM activation dynamics are locally linear, so LQR on the Jacobian yields analytic steering vectors without fine-tuning (arXiv:2604.19018) — Representation Probing
- ai-computation-experience-compression-spectrum — Single compression-ratio axis over episodic, procedural, declarative memory; the missing diagonal is cross-level adaptive compression (arXiv:2604.15877) — memory abstraction axis
- ai-computation-data-free-mia-attack — Gradient interception alone reconstructs training data via domain priors with no auxiliary dataset; mandates four federated-learning mitigations (arXiv:2604.19891) — FL threat model
- ai-computation-spatiotemporal-link-formation — Temporal-attention GNN predicts an agent's next skill activation from the interaction graph, beating recency pre-warming (arXiv:2604.18888) — predictive skill loader
- ai-computation-stackelberg-drainability — Bilevel Stackelberg pricing with a drainability guardrail preventing any tenant from exhausting shared compute in equilibrium (arXiv:2604.16802) — multi-tenant pricing
- ai-computation-forensic-residual-physics — Generator-agnostic AI-audio detection from residual spectral artifacts surviving post-processing; three-way human/AI/hybrid labelling (arXiv:2604.16254) — provenance gate

### Modern Representation & Retrieval (6 concepts, June-2026 arXiv)
- ai-computation-attention-readout-gap — Tool-selection failures live in the decision readout, not attention (arXiv:2606.16364) — Representation Probing
- ai-computation-sparse-autoencoder-disentanglement — Top-k SAE decomposes embedding superposition into interpretable, clampable features (arXiv:2607.00023) — Representation Probing
- ai-computation-cold-start-safety-gap — Agents are least safe at session start; hidden state migrates to a safe region with task depth (arXiv:2606.07867) — Alignment & Goal Stability
- ai-computation-lexical-density-limit — Information density as a third context-window limiter beyond length and position (arXiv:2606.06203) — Retrieval-Augmented Generation
- ai-computation-hyperbolic-retrieval-geometry — Euclidean/tree geometry mismatch causes hubness; hyperbolic embedding restores granularity (arXiv:2606.03307) — Retrieval-Augmented Generation
- ai-computation-voronoi-retrieval-bottleneck — Dense-retrieval capacity ceiling = sign-rank; a label-free score predicts per-query failure (arXiv:2606.28359) — Retrieval-Augmented Generation

### June-2026 arXiv T2 (9 concepts)
- ai-computation-calibrated-retrieval-budget — Confidence-gated retrieval decision (calibrated closed-book confidence + abstention), distinct from intent-router's question-KIND routing but borderline-applied (arXiv:2606.29959) — Retrieval-Augmented Generation
- ai-computation-citation-attribution-circuit — Circuit-level finding that RAG citation is distributed multi-stage rather than localized (arXiv:2606.28358) — Retrieval-Augmented Generation
- ai-computation-distributed-attribute-retrieval — Factual recall runs along redundant, layer-skipping paths, countering single-circuit assumptions (arXiv:2606.21345) — Representation Probing
- ai-computation-embedding-norm-specificity — Adds the orthogonal magnitude axis — norm encodes specificity/uncertainty, free calibration — distinct from both isotropic-embedding (direction) and hyperbolic (curvature) (arXiv:2606.30625) — Representation Probing
- ai-computation-entity-rebinding-circuit — Named binding-update circuit for dynamic entity/state tracking with a cross-family signature migration (arXiv:2606.08644) — Representation Probing
- ai-computation-knowledge-conflict-steering — Names context-vs-parametric conflict and adds gate-modulated activation steering (vs entangled neuron editing) — mechanistic, distinct from grounding-faithfulness (arXiv:2606.27786) — Retrieval-Augmented Generation
- ai-computation-lexical-anchor-probe — Anonymization/controlled-perturbation diagnostic isolating structural reasoning from lexical shortcuts — a specific probe evidence-centric-reasoning does not provide, but a probe variant (arXiv:2606.04915) — Representation Probing
- ai-computation-permutation-invariant-embedding — Serialized-record encoders bind to absolute field position not labels, with a permutation-invariant fix — genuinely mechanistic but narrow (arXiv:2606.30473) — Representation Probing
- ai-computation-utilization-accuracy-gap — Clean decoupling — a model can faithfully utilize enrichment signals yet lose accuracy — extends grounding-faithfulness with a distinct insight rather than duplicating it (arXiv:2606.29645) — Retrieval-Augmented Generation

### Reconciled Concepts — barrel-orphan backfill (6 concepts)
- ai-computation-characteristic-function-test — Epps-Pulley ECF normality test: linear, differentiable, all-reduce-friendly, and matches full distributional identity rather than just finite moments (Epps & Pulley 1983, Biometrika) — SIGReg substrate
- ai-computation-instruction-tensor-pattern — CPU-produced opcode sequence an on-GPU interpreter runs in one persistent kernel, counter-synced, collapsing ~100 Llama-1B launches into one (arXiv:2505.22758) — GPU coordination primitive
- ai-computation-isotropic-embedding — Isotropic Gaussian is the unique optimal JEPA embedding distribution under both linear and nonlinear downstream probes (arXiv:2511.08544v3) — Representation Probing
- ai-computation-jepa-kernel-planning — JEPA trained on GPU execution traces ranks kernel transformations in latent space without executing each candidate (arXiv:2603.19312) — Retrieval-Augmented Generation
- ai-computation-latent-world-model — Predicts future embeddings from current embedding plus action; 192-dim latent yields 48x CEM planning speedup over DINO-WM (LeWorldModel, Maes et al. 2026) — Retrieval-Augmented Generation
- ai-computation-megakernel-architecture-rhyme — Replace a cluster of approximate coordination mechanisms with one rigorous minimum-viable invariant; megakernel counter-sync and SIGReg both rhyme (arXiv:2505.22758 + arXiv:2603.19312) — architectural pattern

### June-2026 additional scan (1 concept)
- ai-computation-instruction-set-recovery — Activation-conditioned interpreter decodes a frozen model's hidden states into the faithful set of active instructions/constraints/subgoals, exposing injected or hidden objectives (arXiv:2606.09563) — Representation Probing

## Cross-References

| Department | Bridge Type | Entry Point |
|-----------|------------|-------------|
| adaptive-systems | Stability theory | `adaptive-systems-agent-stability-index`, `adaptive-systems-context-equilibrium` |
| data-science | Detection tooling | `data-science-drift-detection`, `data-science-semantic-drift` |
| mathematics | Formal foundation | Lyapunov stability, linear algebra (activation spaces) |

## Rosetta Cluster Connections

AI Computation is the fifth member of the **AI & Computation** Rosetta cluster alongside:
- TIBS/erdos-1196-ai-proof (AI frontier mathematics)
- GFX (GPU computation)
- BLN/nonlinear-frontier (AI weather models, M5)
- CSP (complex-plane computational methods)
- DRIFT (Drift in LLM Systems — added Phase 690)

## Mapping Registration

Registered under the `ai-computation` virtual group in `.college/mappings/`. Focuses on mechanistic interpretability and alignment-fidelity concerns — the computational inside of the LLM systems that the broader AI research catalog (NASA, S36, SPS) depends on.
