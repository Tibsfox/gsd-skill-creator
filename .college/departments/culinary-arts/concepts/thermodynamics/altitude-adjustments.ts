import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const altitudeAdjustments: RosettaConcept = {
  id: 'cook-altitude-adjustments',
  name: 'Altitude Adjustments',
  domain: 'culinary-arts',
  description: 'At higher elevations, lower atmospheric pressure reduces the boiling point of ' +
    'water: approximately 203F (95C) at 5000ft versus 212F (100C) at sea level. This means ' +
    'boiled and steamed foods cook more slowly because the maximum water temperature is lower. ' +
    'Baking adjustments at altitude: increase oven temperature by +25F per 3000ft above sea ' +
    'level, increase liquid by 2-4 tablespoons per cup, decrease sugar by 1-3 tablespoons per ' +
    'cup (sugar concentrates faster), and decrease leavening by 25% (gases expand more in lower ' +
    'pressure). Deep frying also requires adjustment: lower boiling point means more moisture ' +
    'remains in food, requiring slightly higher oil temperatures.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-starch-gelatinization',
      description: 'Lower boiling temperatures at altitude affect starch gelatinization timing and completeness',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-bakers-ratios',
      description: 'Altitude requires adjusting baker percentages for sugar, liquid, and leavening',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
