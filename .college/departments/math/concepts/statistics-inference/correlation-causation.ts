import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const correlationCausation: RosettaConcept = {
  id: 'math-correlation-causation',
  name: 'Correlation vs. Causation',
  domain: 'math',
  description:
    'Correlation measures the strength and direction of a linear relationship between two variables. ' +
    'It does not imply causation -- two variables may be correlated due to a common cause, coincidence, ' +
    'or reverse causation. Establishing causation requires controlled experiments. ' +
    'Statistical modeling (regression) uses correlation to make predictions while acknowledging this limitation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'math-descriptive-statistics',
      description: 'Correlation is a descriptive statistic for bivariate data',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-claims-facts-opinions',
      description: 'Misinterpreting correlation as causation is a common reasoning error in everyday claims',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
