import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const figurativeLanguage: RosettaConcept = {
  id: 'read-figurative-language',
  name: 'Figurative Language',
  domain: 'reading',
  description: 'Figurative language conveys meaning beyond the literal. Key types: simile (comparison using like/as), metaphor (direct comparison), idiom (culturally specific phrase with non-literal meaning), hyperbole (extreme exaggeration), and personification (giving human qualities to non-humans). Recognizing figurative language prevents misinterpretation and enables literary appreciation.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-word-learning-strategies', description: 'Context clues help interpret figurative language by considering surrounding meaning' },
    { type: 'analogy', targetId: 'read-literary-analysis', description: 'Figurative language is a primary tool authors use in literary texts to create meaning and effect' },
  ],
  complexPlanePosition: { real: 0.5, imaginary: 0.6, magnitude: Math.sqrt(0.25 + 0.36), angle: Math.atan2(0.6, 0.5) },
};
