import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const wordLearningStrategies: RosettaConcept = {
  id: 'read-word-learning-strategies',
  name: 'Word Learning Strategies',
  domain: 'reading',
  description: 'Context clues, morphological analysis (roots, prefixes, suffixes), and dictionary use are the three pillars of independent word learning. Context clues involve using surrounding text to infer meaning. Morphological analysis is especially powerful -- knowing that "bio" means life and "logy" means study instantly unlocks dozens of vocabulary words. Dictionary use provides precise definitions when inference is insufficient.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-morphology', description: 'Morphological analysis is the most productive single word-learning strategy' },
  ],
  complexPlanePosition: { real: 0.75, imaginary: 0.3, magnitude: Math.sqrt(0.5625 + 0.09), angle: Math.atan2(0.3, 0.75) },
};
