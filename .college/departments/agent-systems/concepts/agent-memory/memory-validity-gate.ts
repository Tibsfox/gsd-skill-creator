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
    "A retriever can surface a fact that was true when stored but overturned by a later turn — the user corrected it or a subsequent decision superseded it — yet cosine relevance is blind to this staleness. ConvMemory v3 (arXiv 2606.26753v1, 2026) adds a read-side validity layer downstream of the v1/v2 retrieval path. Its core is a dual-evidence gate doing target-conditioned relation verification: it scores a (target, source) pair as the PRODUCT of a MiniLM slot head and a DeBERTa-v3 slot head, then gates that judgment on conservative event/operation evidence that a later turn actually updated, corrected, or superseded the memory. Crucially the layer PRESERVES retrieval by default — a 'context mode' attaches structured validity metadata while keeping the candidate set and rank order fixed — and only an explicit opt-in 'demote mode' reorders results for dense current-state workloads, where it lifts current-active H@1 from a never-demote baseline of 45.1% to 95.7% while still protecting non-superseded memories at 99.4% recall. Retrieval accuracy and temporal currency are distinct axes: the top-k neighbour can be exactly right yet already obsolete, so “still valid?” becomes a checkpoint separate from “relevant?”, keeping retired facts from silently driving action.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-hybrid-retrieval",
      description: "Specializes hybrid retrieval by adding a temporal-validity check downstream of the match: hybrid ranking optimizes getting the right item, while this gate re-examines a correctly-retrieved memory against later turns and, by default, attaches validity metadata without touching rank — only under an opt-in demote mode does a subsequent update or supersession actually reorder the item down.",
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
