import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const hypothesisTesting: RosettaConcept = {
  id: 'stat-hypothesis-testing',
  name: 'Hypothesis Testing',
  domain: 'statistics',
  description:
    'Hypothesis testing determines whether observed data provides sufficient evidence to reject a null hypothesis. ' +
    'Steps: state H0 and H1 → collect data → calculate test statistic → determine p-value → compare to significance level α. ' +
    'The p-value is the probability of observing the data (or more extreme) if H0 is true — not the probability H0 is true. ' +
    'Type I errors (false positive) and Type II errors (false negative) represent the two ways to be wrong.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'stat-distributions',
      description: 'Test statistics are evaluated against null distributions to calculate p-values',
    },
    {
      type: 'cross-reference',
      targetId: 'sci-hypothesis-formation',
      description: 'Statistical hypothesis testing operationalizes the scientific method\'s hypothesis phase quantitatively',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, 0.5),
  },
};
