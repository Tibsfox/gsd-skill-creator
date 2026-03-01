import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const specificHeatCapacity: RosettaConcept = {
  id: 'cook-specific-heat-capacity',
  name: 'Specific Heat Capacity',
  domain: 'culinary-arts',
  description: 'The energy required to raise the temperature of one gram of a substance by one ' +
    'degree Celsius. Water has an exceptionally high specific heat of 4.18 J/gC, which is why ' +
    'water-based foods heat slowly but retain heat well -- a pot of soup stays hot long after ' +
    'removal from heat. Cooking oil has a specific heat of approximately 2.0 J/gC, explaining ' +
    'why oil heats faster than water at the same energy input. Dense, water-rich foods (potatoes, ' +
    'squash) take longer to cook through because each gram requires more energy to raise its ' +
    'temperature. This principle also explains why steam burns are severe -- steam carries latent ' +
    'heat of vaporization (2260 J/g) in addition to thermal energy.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-heat-transfer-modes',
      description: 'Specific heat determines how efficiently each heat transfer mode raises food temperature',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.16 + 0.09),
    angle: Math.atan2(0.3, 0.4),
  },
};
