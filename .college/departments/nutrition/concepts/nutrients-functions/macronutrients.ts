import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const macronutrients: RosettaConcept = {
  id: 'nutr-macronutrients',
  name: 'Macronutrients',
  domain: 'nutrition',
  description: 'Macronutrients are the energy-providing nutrients required in large amounts: carbohydrates, proteins, and fats. ' +
    'Carbohydrates: 4 kcal/gram. Primary fuel for the brain and muscles. Simple (sugars) vs. complex (starches, fiber). ' +
    'Proteins: 4 kcal/gram. Made of 20 amino acids (9 essential, 11 nonessential). Functions: structure (muscle, hair), enzymes, hormones, immune function. ' +
    'Fats (lipids): 9 kcal/gram. Saturated (solid at room temp, primarily animal sources), unsaturated (liquid, plant sources). Trans fats: industrially hydrogenated, harmful. ' +
    'Essential fatty acids: omega-3 (EPA, DHA, ALA) and omega-6 -- body cannot synthesize these. ' +
    'Alcohol: 7 kcal/gram -- provides calories but no nutrients. ' +
    'Caloric balance: energy in vs. energy out determines weight change. But not all calories are equivalent in satiety, thermogenesis, or metabolic effects. ' +
    'Protein quality: complete proteins contain all essential amino acids (meat, eggs, quinoa, soy). Incomplete proteins (most plants) can be complemented.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'nutr-digestion-body-systems',
      description: 'Macronutrients are broken down by the digestive system -- understanding digestion explains how nutrients are absorbed and used',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-macronutrient-roles',
      description: 'Culinary arts applies macronutrient ratios directly in recipe design -- protein, fat, and carbohydrate balance determines dish texture, satiety, and flavor',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.64 + 0.04),
    angle: Math.atan2(0.2, 0.8),
  },
};
