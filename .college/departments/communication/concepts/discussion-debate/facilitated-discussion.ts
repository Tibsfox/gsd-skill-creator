import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const facilitatedDiscussion: RosettaConcept = {
  id: 'comm-facilitated-discussion', name: 'Facilitated Discussion', domain: 'communication',
  description: 'Facilitated discussions are structured conversations guided toward learning goals. Facilitation techniques include asking open-ended questions, inviting quieter voices, paraphrasing to clarify, and managing dominant speakers. Participants learn by listening and building on each other\'s ideas rather than delivering prepared positions.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-active-listening', description: 'Effective discussion participation requires active listening to what others contribute' }],
  complexPlanePosition: { real: 0.65, imaginary: 0.45, magnitude: Math.sqrt(0.4225 + 0.2025), angle: Math.atan2(0.45, 0.65) },
};
