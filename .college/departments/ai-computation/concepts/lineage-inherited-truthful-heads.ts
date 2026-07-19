/**
 * Lineage-Inherited Truthful Heads -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/lineage-inherited-truthful-heads
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 22 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lineageInheritedTruthfulHeads: RosettaConcept = {
  id: "ai-computation-lineage-inherited-truthful-heads",
  name: "Lineage-Inherited Truthful Heads",
  domain: 'ai-computation',
  description:
    "Lineage-Inherited Truthful Heads names the finding that context-truthfulness is an attention-head-level property that model families conserve: across Vicuna-, Qwen2.5-, LLaMA2-, and Mistral-based lineages, per-head Truth Scores stay strongly preserved after instruction tuning or multimodal adaptation, tracking preserved attention-head weights, with high-scoring heads attending to query-relevant evidence (arXiv 2606.15821, 2026). Its distinct contribution is showing a base LLM's truthfulness signature transfers to fine-tuned and multimodal descendants, which the authors exploit via TruthProbe, a soft-gating strategy that amplifies context-truthful heads while preserving other head contributions, improving contextual truthfulness on HaluEval and cutting multimodal hallucination on POPE and CHAIR. For agent systems it implies a governance shortcut: profile truthful heads once on a shared base model and reuse that map to harden every downstream variant against hallucination without re-probing each.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-grounding-faithfulness",
      description: "TruthProbe's amplification of context-truthful heads is a mechanistic lever for improving grounding faithfulness, making that objective the property it optimizes at the head level rather than through output-side filtering.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-knowledge-conflict-steering",
      description: "Both intervene on internal signals at inference: TruthProbe soft-gates truthful attention heads much as knowledge-conflict steering shifts activations to favor contextual evidence over parametric priors.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-attention-readout-gap",
      description: "The context-truthful heads that attend to query-relevant evidence are the same attention channels whose imperfect readout the attention-readout-gap concept quantifies, linking head-level truthfulness to what attention actually surfaces.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
