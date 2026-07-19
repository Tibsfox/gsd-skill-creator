/**
 * Utilization Accuracy Gap -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/utilization-accuracy-gap
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 40 * 2 * Math.PI / 41;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const utilizationAccuracyGap: RosettaConcept = {
  id: "ai-computation-utilization-accuracy-gap",
  name: "Utilization Accuracy Gap",
  domain: 'ai-computation',
  description:
    "Retrieval-augmented systems are often judged by whether they use injected context — attending to passages, obeying per-passage confidence scores, citing sources — on the assumption that faithful use tracks correctness. arXiv 2606.29645 (2026) isolates the utilization-accuracy gap: a model can correctly comply with enrichment signals such as confidence scores yet return a worse final answer, so utilization and accuracy are separable axes. It matters because faithfulness metrics can climb while answer quality falls, making \"the model used the context\" an unreliable proxy for \"the model got it right\".",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-grounding-faithfulness",
      description: "Specializes grounding-faithfulness: SGI measures whether an answer is entailed by retrieved sources, and the gap sharpens it by showing a model can faithfully utilize that context yet still lose accuracy, so a high grounding score is necessary evidence but not a correctness guarantee.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-attention-readout-gap",
      description: "Both name a dissociation between engaging a signal and producing the right output: 'looking is not picking' separates strongest attention from correct tool choice, mirroring how faithful compliance with enrichment signals separates from a correct final answer.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-calibrated-retrieval-budget",
      description: "The enrichment signals here are per-passage confidence scores; calibrated-retrieval-budget governs how such confidence should modulate retrieval, and the gap warns that obeying those scores faithfully does not by itself raise answer accuracy.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-knowledge-conflict-steering",
      description: "When injected context conflicts with parametric knowledge, steering decides which to trust; the utilization-accuracy gap shows that even faithfully following the injected signal can degrade the answer, marking when compliance should be overridden.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
