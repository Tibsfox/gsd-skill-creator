import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fastSlowCoevolution: RosettaConcept = {
  id: 'agent-fast-slow-coevolution',
  name: 'Fast-Slow Co-Evolution',
  domain: 'agent-systems',
  description:
    'A multi-agent system runs two learning loops at different cadences: a fast loop that updates individual agent ' +
    'capability per-trajectory, and a slow loop that evolves the topology — meta-LLM-driven births, deaths, merges, ' +
    'splits, and edge edits — at meta-level intervals. The 2026 framing (TacoMAS, arxiv `2605.09539`) makes the ' +
    'separation explicit: capability updates are cheap and local; topology updates are expensive and global, so they ' +
    'must be amortised across many trajectories. Moving topology slowly is not merely cheaper — it drives the system ' +
    'toward a task-conditioned stable equilibrium, which is the mechanistic reason coordination stays coherent while ' +
    'capability keeps improving. This online graph adaptation yields about 13.3% average improvement over the ' +
    'strongest of ~20 baselines across four benchmarks. The pattern recurs across the 2026 frontier (Theme D: two ' +
    'timescales) — per-task probe-and-prefill / ' +
    'offline counterfactual audit, online retrieval / offline memory consolidation, per-correction autonomy ledger / ' +
    'post-execution intent-recovery audit. Implication: every long-lived agent system needs an explicit slow loop, ' +
    'not just a fast one.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-spectral-topology',
      description: 'The slow loop in fast/slow co-evolution is exactly the spectral-topology selection problem',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-memory-consolidation',
      description: 'Memory consolidation is the fast/slow pattern applied to memory rather than to topology',
    },
    {
      type: 'analogy',
      targetId: 'adaptive-systems-multi-timescale',
      description: 'Fast/slow co-evolution is a multi-timescale adaptive-system pattern',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.16 + 0.36),
    angle: Math.atan2(0.6, -0.4),
  },
};
