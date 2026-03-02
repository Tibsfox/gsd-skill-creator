import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const nutritionForFitness: RosettaConcept = {
  id: 'pe-nutrition-for-fitness',
  name: 'Nutrition for Fitness',
  domain: 'physical-education',
  description:
    'Exercise nutrition aligns food intake with training demands to support performance, ' +
    'adaptation, and recovery. Pre-exercise fueling (1-3 hours before): carbohydrates provide ' +
    'glycogen for working muscles; moderate protein; low fat and fiber to minimize GI distress. ' +
    'During extended exercise (over 60 min): 30-60 g carbohydrate/hour via sports drinks, gels, ' +
    'or real food maintains blood glucose. Post-exercise recovery window (within 30-60 min): ' +
    'carbohydrates replenish glycogen; protein (20-40 g) initiates muscle protein synthesis. ' +
    'Hydration: sweat rates vary 0.5-2.5 L/hr depending on intensity and environment; thirst is ' +
    'a late signal — monitor urine color (pale yellow = adequate). Energy availability is the ' +
    'fundamental concern: relative energy deficiency in sport (RED-S) impairs bone health, ' +
    'hormonal function, and immunity. The principle of food-first (vs. supplements) is foundational ' +
    'for youth athletes; supplements are rarely necessary with adequate diet.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-injury-prevention',
      description: 'Adequate nutrition supports tissue repair, immune function, and injury prevention',
    },
    {
      type: 'cross-reference',
      targetId: 'nutr-meal-planning',
      description: 'Fitness nutrition applies general nutrition planning principles to athletic performance contexts',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
