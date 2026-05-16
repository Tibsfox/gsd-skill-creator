import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const constraintDecay: RosettaConcept = {
  id: 'agent-constraint-decay',
  name: 'Constraint Decay',
  domain: 'agent-systems',
  description:
    'Monotonic accuracy decline as the count of non-functional constraints in a task grows, even when the functional ' +
    'specification is held fixed. The 2026 finding (Dente et al., arxiv `2605.06445v1`) measures ~30pp accuracy loss ' +
    'attributable to non-functional constraint count alone — style, performance, security, naming, formatting. The ' +
    "failure mode is not that the model 'forgets' constraints; it's that the constraints compete for the same " +
    "attention/output budget, and the marginal constraint displaces existing ones. The mitigation is structured-spec " +
    'gating (the upstream check) plus execution-grounded selection (the downstream check): structure the constraints ' +
    'so they can be verified independently, and select candidates by execution rather than by textual fit. Distinct ' +
    'from `agent-constraint-drift`: decay happens within a single task as constraint count grows; drift happens across ' +
    'tasks as constraints propagate through delegation.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-constraint-drift',
      description: 'Decay (within-task) and drift (across-task) are the two failure modes for non-functional constraints',
    },
    {
      type: 'dependency',
      targetId: 'agent-structured-spec-gate',
      description: 'The structured-spec gate is the upstream mitigation for constraint decay',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-execution-grounded-selection',
      description: 'Execution-grounded selection is the downstream mitigation; verify by running, not by reading',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.16 + 0.16),
    angle: Math.atan2(0.4, 0.4),
  },
};
