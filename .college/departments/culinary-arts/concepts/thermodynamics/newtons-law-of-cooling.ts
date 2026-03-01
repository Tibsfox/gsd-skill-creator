import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const newtonsCooling: RosettaConcept = {
  id: 'cook-newtons-cooling',
  name: 'Newton\'s Law of Cooling',
  domain: 'culinary-arts',
  description: 'Newton\'s law of cooling models temperature change over time: T(t) = T_ambient + ' +
    '(T_initial - T_ambient) * e^(-kt), where k is the cooling constant determined by surface ' +
    'area, mass, and medium (air vs water vs ice bath). In cooking, this applies to meat resting ' +
    '(carryover cooking adds 5-10F as the surface heat conducts inward), food cooling for safety ' +
    '(predicting time to reach the 40-140F danger zone), and beverage chilling (ice bath cools ' +
    'faster than refrigerator because water has higher thermal conductivity than air). The ' +
    'exponential decay means cooling is fastest initially and slows as food approaches ambient ' +
    'temperature -- the last few degrees take disproportionately long.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-exponential-decay',
      description: 'Newton\'s cooling law is a direct application of the exponential decay function from mathematics',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-temperature-danger-zone',
      description: 'Cooling rate determines how long food remains in the temperature danger zone',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.09 + 0.36),
    angle: Math.atan2(0.6, 0.3),
  },
};
