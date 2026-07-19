import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const engramMaturation: RosettaConcept = {
  id: 'agent-engram-maturation',
  name: 'Engram Maturation',
  domain: 'agent-systems',
  description:
    'A per-memory-record maturation model driven by access count and recency. The 2026 framing ' +
    "(arxiv `2605.08538v1`) treats memory not as a uniform slab but as a population of records with " +
    'individual maturation trajectories — engram maturation is one of six coupled mechanisms in that system ' +
    '(alongside sleep-phase consolidation, interference-based forgetting, reconsolidation-on-retrieval, entity ' +
    'knowledge graphs, and hybrid multi-cue retrieval). A freshly-written record starts weak and low-priority; a ' +
    'frequently-accessed record stabilizes and earns recall priority while an unused one decays back. The paper ' +
    'frames this as biological stabilization over time rather than a fixed set of named tiers, so the ' +
    '(cold, warm, hot) three-tier state machine used here is a cache-analogy overlay for teaching, not a literal ' +
    'taxonomy from the source. The maturation gradient is what makes consolidation tractable — cold/weak records ' +
    'are merge/decay candidates, hot/stabilized records get preferential reconsolidation. Across a VSCode ' +
    'issue-tracking workload the full system holds 97.2% retention precision while cutting stored records by 58% ' +
    '(+21.8 pp over baseline). The pattern recurs in the existing arena memory ' +
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
