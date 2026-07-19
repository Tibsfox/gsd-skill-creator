import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const longRangeDependency: RosettaConcept = {
  id: 'agent-long-range-dependency',
  name: 'Long-Range Dependency',
  domain: 'agent-systems',
  description:
    'A stress benchmark over dependency depths 5-25, organized as five difficulty tiers across 270 instances ' +
    '(AgentEscapeBench, arxiv `2605.07926v1`, 2026): each task is an escape-room-style directed acyclic dependency ' +
    'graph over tools and items, where the agent must invoke real external functions, track incrementally-revealed ' +
    'hidden state, propagate intermediate results, and submit a deterministically-verifiable answer. Each successive ' +
    'step depends on a fact established by an earlier step whose details are no longer in the active context, so ' +
    'performance degrades with chain depth: humans fall from 98.3% at difficulty-5 to 80.0% at difficulty-25, and the ' +
    'best model from 90.0% to 60.0%, with failures attributed to breakdowns in long-range state tracking, clue ' +
    'adherence, and intermediate-result propagation. It reveals where retrieval, memory consolidation, and intent ' +
    'routing actually pay off vs where they collapse. The benchmark is a calibration instrument, not a leaderboard: ' +
    "it shows whether a system's memory architecture survives realistic dependency depth, and where the cliff is. " +
    'Implication: every agent-systems change that touches memory, retrieval, or context budgeting should be evaluated ' +
    'against a long-range-dependency probe, not just against single-task probes.',
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
    {
      type: "cross-reference",
      targetId: "agent-run-dependency-graph",
      description: "Both model agent execution as a dependency DAG: long-range-dependency is the failure mode where a distant upstream node's output must reach a much-later node, and run-dependency-graph is the structure that makes those edges explicit and traceable.",
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.09 + 0.16),
    angle: Math.atan2(0.4, -0.3),
  },
};
