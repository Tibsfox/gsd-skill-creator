import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dietPatterns: RosettaConcept = {
  id: 'nutr-diet-patterns',
  name: 'Dietary Patterns and Evidence',
  domain: 'nutrition',
  description: 'No single food or nutrient determines health -- dietary patterns are more predictive than individual components. ' +
    'Mediterranean diet: high in vegetables, legumes, whole grains, fish, olive oil, moderate wine. Most consistently evidence-based for cardiovascular health and longevity. ' +
    'DASH diet (Dietary Approaches to Stop Hypertension): developed to lower blood pressure -- low sodium, high vegetables, fruits, and low-fat dairy. ' +
    'Plant-based diets: associated with lower rates of obesity, type 2 diabetes, cardiovascular disease, and some cancers. Vegetarian ≠ automatically healthy. ' +
    'Low-carbohydrate diets: effective for short-term weight loss and blood glucose control. Long-term outcomes similar to other patterns when protein is adequate. ' +
    'Intermittent fasting: time-restricted eating or alternating fasting days. Evidence suggests metabolic benefits beyond calorie restriction, though mechanisms debated. ' +
    'Dietary guidelines: government recommendations -- subject to political influence and lag behind science. ' +
    'Personalized nutrition: glycemic response to identical foods varies enormously between individuals (Weizmann Institute study). One-size-fits-all guidance may be outdated. ' +
    'Consistency over optimization: any reasonable dietary pattern followed consistently outperforms the perfect diet followed intermittently.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Dietary patterns are built from specific macronutrient and micronutrient compositions -- understanding what\'s in food grounds pattern analysis',
    },
    {
      type: 'cross-reference',
      targetId: 'data-hypothesis-testing',
      description: 'Diet-health research uses hypothesis testing -- understanding p-values and effect sizes helps interpret nutrition study findings',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
