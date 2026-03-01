import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const wetHeatMethods: RosettaConcept = {
  id: 'cook-wet-heat-methods',
  name: 'Wet Heat Methods',
  domain: 'culinary-arts',
  description: 'Cooking methods that use water or liquid as the heat transfer medium, capped at ' +
    '100C (212F) at sea level. Poaching (71-82C / 160-180F): gentle heat for delicate proteins ' +
    'like eggs and fish, with barely visible movement in the liquid. Simmering (85-96C / 185-205F): ' +
    'steady small bubbles, ideal for stocks, sauces, and slow-cooked stews. Boiling (100C / 212F): ' +
    'vigorous rolling bubbles for pasta, blanching vegetables, and reducing liquids. Steaming uses ' +
    'indirect contact via water vapor, preserving more nutrients and texture than direct immersion. ' +
    'Wet heat methods cannot produce Maillard browning because water limits temperature to 100C, ' +
    'but they excel at gentle, even cooking of proteins.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-specific-heat-capacity',
      description: 'Water\'s high specific heat (4.18 J/gC) makes it an effective and stable cooking medium',
    },
    {
      type: 'dependency',
      targetId: 'cook-protein-denaturation',
      description: 'Wet heat methods allow precise temperature control for controlled protein denaturation',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: -0.2,
    magnitude: Math.sqrt(0.81 + 0.04),
    angle: Math.atan2(-0.2, 0.9),
  },
};
