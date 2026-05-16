import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const engramMaturation: RosettaConcept = {
  id: 'agent-engram-maturation',
  name: 'Engram Maturation',
  domain: 'agent-systems',
  description:
    'A per-memory-record state machine over (cold, warm, hot) tiers driven by access count and recency. The 2026 ' +
    "framing (arxiv `2605.08538v1`) treats memory not as a uniform slab but as a population of records with " +
    'individual maturation trajectories: a freshly-written record is cold (low recall priority, slow channel), a ' +
    "frequently-accessed record matures to warm and then to hot (high recall priority, fast channel), and an unused " +
    'record decays back. The tier transition is what makes consolidation tractable — cold records are merge/decay ' +
    'candidates, hot records get preferential reconsolidation. The pattern recurs in the existing arena memory ' +
    "(M5 policy-driven sweep) but the framing here is the per-record state, not the system-wide policy. Pairs with " +
    '`agent-memory-consolidation` (the offline driver) and `agent-content-addressed-storage` (the substrate).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-content-addressed-storage',
      description: 'Engrams are content-addressed records with maturation metadata attached',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-memory-consolidation',
      description: 'Consolidation is the offline driver that operates over engram maturation state',
    },
    {
      type: 'analogy',
      targetId: 'cache-tier-promotion',
      description: 'Engram maturation is to memory records as cache tier promotion is to cache lines',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.09 + 0.16),
    angle: Math.atan2(0.4, -0.3),
  },
};
