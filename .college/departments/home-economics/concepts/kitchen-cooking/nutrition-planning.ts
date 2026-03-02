import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const nutritionPlanning: RosettaConcept = {
  id: 'domestic-nutrition-planning',
  name: 'Nutrition Planning',
  domain: 'home-economics',
  description:
    'Nutrition planning translates nutritional science into practical weekly meal design. ' +
    'The Harvard Healthy Plate model: half plate vegetables and fruits, quarter whole grains, ' +
    'quarter protein, with healthy oils. Meal planning workflow: inventory existing food first ' +
    '(reduces waste), plan 5 dinners around a weekly theme (protein source), generate shopping list. ' +
    'Batch cooking (cooking grains and proteins in larger quantities Sunday) reduces decision fatigue. ' +
    'Budget-conscious nutrition: dry legumes cost 1/10th of meat per gram protein; ' +
    'seasonal produce costs 40-60% less than out-of-season; frozen vegetables have equal nutrition. ' +
    'Special dietary needs require understanding label reading: hidden sodium (canned goods), ' +
    'added sugars (breakfast cereals), ultra-processed food markers (5+ ingredients, ' +
    'ingredients you cannot pronounce).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'nutr-meal-planning',
      description: 'Nutrition department provides the biochemical basis for nutritional meal planning',
    },
    {
      type: 'dependency',
      targetId: 'domestic-cooking-skills',
      description: 'Nutrition planning requires the cooking skills to execute the planned meals',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, 0.4),
  },
};
