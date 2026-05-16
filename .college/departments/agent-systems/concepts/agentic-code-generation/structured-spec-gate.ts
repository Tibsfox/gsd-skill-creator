import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const structuredSpecGate: RosettaConcept = {
  id: 'agent-structured-spec-gate',
  name: 'Structured-Spec Gate',
  domain: 'agent-systems',
  description:
    'Refuse to dispatch a multi-file code-generation task when the typed schema, API contract, or input/output shape is ' +
    'missing or under-specified. The 2026 framing (Dente et al., arxiv `2605.06445v1`) treats specification depth as a ' +
    'dispatchability gate, not as polish: ambiguous specs produce multi-file diffs that cannot be verified, and the ' +
    'downstream cost of catching the divergence dominates the upstream cost of asking once. The gate is the agentic-code ' +
    'instantiation of route-before-act (Theme B): before generating, route the spec through a check that returns ' +
    "ready/needs-clarification with a precise list of missing fields. Pairs with `agent-constraint-decay` (the failure " +
    'mode the gate exists to prevent).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-constraint-decay',
      description: 'The structured-spec gate exists to prevent constraint decay at dispatch time',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-intent-routing',
      description: 'The gate is intent routing applied to spec quality — ready vs needs-clarification routes',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-harness-as-substrate',
      description: 'The gate is implemented at the harness layer, not in the model',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.09 + 0.25),
    angle: Math.atan2(0.5, 0.3),
  },
};
