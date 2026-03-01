import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const preparationNutrition: RosettaConcept = {
  id: 'cook-preparation-nutrition',
  name: 'Preparation-Nutrition Effects',
  domain: 'culinary-arts',
  description: 'How cooking methods affect nutrient content in food. Vitamin C degrades rapidly ' +
    'above 70C (158F) -- raw or quick-cooked preparations preserve more ascorbic acid. Water-' +
    'soluble vitamins (B complex, C) leach into cooking liquid during boiling and simmering -- ' +
    'using the cooking liquid (as in soups and stews) recaptures lost nutrients. Lycopene ' +
    'bioavailability in tomatoes actually increases with cooking because heat breaks down cell ' +
    'walls. Blanching (quick boil then ice bath) preserves color, texture, and most nutrients ' +
    'by inactivating degradation enzymes. Steaming retains more nutrients than boiling because ' +
    'food has less contact with water.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'cook-dry-heat-methods',
      description: 'Dry heat methods cause different nutrient changes than wet heat -- higher temperatures degrade more vitamins',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-wet-heat-methods',
      description: 'Wet heat methods leach water-soluble vitamins into cooking liquid',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, 0.5),
  },
};
