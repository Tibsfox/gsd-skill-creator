import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const supplyDemand: RosettaConcept = {
  id: 'econ-supply-demand',
  name: 'Supply and Demand',
  domain: 'economics',
  description: 'Supply and demand is the core model of how markets coordinate decisions of buyers and sellers. ' +
    'Demand curve: downward-sloping -- as price rises, quantity demanded falls (law of demand). ' +
    'Supply curve: upward-sloping -- as price rises, quantity supplied increases (law of supply). ' +
    'Market equilibrium: the price at which quantity supplied equals quantity demanded -- markets tend toward this. ' +
    'Shifts vs. movements: a price change causes movement ALONG a curve. A change in anything else (income, input costs, preferences) SHIFTS the curve. ' +
    'Demand shifters: income, prices of related goods, tastes, expectations, number of buyers. ' +
    'Supply shifters: input costs, technology, expectations, number of sellers. ' +
    'Price ceilings (rent control) and floors (minimum wage): prevent the market from reaching equilibrium, creating surpluses or shortages. ' +
    'Price as information: prices signal where resources are most valued -- a rising price tells producers to make more and consumers to use less.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'econ-marginal-thinking',
      description: 'Supply and demand curves are derived from marginal cost (supply) and marginal utility (demand)',
    },
    {
      type: 'cross-reference',
      targetId: 'data-distributions',
      description: 'Supply and demand create price distributions -- understanding the statistical properties of prices requires both economics and data analysis',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.4225 + 0.25),
    angle: Math.atan2(0.5, 0.65),
  },
};
