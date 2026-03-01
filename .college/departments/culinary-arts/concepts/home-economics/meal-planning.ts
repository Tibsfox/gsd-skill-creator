import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const mealPlanning: RosettaConcept = {
  id: 'cook-meal-planning',
  name: 'Meal Planning',
  domain: 'culinary-arts',
  description: 'Weekly meal planning assesses nutritional balance across the week (not per meal), ' +
    'reducing food waste by 25-30% and cutting impulse grocery spending. Batch cooking improves ' +
    'efficiency: cook protein in bulk on Sunday, use throughout the week in different preparations. ' +
    'Repurposing leftovers creates variety without waste: roast chicken becomes chicken soup, then ' +
    'the bones become stock. Consider prep time, cooking time, and active attention separately -- ' +
    'a slow braise needs 3 hours of time but only 15 minutes of active work. Plan around seasonal ' +
    'produce for better flavor and lower cost.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'cook-macronutrient-roles',
      description: 'Nutritional targets from macronutrient knowledge drive meal selection and balance',
    },
    {
      type: 'cross-reference',
      targetId: 'cook-budget-management',
      description: 'Meal planning enables budget adherence by reducing waste and impulse purchases',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: -0.1,
    magnitude: Math.sqrt(0.49 + 0.01),
    angle: Math.atan2(-0.1, 0.7),
  },
};
