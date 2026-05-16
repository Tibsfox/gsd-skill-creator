import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const spectralTopology: RosettaConcept = {
  id: 'agent-spectral-topology',
  name: 'Spectral Topology',
  domain: 'agent-systems',
  description:
    'A pre-dispatch diagnostic on a multi-agent communication graph: build the row-stochastic transition operator P ' +
    'from the team graph, form the successor representation M = (I − γP)⁻¹, and rank the topology on three numbers — ' +
    'ρ (spectral radius, drift), Δ (spectral gap, consensus speed), κ (condition number of M, robustness). The 2026 ' +
    'finding (Parks & Alharthi, arxiv `2605.11453`) is that rank order on (κ, Δ, ρ) predicts coordination quality ' +
    'pre-execution with rank correlations of 1.0 / 0.5 / −1.0. The pattern reframes topology choice from intuition ' +
    "(pipeline? leader-worker? mesh?) into a measurable selection problem. Operationally: every TEAM.md emits a " +
    'coordination signature, and the dispatch gate refuses configurations that fall outside per-task-class thresholds.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-coordination-surface',
      description: 'Spectral topology operates on the coordination surface; the surface is what is being analysed',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-fast-slow-coevolution',
      description: 'The slow (topology) loop in fast/slow co-evolution is exactly the spectral-topology selection',
    },
    {
      type: 'analogy',
      targetId: 'graph-spectral-analysis',
      description: 'Spectral topology is graph spectral analysis applied to multi-agent communication graphs',
    },
  ],
  complexPlanePosition: {
    real: -0.8,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.64 + 0.36),
    angle: Math.atan2(0.6, -0.8),
  },
};
