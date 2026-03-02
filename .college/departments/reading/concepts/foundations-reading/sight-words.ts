import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const sightWords: RosettaConcept = {
  id: 'read-sight-words',
  name: 'Sight Words & Orthographic Mapping',
  domain: 'reading',
  description: 'Sight words are high-frequency words recognized instantly from memory, bypassing decoding. Through orthographic mapping (connecting letter patterns to sounds to meanings in memory), all fluent readers develop a large sight word vocabulary. Practice with decodable texts builds automatic word recognition, freeing attention for comprehension.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-phonics-decoding', description: 'Phonics knowledge enables orthographic mapping that turns decoded words into sight words' },
    { type: 'dependency', targetId: 'read-reading-fluency', description: 'A large sight word vocabulary is essential for achieving reading fluency' },
  ],
  complexPlanePosition: { real: 0.8, imaginary: 0.2, magnitude: Math.sqrt(0.64 + 0.04), angle: Math.atan2(0.2, 0.8) },
};
