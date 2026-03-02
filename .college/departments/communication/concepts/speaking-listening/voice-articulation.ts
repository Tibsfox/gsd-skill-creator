import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const voiceArticulation: RosettaConcept = {
  id: 'comm-voice-articulation', name: 'Voice & Articulation', domain: 'communication',
  description: 'Effective spoken communication depends on appropriate volume (loud enough to be heard), pace (slow enough to be understood), clarity (precise articulation of words), and tone (matching emotional register to context). These qualities can all be developed through practice. Variation in pace and volume creates emphasis and maintains listener engagement.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-vocal-paralanguage', description: 'Voice and articulation are the mechanical aspects of the paralanguage that carries tone and meaning' }],
  complexPlanePosition: { real: 0.8, imaginary: 0.2, magnitude: Math.sqrt(0.64 + 0.04), angle: Math.atan2(0.2, 0.8) },
};
