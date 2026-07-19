/**
 * Memory Validity Gate -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/memory-validity-gate
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 64 * 2 * Math.PI / 85;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const memoryValidityGate: RosettaConcept = {
  id: "agent-memory-validity-gate",
  name: "Memory Validity Gate",
  domain: 'agent-systems',
  description:
    "A retriever can surface a fact that was true when stored but overturned by a later turn — the user corrected it or a subsequent decision superseded it — yet cosine relevance is blind to this staleness. ConvMemory (arXiv 2606.26753v1, 2026) adds a read-side validity gate: before a retrieved memory is used, scan the turns following its creation for an update, correction, or supersession that invalidates it, and suppress it if found. Retrieval accuracy and temporal currency are distinct axes — the top-k neighbour can be exactly right yet already obsolete. For multi-turn agents, “still valid?” becomes a checkpoint separate from “relevant?”, keeping retired facts from driving action.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Specializes hybrid retrieval by adding a temporal-validity check downstream of the match: hybrid ranking optimizes getting the right item, while this gate re-examines a correctly-retrieved memory against later turns and suppresses it when a subsequent update or supersession has since invalidated it.",
    },
    {
      type: "cross-reference",
      targetId: "agent-temporal-supersession-memory",
      description: "The read-side counterpart to write-side supersession: supersession structurally retires contradicted facts at write time, while this gate catches items that slipped through by re-verifying validity against later conversation turns at use time.",
    },
    {
      type: "analogy",
      targetId: "agent-memory-use-warrant",
      description: "Same read-side gate family firing after retrieval succeeds — the warrant admits or blocks a correctly-retrieved item by appropriateness, while this gate admits or blocks it by temporal currency; both separate 'should this be used?' from 'is this relevant?'.",
    },
    {
      type: "cross-reference",
      targetId: "agent-bi-temporal-fact-invalidation",
      description: "Both hinge on temporal invalidation of stored facts; bi-temporal invalidation closes a fact's validity interval inside the store, whereas this gate runs an equivalent invalidation check at read time by scanning the turns after a memory's creation.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
