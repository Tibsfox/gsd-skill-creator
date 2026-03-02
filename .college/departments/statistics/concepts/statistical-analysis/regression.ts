import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const regression: RosettaConcept = {
  id: 'stat-regression',
  name: 'Regression Analysis',
  domain: 'statistics',
  description:
    'Regression models the relationship between a dependent variable (outcome) and one or more independent ' +
    'variables (predictors). Linear regression fits a line minimizing squared residuals. ' +
    'R² measures how much variance in the outcome the model explains. ' +
    'Regression is the workhorse of empirical research across economics, medicine, social science, and machine learning. ' +
    'Critical caveat: regression shows correlation, not causation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-descriptive-stats',
      description: 'Regression builds on descriptive statistics of the variables to model their relationship',
    },
    {
      type: 'cross-reference',
      targetId: 'math-correlation-causation',
      description: 'Regression analysis quantifies correlation; the correlation-causation distinction applies fully here',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.16 + 0.64),
    angle: Math.atan2(0.8, 0.4),
  },
};
