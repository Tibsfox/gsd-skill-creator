import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const authorPurposePerspective: RosettaConcept = {
  id: 'read-author-purpose-perspective',
  name: 'Author Purpose & Perspective',
  domain: 'reading',
  description: 'Authors write to inform, persuade, entertain, or explain. Their perspective (point of view, background, beliefs) shapes word choice, evidence selection, and framing. Identifying purpose and perspective enables readers to evaluate texts critically rather than accepting them at face value. Comparing two texts on the same topic from different perspectives reveals how purpose shapes content.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-argument-analysis', description: 'Recognizing persuasive purpose directs analysis toward claims, evidence, and rhetorical techniques' },
  ],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
