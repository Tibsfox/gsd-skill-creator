/**
 * Categorical Prior Lock-In -- ai-computation concept (June-2026 arXiv additional scan, T2).
 * @module departments/ai-computation/concepts/categorical-prior-lock-in
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 26 * 2 * Math.PI / 23;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const categoricalPriorLockIn: RosettaConcept = {
  id: "ai-computation-categorical-prior-lock-in",
  name: "Categorical Prior Lock-In",
  domain: 'ai-computation',
  description:
    "Categorical prior lock-in is a structural failure mode of in-context learning (ICL) in which an LLM used as a conditional generator for structured data cannot update its prior over token distributions inherited from pre-training, no matter how many in-context examples it is shown (arXiv 2606.11961, 2026). Studied on high-cardinality tabular data across two 7B open-weight models, ICL improves numerical fidelity as examples accumulate yet hits a sharp ceiling on categorical distributions, failing to reproduce rare classes entirely. Its distinct contribution is separating what prompting can adapt (continuous magnitudes) from what it structurally cannot (discrete class priors). Parameter-efficient fine-tuning (LoRA) removes the ceiling but adds measurable memorization risk and can destabilize structured output, exposing an adaptability-privacy trade-off. For agent systems, it warns that few-shot prompting alone cannot faithfully match a new categorical distribution.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-bounded-learning-theorem",
      description: "Lock-in is a concrete instance of a fundamental ceiling on in-context adaptation: the bounded-learning theorem frames what prompting can and cannot change without weight updates, and categorical priors fall on the immovable side.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-data-free-mia-attack",
      description: "The LoRA remedy trades the categorical ceiling for measurable memorization risk, the exact attack surface a data-free membership-inference attack exploits, placing the two concepts at opposite poles of the same adaptability-privacy trade-off.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-utilization-accuracy-gap",
      description: "Both describe a saturation gap where adding more context yields diminishing returns: categorical fidelity plateaus despite extra examples, mirroring how evidence utilization can rise without closing the residual accuracy gap.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
