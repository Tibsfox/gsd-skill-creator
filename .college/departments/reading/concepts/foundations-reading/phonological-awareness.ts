import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const phonologicalAwareness: RosettaConcept = {
  id: 'read-phonological-awareness',
  name: 'Phonological Awareness',
  domain: 'reading',
  description: 'Phonological awareness is the ability to hear and manipulate the sound structure of language -- rhyming, segmenting words into syllables, and identifying and blending phonemes (individual sounds). It is a key predictor of reading success and is developed before and alongside phonics instruction. Phonemic awareness (the subset focusing on phonemes) is the most critical component.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-phonics-decoding', description: 'Phonological awareness is the foundation on which phonics maps sounds to letters' },
  ],
  complexPlanePosition: { real: 0.9, imaginary: 0.1, magnitude: Math.sqrt(0.81 + 0.01), angle: Math.atan2(0.1, 0.9) },
};
