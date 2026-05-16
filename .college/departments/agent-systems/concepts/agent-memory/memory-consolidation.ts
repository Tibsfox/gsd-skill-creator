import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const memoryConsolidation: RosettaConcept = {
  id: 'agent-memory-consolidation',
  name: 'Memory Consolidation',
  domain: 'agent-systems',
  description:
    'An offline phase that merges, decays, and re-indexes long-lived memory between active sessions. The 2026 framing ' +
    '(arxiv `2605.08538v1`) treats consolidation as the only escape from unbounded growth: read-side filtering at ' +
    'retrieval time defers the problem but does not solve it. Three operations recur — merge (combine ' +
    'near-duplicate records), decay (lower access weight on stale records), reconsolidation (re-encode records ' +
    'that were modified at retrieval time so the next read sees the modification). The pattern is the memory ' +
    "instantiation of fast/slow co-evolution (Theme D): retrieval runs online per task, consolidation runs offline " +
    'at session/milestone boundaries. Closes the failure mode where an agent system that runs for weeks accumulates ' +
    'memory faster than it forgets and eventually drowns its own retrieval. Anchored at the rosetta-core level as Concept 10.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'rosetta-memory-consolidation',
      description: 'Anchored at the rosetta-core level as concept #10',
    },
    {
      type: 'dependency',
      targetId: 'agent-engram-maturation',
      description: 'Engram maturation is the per-record state machine that consolidation operates over',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-fast-slow-coevolution',
      description: 'Memory consolidation is the fast/slow pattern applied to memory rather than to topology',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.09 + 0.25),
    angle: Math.atan2(0.5, -0.3),
  },
};
