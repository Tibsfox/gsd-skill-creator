/**
 * Knowledge Conflict Steering -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/knowledge-conflict-steering
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 37 * 2 * Math.PI / 41;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const knowledgeConflictSteering: RosettaConcept = {
  id: "ai-computation-knowledge-conflict-steering",
  name: "Knowledge Conflict Steering",
  domain: 'ai-computation',
  description:
    "Retrieval-augmented models must decide, when a retrieved passage contradicts what their weights encode, whether to trust the context or their parametric memory — a context-versus-parametric knowledge conflict. Neuron-level edits that force contextual reliance tend to damage unrelated capabilities because the responsible neurons are entangled. SHIFT (arXiv 2606.27786) reframes the intervention as learnable gate modulation of activations: a lightweight gate multiplicatively rescales hidden units — rather than adding a fixed offset vector — so the model adaptively defers to contextual evidence, resolving conflict without the cascading capability loss of editing entangled neurons directly. The gate trains fewer than 0.01% of the model's parameters while the backbone stays frozen, and it holds up across six datasets — evidence that a tiny multiplicative controller can arbitrate the conflict that direct neuron editing must damage broad capabilities to resolve.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-grounding-faithfulness",
      description: "Specializes the parent's grounding-versus-faithfulness question into the specific context-parametric conflict case, replacing a decoding-time faithfulness measure with a mechanistic, activation-level intervention that controls which knowledge source wins.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-local-linearity-steering",
      description: "Both intervene in activation space to shift model behavior; the gate modulation here is a learnable, conflict-conditioned analogue of directional activation steering, scaling hidden units rather than adding a fixed offset vector.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-sparse-autoencoder-disentanglement",
      description: "The cascading capability damage this concept avoids arises from neuron entanglement — precisely the problem SAE disentanglement attacks by isolating monosemantic features; gating side-steps editing entangled units instead of untangling them.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-evidence-centric-reasoning",
      description: "Adaptively deferring to retrieved passages over parametric priors is the activation-level enabler of evidence-centric reasoning, which prioritizes cited contextual support when producing the answer.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
