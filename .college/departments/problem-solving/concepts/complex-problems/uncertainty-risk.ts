import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const uncertaintyRisk: RosettaConcept = {
  id: 'prob-uncertainty-risk',
  name: 'Uncertainty & Risk Management',
  domain: 'problem-solving',
  description:
    'Real-world problem solving occurs under uncertainty — unknown variables, incomplete information, ' +
    'and unpredictable futures. Risk management identifies potential failure modes, assesses their ' +
    'probability and impact, and develops mitigation strategies. Techniques include scenario planning, ' +
    'sensitivity analysis, and pre-mortem analysis (imagining the project has failed, then asking why). ' +
    'Embracing uncertainty rather than pretending it away produces more robust solutions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-systems-thinking',
      description: 'Risk assessment requires modeling how system components interact under adverse conditions',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-calibrated-confidence',
      description: 'Risk estimation requires calibrated confidence — neither over- nor under-estimating probability of failure',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.88,
    magnitude: Math.sqrt(0.09 + 0.7744),
    angle: Math.atan2(0.88, 0.3),
  },
};
