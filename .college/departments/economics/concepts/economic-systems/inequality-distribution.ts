import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const inequalityDistribution: RosettaConcept = {
  id: 'econ-inequality-distribution',
  name: 'Inequality and Distribution',
  domain: 'economics',
  description: 'Economic inequality concerns how income and wealth are distributed across a population. ' +
    'Gini coefficient: 0 = perfect equality, 1 = one person owns everything. The US Gini is ~0.40, Nordic countries ~0.28. ' +
    'Income vs. wealth inequality: wealth inequality is always greater than income inequality -- stock of accumulated assets concentrates faster. ' +
    'Causes of inequality: technological change (favors high-skill workers), globalization, declining union power, top marginal tax rates, winner-take-all markets. ' +
    'Lorenz curve: visual representation of cumulative income distribution -- the further from the diagonal, the more unequal. ' +
    'Mobility: is inequality of outcomes less troubling if there is high mobility? Empirically, high-inequality societies show less mobility (Great Gatsby curve). ' +
    'Poverty traps: mechanisms that keep poor households poor -- lack of credit access, poor nutrition affecting cognition, bad schools. ' +
    'Redistribution tools: progressive taxes, transfers, public education, healthcare -- empirical debate about effectiveness vs. efficiency costs.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-capitalism-market-economy',
      description: 'Inequality is a systemic outcome of market economies -- understanding capitalism explains the mechanisms of distribution',
    },
    {
      type: 'cross-reference',
      targetId: 'data-measures-of-spread',
      description: 'Gini coefficients and Lorenz curves are statistical measures of distribution -- inequality analysis is applied statistics',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
