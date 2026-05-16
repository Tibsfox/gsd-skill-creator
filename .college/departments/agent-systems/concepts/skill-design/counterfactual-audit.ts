import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const counterfactualAudit: RosettaConcept = {
  id: 'agent-counterfactual-audit',
  name: 'Counterfactual Audit',
  domain: 'agent-systems',
  description:
    'The abstract idea that a skill is ultimately defined by the difference between its presence and its absence. The ' +
    '2026 finding (CTA, arxiv `2605.11946v1`) makes this measurable: pair-trace the same probe with and without the ' +
    'skill, then compute the behavioural delta — surface anchoring, template copy, excess planning, task recovery, ' +
    "off-task artifact. The headline result is that pass-rate is BLIND to most skill effects: a single skill produces " +
    '522 measurable behavioural changes across 49 tasks while pass-rate moves only +0.3%. Counterfactual audit is ' +
    "therefore the operative definition of skill quality; pass-rate is sufficient for shipping but insufficient for " +
    'understanding. The concrete instantiation is `agent-paired-trace-audit`.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-paired-trace-audit',
      description: 'Paired-trace audit is the concrete operational form of this abstract concept',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-counterfactual-utility',
      description: 'Counterfactual utility extends counterfactual audit from current behaviour to expected impact',
    },
    {
      type: 'analogy',
      targetId: 'ct-counterfactual-reasoning',
      description: 'Counterfactual audit is counterfactual reasoning applied to skill effects',
    },
  ],
  complexPlanePosition: {
    real: -0.7,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.49 + 0.25),
    angle: Math.atan2(0.5, -0.7),
  },
};
