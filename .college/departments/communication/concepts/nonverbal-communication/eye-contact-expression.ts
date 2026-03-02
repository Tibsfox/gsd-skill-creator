import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const eyeContactExpression: RosettaConcept = {
  id: 'comm-eye-contact-expression', name: 'Eye Contact & Facial Expression', domain: 'communication',
  description: 'The face is the most expressive part of the human body. Facial expressions of basic emotions (happiness, sadness, fear, anger, surprise, disgust) are recognized across cultures. Eye contact signals attention and confidence but norms vary culturally. In presentations, eye contact with different sections of the audience creates personal connection.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-body-language', description: 'Eye contact and expression are part of the full body language system' }],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};
