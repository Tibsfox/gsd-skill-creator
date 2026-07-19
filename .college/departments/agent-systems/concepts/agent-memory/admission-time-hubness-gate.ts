/**
 * Admission-Time Hubness Gate -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/agent-memory/admission-time-hubness-gate
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 59 * 2 * Math.PI / 47;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const admissionTimeHubnessGate: RosettaConcept = {
  id: "agent-admission-time-hubness-gate",
  name: "Admission-Time Hubness Gate",
  domain: 'agent-systems',
  description:
    "Vector memory carries a write-side integrity gap: an attacker can craft a document whose embedding sits near many unrelated query regions, so once inserted it becomes the nearest neighbour of queries it should never match — poisoning that weaponizes hubness, the high-dimensional geometry phenomenon where a few points dominate everyone's k-nearest-neighbour lists (arXiv 2606.19692v1, 2026). The defense scores each incoming record against a bank of sentinel queries and quarantines hub-like candidates before insertion, rather than filtering at read time. This names the missing corner of the memory-defense taxonomy: read-side hardening guards what comes back, but only admission-time screening guards what goes in. For agents that append tool outputs, retrieved passages, and self-authored notes into shared memory, every write becomes a trust decision, not a free operation.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-content-addressed-storage",
      description: "Adds an admission gate to the write path of the content-addressed store — records are screened for hub geometry against sentinel queries before they earn an immutable place in memory.",
    },
    {
      type: "cross-reference",
      targetId: "ai-computation-isotropic-embedding",
      description: "Hubness is amplified by anisotropic embedding geometry, so isotropizing the space is a complementary representation-level mitigation that reduces how often engineered hubs can form.",
    },
    {
      type: "cross-reference",
      targetId: "agent-hybrid-retrieval",
      description: "The read-side counterpart over the same substrate — hybrid retrieval decides what a query returns, while this gate decides which records are ever eligible to be returned.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
