/**
 * Bi Temporal Fact Invalidation -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agent-memory/bi-temporal-fact-invalidation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 49 * 2 * Math.PI / 85;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const biTemporalFactInvalidation: RosettaConcept = {
  id: "agent-bi-temporal-fact-invalidation",
  name: "Bi Temporal Fact Invalidation",
  domain: 'agent-systems',
  description:
    "Agent long-term memory accumulates facts that go stale: when a new fact contradicts a stored one, systems either replay the whole history or spend an LLM call per fact to decide which still holds. Engram (2026) instead stores memory as a bi-temporal knowledge graph, tagging every fact with valid-time (when it is true in the world) and transaction-time (when it was recorded). Contradictions are resolved by closing a superseded fact's valid-time interval — cheap, deterministic invalidation, no per-fact LLM adjudication. Retrieval then returns only facts valid at query time, so a lean context outperforms full-history replay and gains auditable temporal provenance.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-memory-consolidation",
      description: "Specializes consolidation: instead of merging or summarizing facts into a lossy digest, it keeps every fact and resolves conflicts by temporal invalidation, so consolidation becomes a deterministic valid-time close rather than an LLM rewrite.",
    },
    {
      type: "cross-reference",
      targetId: "agent-temporal-supersession-memory",
      description: "Shares the supersession-over-time premise; bi-temporal invalidation adds a second transaction-time axis so you can query what the agent believed at any past moment, not just what is currently true in the world.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-validity-gate",
      description: "The validity gate filters reads down to currently-valid memory; bi-temporal invalidation is the write-side mechanism that maintains the valid-time intervals the gate depends on to admit or reject a fact.",
    },
    {
      type: "cross-reference",
      targetId: "agent-engram-maturation",
      description: "Sibling mechanism from the same Engram system; maturation governs how facts strengthen or decay with reuse over time, complementing the valid-time invalidation of facts that have been directly contradicted.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
