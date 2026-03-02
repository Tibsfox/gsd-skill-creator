import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const waterHydration: RosettaConcept = {
  id: 'nutr-water-hydration',
  name: 'Water and Hydration',
  domain: 'nutrition',
  description: 'Water is the most essential nutrient -- survival without it is measured in days, not weeks or months. ' +
    'Body water: ~60% of body weight is water (varies with age, sex, and fat mass). ' +
    'Functions of water: nutrient transport, temperature regulation (sweating), waste excretion, joint lubrication, metabolic reactions. ' +
    'Hydration status: urine color is the simplest indicator -- pale yellow is well-hydrated; dark yellow/amber indicates dehydration. ' +
    'Daily needs: approximately 2-3 liters per day (varies with body size, activity, climate). Most comes from beverages; ~20% from food. ' +
    'Electrolytes: sodium, potassium, magnesium, calcium dissolved in water regulate fluid balance and nerve/muscle function. ' +
    'Hyponatremia: dangerously low sodium from overhydration -- a risk in endurance athletes who drink too much plain water. ' +
    'Thirst as a late signal: by the time you feel thirsty, you are already mildly dehydrated -- preemptive drinking is better during exercise. ' +
    'Beverages: coffee, tea, and alcohol all count toward fluid intake, though alcohol is mildly diuretic.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Water enables macronutrient metabolism -- metabolic reactions occur in aqueous solution; nutrients are transported in blood (mostly water)',
    },
    {
      type: 'cross-reference',
      targetId: 'envr-water-cycle',
      description: 'Individual hydration connects to the planetary water cycle -- the same water molecules cycling through the hydrosphere end up in our bodies',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
