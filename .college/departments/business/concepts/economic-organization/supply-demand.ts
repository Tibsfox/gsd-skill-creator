import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const supplyDemand: RosettaConcept = {
  id: 'bus-supply-demand',
  name: 'Supply & Demand',
  domain: 'business',
  description:
    'Supply and demand is the foundational model of market economics. ' +
    'Demand: as price rises, quantity demanded falls (law of demand). ' +
    'Supply: as price rises, quantity supplied rises (law of supply). ' +
    'Market equilibrium: where supply equals demand, determining price and quantity. ' +
    'Shifts in curves (not movements along them) occur when non-price factors change: income, preferences, input costs, technology.',
  panels: new Map(),
  relationships: [],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.7225 + 0.0225),
    angle: Math.atan2(0.15, 0.85),
  },
};
