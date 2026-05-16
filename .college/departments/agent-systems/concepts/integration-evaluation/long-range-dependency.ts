import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const longRangeDependency: RosettaConcept = {
  id: 'agent-long-range-dependency',
  name: 'Long-Range Dependency',
  domain: 'agent-systems',
  description:
    'A stress benchmark over dependency depths 5-20: each successive task in a chain depends on a fact established by ' +
    "an earlier task whose details are no longer in the active context. The 2026 framing (AgentEscapeBench, arxiv " +
    '`2605.07926v1`) measures how performance degrades with chain depth and reveals where retrieval, memory ' +
    'consolidation, and intent routing actually pay off vs where they collapse. The benchmark is a calibration ' +
    "instrument, not a leaderboard: it shows whether a system's memory architecture survives realistic dependency " +
    'depth, and where the cliff is. Implication: every agent-systems change that touches memory, retrieval, or ' +
    'context budgeting should be evaluated against a long-range-dependency probe, not just against single-task probes.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-memory-consolidation',
      description: 'Long-range tasks succeed only when consolidation has kept the relevant prior facts retrievable',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-hybrid-retrieval',
      description: 'The benchmark stresses retrieval channels — lexical wins on exact-fact lookup at depth',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-paired-trace-audit',
      description: 'Paired-trace audit at depth 5-20 reveals consolidation/retrieval effects that single-task audit misses',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.09 + 0.16),
    angle: Math.atan2(0.4, -0.3),
  },
};
