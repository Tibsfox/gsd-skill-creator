/**
 * Entity Rebinding Circuit -- ai-computation concept (June-2026 arXiv cohort, T2).
 * @module departments/ai-computation/concepts/entity-rebinding-circuit
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 36 * 2 * Math.PI / 41;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const entityRebindingCircuit: RosettaConcept = {
  id: "ai-computation-entity-rebinding-circuit",
  name: "Entity Rebinding Circuit",
  domain: 'ai-computation',
  description:
    "Language models tracking a scenario must keep each entity bound to its current attribute and rebind it as state changes — when an item changes hands or a variable is reassigned, the stale attribute must be dropped and the new one reinstated at readout. The Entity Rebinding Circuit (arXiv 2606.08644v1) is a compact attention-head circuit, isolated by causal intervention, that binds entities to attributes and, on a state change, reinstates the updated binding when the answer is read out. Its representational signature migrates across model families — in Gemma it is expressed in the query/key subspaces of the relevant heads, in Llama it is carried primarily in the key vectors — so one computation is realized by different substrates.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "ai-computation-instruction-tensor-pattern",
      description: "Specializes the instruction-tensor pattern's dispatch-with-synchronization primitive: where the instruction tensor is a CPU-authored opcode sequence that reads bindings and reinstates state via counters, the rebinding circuit is the same read-bind-then-reinstate structure discovered inside attention heads by causal intervention rather than hand-written.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-distributed-attribute-retrieval",
      description: "Both concern how a model associates an entity with its attribute; distributed-attribute-retrieval spreads a value across heads for lookup, while the rebinding circuit is the mechanism that overwrites and reinstates that entity-attribute association when the scenario's state changes.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-attention-readout-gap",
      description: "The rebinding circuit reinstates the updated binding precisely at readout, so it localizes to the same decision-head stage the readout gap isolates; the readout gap explains why attended context and final decision diverge, and rebinding is the corrective computation performed there.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-citation-attribution-circuit",
      description: "Both are named attention-head circuits recovered by causal intervention rather than by correlational probing; the citation-attribution circuit routes a source to its claim, and the rebinding circuit routes an entity to its current attribute, making them sibling mechanistic circuits for association and re-association.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
