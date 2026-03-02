import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const activeListening: RosettaConcept = {
  id: 'comm-active-listening', name: 'Active Listening', domain: 'communication',
  description: 'Active listening is deliberate, engaged attention to a speaker that goes beyond hearing words. It involves maintaining eye contact, avoiding interruption, paraphrasing to confirm understanding, and asking clarifying questions. Active listening is a trainable skill and the foundation of effective communication, empathy, and relationship-building.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-conversation-skills', description: 'Active listening is the receptive half of effective conversation' }],
  complexPlanePosition: { real: 0.85, imaginary: 0.15, magnitude: Math.sqrt(0.7225 + 0.0225), angle: Math.atan2(0.15, 0.85) },
};
