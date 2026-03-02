import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const micronutrients: RosettaConcept = {
  id: 'nutr-micronutrients',
  name: 'Micronutrients: Vitamins and Minerals',
  domain: 'nutrition',
  description: 'Micronutrients are vitamins and minerals required in small amounts -- essential for metabolic function and health. ' +
    'Fat-soluble vitamins: A, D, E, K -- stored in body fat; excess can be toxic. ' +
    'Water-soluble vitamins: B vitamins and C -- excreted in urine; toxicity rare; deficiency more common. ' +
    'Vitamin D: the "sunshine vitamin" -- synthesized in skin with UV exposure; deficiency widespread (1 billion people globally); critical for bone health and immune function. ' +
    'Vitamin B12: found only in animal products; deficiency common in vegans. ' +
    'Iron: most common nutrient deficiency globally (affects 2 billion). Heme iron (animal) is better absorbed than non-heme (plant). Vitamin C enhances absorption. ' +
    'Calcium: bone health, muscle contraction, nerve signaling. Absorption requires vitamin D. ' +
    'Iodine: thyroid hormone synthesis. Deficiency causes goiter and developmental impairment -- salt iodization is one of the most effective public health interventions. ' +
    'Bioavailability: not just how much is in food but how much is absorbed -- matrix effects, antinutrients (phytates, oxalates), and cooking affect absorption.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Micronutrients work alongside macronutrients -- B vitamins are cofactors in carbohydrate and fat metabolism; understanding macros gives context for micro roles',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-digestion-body-systems',
      description: 'Micronutrient absorption depends on the digestive system -- gut health and digestive enzyme function determine whether micronutrients reach circulation',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
