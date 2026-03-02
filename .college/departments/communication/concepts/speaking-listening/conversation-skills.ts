import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const conversationSkills: RosettaConcept = {
  id: 'comm-conversation-skills', name: 'Conversation Skills', domain: 'communication',
  description: 'Effective conversation involves turn-taking norms, topic initiation and maintenance, conversational repair when misunderstanding occurs, and graceful topic transitions. Different cultures have different norms for interruption, silence, and directness. Understanding these norms enables productive communication across diverse settings.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-active-listening', description: 'Good conversation requires active listening to respond relevantly and build on what is said' }],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};
