import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const phonicsDecoding: RosettaConcept = {
  id: 'read-phonics-decoding',
  name: 'Phonics & Decoding',
  domain: 'reading',
  description: 'Phonics instruction teaches the systematic relationships between letters and the sounds they represent. Decoding is the skill of using these letter-sound relationships to read unfamiliar words. Explicit, systematic phonics instruction is one of the most well-supported interventions in reading education. Encoding (spelling) is the reciprocal skill.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-phonological-awareness', description: 'Phonics maps sounds (from phonological awareness) to their letter representations' },
    { type: 'dependency', targetId: 'read-reading-fluency', description: 'Automatic decoding through phonics enables fluent reading' },
  ],
  complexPlanePosition: { real: 0.85, imaginary: 0.15, magnitude: Math.sqrt(0.7225 + 0.0225), angle: Math.atan2(0.15, 0.85) },
};
