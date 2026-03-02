import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const readingFoodLabels: RosettaConcept = {
  id: 'nutr-reading-food-labels',
  name: 'Reading Food Labels',
  domain: 'nutrition',
  description: 'Food labels are regulated information sources -- knowing how to read them is a foundational nutritional literacy skill. ' +
    'Serving size: the first thing to check -- all values are per serving, which may be unrealistically small. ' +
    'Calories and macronutrients: listed in grams. Check ratio of calories from fat, carbs, and protein. ' +
    'Daily Value (%DV): 5% DV or less = low; 20% DV or more = high. Use for nutrients you want to limit (sodium, saturated fat) and get more of (fiber, vitamins). ' +
    'Ingredient list: listed by weight, highest first. If sugar is in the first 3 ingredients, the product is high in sugar. ' +
    'Front-of-pack claims: "natural", "low-fat", "made with real fruit" -- often misleading. Regulated claims: "low calorie" (<40 kcal/serving), "good source of fiber" (10-19%DV). ' +
    'Sugar names: sucrose, glucose, fructose, corn syrup, maltose, dextrose -- added sugar appears under many names. ' +
    'Fiber: dietary fiber (not digestible, feeds gut bacteria) vs. functional fiber (added isolated fibers -- effects vary). ' +
    'Nutrition facts panel vs. supplement facts: different regulatory frameworks -- supplements have weaker evidence requirements.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-macronutrients',
      description: 'Reading labels requires knowing what macronutrients are and why they matter -- the label is a map of a food\'s nutrient composition',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-source-credibility',
      description: 'Evaluating health claims on food packaging requires the same source credibility skills as evaluating any information -- marketing vs. evidence',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
