import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const healthIntegration: RosettaConcept = {
  id: 'nutr-health-integration',
  name: 'Integrating Nutrition with Health Behaviors',
  domain: 'nutrition',
  description: 'Nutrition does not operate in isolation -- sleep, exercise, stress, and social connection all interact with nutritional status. ' +
    'Sleep and appetite: sleep deprivation elevates ghrelin (hunger hormone) and reduces leptin (satiety hormone) -- making overeating more likely. ' +
    'Exercise and nutrition: exercise increases caloric needs, enhances insulin sensitivity, and improves nutrient partitioning (nutrients go to muscle, not fat). ' +
    'Stress and eating: cortisol drives cravings for calorie-dense, palatable foods -- a biological mechanism, not willpower failure. ' +
    'Social eating: the social context of meals affects intake -- people eat more in groups (social facilitation) and less when stressed socially. ' +
    'Mindful eating: attending to hunger, satiety, and food enjoyment cues -- associated with less overeating without restriction. ' +
    'Food environment: the most important determinant of eating behavior is what food is available and visible -- environment trumps willpower. ' +
    'Behavioral change: knowledge is necessary but insufficient -- habit formation, environmental design, and implementation intentions drive actual dietary behavior. ' +
    'Health equity: access to nutritious food is not equally distributed -- food deserts, food costs, and time poverty all constrain dietary choices.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'nutr-diet-patterns',
      description: 'Dietary pattern evidence provides the nutritional foundation; health integration shows how lifestyle factors modify that evidence',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-stress-coping',
      description: 'Stress physiology directly affects eating behavior -- the cortisol-driven cravings for comfort food are a key stress-nutrition interaction',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
