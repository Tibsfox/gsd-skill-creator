import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const registerFormality: RosettaConcept = {
  id: 'comm-register-formality', name: 'Register & Formality', domain: 'communication',
  description: 'Register is the level of formality in language and communication style. Formal register uses complete sentences, academic vocabulary, and professional tone; informal register uses contractions, slang, and casual language. Code-switching between registers is a critical skill: using informal register in formal contexts undermines credibility; over-formal language in casual contexts creates distance.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-audience-adaptation', description: 'Register selection is a key dimension of audience adaptation' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};
