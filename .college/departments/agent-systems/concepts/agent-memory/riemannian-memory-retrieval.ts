/**
 * Riemannian Memory Retrieval -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/riemannian-memory-retrieval
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 74 * 2 * Math.PI / 85;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const riemannianMemoryRetrieval: RosettaConcept = {
  id: "agent-riemannian-memory-retrieval",
  name: "Riemannian Memory Retrieval",
  domain: 'agent-systems',
  description:
    "Long-term agent memory usually ranks stored records by cosine similarity in one shared embedding space, but in high dimensions a few \"hub\" vectors become spurious nearest neighbors to nearly every query, silently corrupting recall as the store grows. CoreMem (arXiv:2606.18406v1) replaces this isotropic metric with a locally adaptive Fisher-Rao (Riemannian) distance that reshapes the space per region to suppress hubs, and adds Fisher-guided distillation to compress the store along low-information directions. For agents, retrieval accuracy then holds up under large, skewed memory instead of degrading in ways a flat cosine score cannot expose.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-isotropic-embedding",
      description: "Specializes the parent's diagnosis into a fix: where isotropic embedding merely names hubness as the high-dimensional failure mode, this applies a locally adaptive Fisher-Rao metric to actually neutralize hubs at retrieval time.",
    },
    {
      type: "cross-reference",
      targetId: "agent-admission-time-hubness-gate",
      description: "Both target hubness but at opposite ends of the pipeline: the admission gate quarantines hub-forming records at write time, while Riemannian retrieval reshapes the distance metric at read time to demote hubs already stored.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "The Fisher-guided distillation half compresses the memory store along low-information directions, complementing consolidation's promotion and pruning of records into a compact, durable long-term set.",
    },
    {
      type: "analogy",
      targetId: "agent-hybrid-retrieval",
      description: "An alternative route to robust recall: hybrid retrieval blends several retrievers to escape single-metric failure, whereas this keeps one retriever but swaps the flat cosine metric for a locally curved Riemannian one.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
