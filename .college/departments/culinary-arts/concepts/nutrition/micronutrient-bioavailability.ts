import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const micronutrientBioavailability: RosettaConcept = {
  id: 'cook-micronutrient-bioavailability',
  name: 'Micronutrient Bioavailability',
  domain: 'culinary-arts',
  description: 'How cooking affects vitamin and mineral availability for absorption. Fat-soluble ' +
    'vitamins (A, D, E, K) require dietary fat for absorption -- cooking carrots in olive oil ' +
    'dramatically increases beta-carotene uptake. Iron bioavailability increases when paired with ' +
    'vitamin C (lemon juice on spinach). Non-heme iron (plant sources) is less bioavailable than ' +
    'heme iron (animal sources). Phytates in whole grains and legumes bind minerals and reduce ' +
    'absorption -- soaking, sprouting, and fermenting break down phytates and improve mineral ' +
    'availability. Cooking can both increase bioavailability (breaking cell walls) and decrease ' +
    'it (degrading heat-sensitive vitamins).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-fermentation',
      description: 'Fermentation breaks down phytates in grains, improving mineral bioavailability',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.16 + 0.09),
    angle: Math.atan2(0.3, 0.4),
  },
};
