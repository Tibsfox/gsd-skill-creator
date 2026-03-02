import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const bodyLanguage: RosettaConcept = {
  id: 'comm-body-language', name: 'Body Language', domain: 'communication',
  description: 'Body language encompasses posture, gesture, and movement as communication signals. Open posture (uncrossed arms, leaning forward) signals engagement; closed posture signals discomfort. Gestures emphasize words and reveal emotional states. Movement (pacing, approaching, moving toward audience) creates energy and emphasis in presentations.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-eye-contact-expression', description: 'Body language and facial expression work together to form the full nonverbal signal' }],
  complexPlanePosition: { real: 0.8, imaginary: 0.2, magnitude: Math.sqrt(0.64 + 0.04), angle: Math.atan2(0.2, 0.8) },
};
