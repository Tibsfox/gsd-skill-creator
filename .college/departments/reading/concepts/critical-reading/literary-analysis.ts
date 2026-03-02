import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const literaryAnalysis: RosettaConcept = {
  id: 'read-literary-analysis',
  name: 'Literary Analysis',
  domain: 'reading',
  description: 'Literary analysis examines how authors use craft elements to create meaning. Key elements: character development (how characters grow and change), plot structure (exposition, rising action, climax, falling action, resolution), theme (the underlying message about life), symbolism (objects/events representing larger ideas), and narrative perspective (first, second, third person). Analysis goes beyond plot summary to interpretation.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-inferencing', description: 'Literary analysis requires reading between the lines -- inferencing meaning from craft choices' },
    { type: 'dependency', targetId: 'read-figurative-language', description: 'Figurative language is a primary craft element analyzed in literary texts' },
  ],
  complexPlanePosition: { real: 0.4, imaginary: 0.75, magnitude: Math.sqrt(0.16 + 0.5625), angle: Math.atan2(0.75, 0.4) },
};
