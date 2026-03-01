import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const macronutrientRoles: RosettaConcept = {
  id: 'cook-macronutrient-roles',
  name: 'Macronutrient Roles',
  domain: 'culinary-arts',
  description: 'The three macronutrients provide energy and serve distinct biological functions. ' +
    'Protein (4 cal/g) supports muscle repair, enzyme function, and immune response -- complete ' +
    'proteins contain all essential amino acids (meat, eggs, soy). Carbohydrates (4 cal/g) are ' +
    'the primary energy source -- simple carbs provide quick energy while complex carbs and fiber ' +
    'support sustained energy and digestion. Fat (9 cal/g) provides concentrated energy storage, ' +
    'cell membrane structure, hormone production, and acts as a flavor carrier that dissolves ' +
    'aromatic compounds. Balancing macronutrients across meals supports stable energy and satiety.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-micronutrient-bioavailability',
      description: 'Macronutrient composition affects micronutrient absorption -- dietary fat is required for fat-soluble vitamin uptake',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: -0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(-0.2, 0.6),
  },
};
