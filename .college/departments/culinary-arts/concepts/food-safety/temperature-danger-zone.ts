import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const temperatureDangerZone: RosettaConcept = {
  id: 'cook-temperature-danger-zone',
  name: 'Temperature Danger Zone',
  domain: 'culinary-arts',
  description: 'The temperature danger zone of 40-140F (4-60C) is where bacteria multiply most ' +
    'rapidly, doubling every 20 minutes under optimal conditions. The 2-hour rule: discard any ' +
    'perishable food left in the danger zone for 2 or more hours (1 hour if ambient temperature ' +
    'exceeds 90F/32C). Minimum safe internal temperatures are ABSOLUTE safety boundaries that no ' +
    'calibration can override: poultry (all parts) must reach 165F (74C), ground meat must reach ' +
    '160F (71C), whole cuts of beef, pork, and lamb must reach 145F (63C) with a 3-minute rest. ' +
    'Fish must reach 145F (63C). These temperatures ensure pathogen destruction including ' +
    'Salmonella, E. coli, and Listeria. Always use an instant-read thermometer -- color and ' +
    'texture are unreliable indicators of doneness.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-newtons-cooling',
      description: 'Newton\'s law of cooling predicts how long food remains in the danger zone during cooling',
    },
    {
      type: 'dependency',
      targetId: 'cook-cross-contamination',
      description: 'Temperature control and contamination prevention work together to ensure food safety',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.3,
    magnitude: Math.sqrt(0.64 + 0.09),
    angle: Math.atan2(-0.3, 0.8),
  },
};
