import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const correlation: RosettaConcept = {
  id: 'data-correlation',
  name: 'Correlation & the Causation Distinction',
  domain: 'data-science',
  description: 'Correlation measures the strength and direction of a linear relationship between two variables. ' +
    'Pearson r: ranges from -1 (perfect negative) to +1 (perfect positive), 0 means no linear relationship. ' +
    'r=0.7 is strong, r=0.3 is weak, r=-0.9 is strong and negative. ' +
    'Scatter plots visualize correlation -- always look at the plot, not just the number. ' +
    'CRITICAL: correlation does not imply causation. ' +
    'Ice cream sales and drowning deaths correlate (both driven by hot weather -- a confound). ' +
    'Shoe size correlates with reading ability in children (both driven by age). ' +
    'Spurious correlations: Nicholas Cage films correlate with pool drownings (r=0.66). ' +
    'Causation requires: correlation, temporal precedence, and elimination of confounds.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-distributions',
      description: 'Correlation is meaningful only when both variables are roughly normally distributed',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-evaluating-claims',
      description: 'Nutritional epidemiology is plagued by correlation-causation confusion -- the skill directly applies',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
