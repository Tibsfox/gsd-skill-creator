/**
 * Citation Attribution Circuit -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/citation-attribution-circuit
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 33 * 2 * Math.PI / 41;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const citationAttributionCircuit: RosettaConcept = {
  id: "ai-computation-citation-attribution-circuit",
  name: "Citation Attribution Circuit",
  domain: 'ai-computation',
  description:
    "When a RAG model attaches an inline citation, engineers often assume a single \"citation head\" or localized component decides it. Activation patching in How Do LLMs Cite? (arXiv:2606.28358v1) refutes this: the choice is produced by a distributed, multi-stage attribution circuit — evidence localization, source-token binding, then a late format-and-emit step — and no single ablation removes citation behavior. This matters because faithfulness interventions aimed at one component leave the rest of the circuit intact, so missing or hallucinated attributions must be diagnosed circuit-wide rather than patched at one site.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-grounding-faithfulness",
      description: "Specializes the behavioural notion of grounding faithfulness by giving it a mechanistic account: the attribution circuit is the internal machinery whose stages determine whether a generated claim is actually tied to its cited source.",
    },
    {
      type: "analogy",
      targetId: "ai-computation-entity-rebinding-circuit",
      description: "Both are circuit-level findings recovered by activation patching, showing that a seemingly atomic behaviour (binding an entity, or emitting a citation) is implemented by a multi-component circuit rather than one localized head.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-distributed-attribute-retrieval",
      description: "Reinforces the distributed-mechanism theme: just as attribute recall is spread across layers rather than a single lookup, citation attribution is spread across sequential circuit stages, so component-level ablations underestimate the true behaviour.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-evidence-centric-reasoning",
      description: "Provides the internal substrate for evidence-centric reasoning in RAG: the attribution circuit's evidence-localization and source-binding stages are the mechanistic realization of routing reasoning through cited evidence.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
