import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const recommendationSystems: RosettaConcept = {
  id: 'diglit-recommendation-systems',
  name: 'Recommendation Systems & Personalization',
  domain: 'digital-literacy',
  description: 'Algorithms that predict what content, products, or people you will engage with. ' +
    'Collaborative filtering: "users like you also liked X." ' +
    'Content-based filtering: items similar to what you previously liked. ' +
    'Optimization target: engagement (clicks, watch time, shares) -- not satisfaction, truth, or wellbeing. ' +
    'Filter bubble: personalization creates information bubbles where you mainly see what confirms existing views. ' +
    'Rabbit holes: YouTube\'s algorithm may recommend increasingly extreme content ' +
    'because extreme content generates more engagement. ' +
    'The engagement-wellbeing gap: maximizing engagement can harm mental health ' +
    '(social comparison, outrage, addiction loops). ' +
    'User control: actively seek diverse sources; use search instead of feed for important information.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'diglit-data-collection',
      description: 'Recommendation systems require behavioral data -- collection enables personalization',
    },
    {
      type: 'cross-reference',
      targetId: 'code-ai-ml-fundamentals',
      description: 'Recommendation systems are machine learning applications -- the same ML concepts apply',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
