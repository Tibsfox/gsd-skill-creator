/**
 * Serialization Attention Decay concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.15633 (2026).
 *
 * @module departments/ai-computation/concepts/serialization-attention-decay
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 6 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const serializationAttentionDecay: RosettaConcept = {
  id: 'ai-computation-serialization-attention-decay',
  name: 'Serialization Attention Decay',
  domain: 'ai-computation',
  description: 'Serialization Attention Decay is the mechanism by which flattening a graph or other structured input into a token sequence corrupts an LLM\'s attention pattern. arXiv:2606.15633 (2026) shows how rotary positional embeddings (RoPE) turn graph linearization into bandwidth-dependent attention decay: two nodes that are adjacent in the graph but forced far apart in the serialized order acquire a large relative position, and because RoPE attenuates attention with distance, the model systematically suppresses attention between graph-adjacent nodes. The size of the distortion is governed by the graph bandwidth problem, the minimum achievable maximum edge span over all linear orderings, so structural fidelity rather than prompt wording or model scale sets the ceiling on graph reasoning. Concretely, a six-node path A-B-C-D-E-F laid out in its natural order keeps every edge one token apart (bandwidth 1), but a scrambled order such as A,C,E,B,D,F stretches adjacent pairs up to three tokens apart (bandwidth 3) — the same graph, yet the attention RoPE preserves between nodes that must exchange information falls off with that widened gap. Reframing the failure this way relocates the fix away from prompt engineering and scaling toward correcting attention misalignment. The paper\'s remedy, Graph-aligned Language Attention (GaLA), is a lightweight inference-time attention bias that boosts attention toward graph-adjacent nodes while preserving the model\'s sequential inductive biases; across Text-Attributed-Graph benchmarks it improves accuracy with negligible overhead and no retraining. Distinct from the Attention Readout Gap, which locates tool-selection failures downstream in the decision head after the model has already attended correctly, this mechanism is an upstream corruption of the attention pattern itself, where the model literally cannot see the adjacency it needs. For agent systems the implication is that whenever you serialize a graph, tree, dependency DAG, or any non-sequential structure into a prompt, the linearization order is a load-bearing design choice: a bandwidth-minimizing ordering (for example a Cuthill-McKee relabeling) or a cheap inference-time adjacency bias like GaLA can recover reasoning quality that no amount of prompt tuning or a larger model will.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-attention-readout-gap',
      description: 'Both dissect attention-driven failure but at opposite ends of the pipeline: serialization attention decay is an upstream corruption of the attention pattern (adjacency is suppressed before it can be read), whereas the attention readout gap places the failure downstream in the decision head after the model has already attended correctly',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-permutation-invariant-embedding',
      description: 'Both address the order-sensitivity of serializing structured input: permutation-invariant embedding removes dependence on element order, while serialization attention decay quantifies exactly how a bad order (large graph bandwidth) degrades RoPE attention between adjacent nodes',
    },
    {
      type: 'dependency',
      targetId: 'ai-computation-local-linearity-steering',
      description: 'GaLA\'s inference-time attention bias toward graph-adjacent nodes is a local-linearity steering move applied to the attention logits, adding a structural correction direction without retraining',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
