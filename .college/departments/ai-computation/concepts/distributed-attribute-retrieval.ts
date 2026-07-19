/**
 * Distributed Attribute Retrieval -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/distributed-attribute-retrieval
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 34 * 2 * Math.PI / 41;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const distributedAttributeRetrieval: RosettaConcept = {
  id: "ai-computation-distributed-attribute-retrieval",
  name: "Distributed Attribute Retrieval",
  domain: 'ai-computation',
  description:
    "Mechanistic interpretability long assumed a fact lives in one localizable circuit — a specific MLP or attention head you could edit or ablate. Tracing factual attribute recall via activation patching, arXiv 2606.21345v1 finds instead that each fact is retrieved along non-contiguous, layer-skipping paths, with several functionally-equivalent routes per attribute. Retrieval is thus redundant and distributed: ablating one path leaves others intact, which explains why localized model-editing (ROME-style) often fails to fully erase a fact and why single-circuit locality claims overstate how concentrated knowledge really is.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-activation-delta-probe",
      description: "The redundant-path result is produced by activation-delta / patching probes: swapping per-layer activations between corrupted and clean runs is exactly what exposes the multiple functionally-equivalent routes, so distributed attribute retrieval is the empirical finding of applying that probe systematically across layers and heads.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-entity-rebinding-circuit",
      description: "Both localize factual/entity knowledge inside the network; the rebinding circuit isolates where an entity's attributes are bound and moved, while this concept shows that binding-and-recall is spread across several redundant, layer-skipping paths rather than one clean circuit.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-citation-attribution-circuit",
      description: "Attribution circuits trace which internal component supplied a fact or citation; distributed attribute retrieval qualifies that picture by showing multiple equivalent components can supply the same attribute, making internal attribution many-to-one rather than a single responsible path.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-knowledge-conflict-steering",
      description: "Knowledge-conflict steering assumes an identifiable locus of stored knowledge to steer or overwrite; redundancy across parallel layer-skipping paths means steering one route can be bypassed by the others, bounding how reliably such interventions actually change the stored fact.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
