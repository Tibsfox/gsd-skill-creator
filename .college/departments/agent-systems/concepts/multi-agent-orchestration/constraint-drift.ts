import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const constraintDrift: RosettaConcept = {
  id: 'agent-constraint-drift',
  name: 'Constraint Drift',
  domain: 'agent-systems',
  description:
    'Safety and behavioural constraints declared at the top of an agent system get lost, weakened, or relaxed as they ' +
    'flow through delegation, memory, tool use, audit, and optimisation. The 2026 framing (Li et al., arxiv ' +
    '`2605.10481`) treats drift as a state-management failure, not a prompting failure: the constraint was correctly ' +
    "stated, but no mechanism maintained it as it crossed system boundaries. Drift is the dominant failure axis in " +
    'production multi-agent systems (41-87% of failures are coordination defects per Nechepurenko & Shuvalov ' +
    '`2605.03310`, and constraint drift is the largest sub-category). Mitigation: per-edge constraint propagation ' +
    "checks, periodic re-statement, and drift detectors as deterministic gates in the dispatch pipeline. The pattern " +
    'generalises beyond safety to any long-lived state: privilege boundaries, budget caps, output schemas.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'rosetta-constraint-drift',
      description: 'Anchored at the rosetta-core level as concept #8',
    },
    {
      type: 'dependency',
      targetId: 'agent-skill-privilege-boundary',
      description: 'Privilege boundary is one of the constraints that constraint-drift mitigation must preserve',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-coordination-surface',
      description: 'Constraint drift happens at the seams of the coordination surface; the surface is where to instrument',
    },
  ],
  complexPlanePosition: {
    real: -0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, -0.6),
  },
};
