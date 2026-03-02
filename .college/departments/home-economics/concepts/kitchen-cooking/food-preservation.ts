import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const foodPreservation: RosettaConcept = {
  id: 'domestic-food-preservation',
  name: 'Food Preservation',
  domain: 'home-economics',
  description:
    'Food preservation extends the edible life of foods by inhibiting microbial growth, enzymatic ' +
    'activity, and oxidation. Freezing (below -18°C/0°F) slows all biological processes — best ' +
    'for meats, cooked foods, and blanched vegetables; quality degrades over months, not safety. ' +
    'Canning uses heat to destroy microorganisms and create a vacuum seal: water-bath canning for ' +
    'high-acid foods (pH < 4.6: tomatoes, fruits, pickles); pressure canning for low-acid foods ' +
    '(vegetables, meats, beans) to reach temperatures that kill Clostridium botulinum spores. ' +
    'Dehydration removes water that microorganisms need to grow — food dehydrators or low-temperature ' +
    'ovens work; sun drying requires consistently hot, dry conditions. Fermentation uses beneficial ' +
    'microorganisms (lactic acid bacteria) to acidify food, preventing pathogen growth: sauerkraut, ' +
    'kimchi, yogurt, kombucha. Fermented foods also develop complex flavors and probiotic properties. ' +
    'Safety is paramount: follow tested USDA or Ball canning recipes — do not modify ingredient ratios.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'domestic-cooking-skills',
      description: 'Food preservation extends cooking skills to long-term food storage and waste reduction',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-meal-planning',
      description: 'Preserved foods (frozen, canned, fermented) are key components of meal planning for seasonal and budget cooking',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
