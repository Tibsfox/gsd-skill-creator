import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const readingFluency: RosettaConcept = {
  id: 'read-reading-fluency',
  name: 'Reading Fluency',
  domain: 'reading',
  description: 'Fluency is reading accurately, at appropriate pace, and with expression (prosody). It is the bridge between decoding and comprehension: fluent readers free their cognitive resources from word identification to focus on meaning. Fluency is developed through repeated reading, assisted reading, and extensive practice with appropriately leveled texts.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-phonics-decoding', description: 'Fluency requires automatic decoding as its foundation' },
    { type: 'dependency', targetId: 'read-main-idea-details', description: 'Fluency enables the comprehension work of identifying main ideas and making inferences' },
  ],
  complexPlanePosition: { real: 0.75, imaginary: 0.3, magnitude: Math.sqrt(0.5625 + 0.09), angle: Math.atan2(0.3, 0.75) },
};
