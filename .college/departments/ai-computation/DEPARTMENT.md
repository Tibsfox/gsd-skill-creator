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
