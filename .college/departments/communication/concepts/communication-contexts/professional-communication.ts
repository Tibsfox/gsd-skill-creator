import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const professionalCommunication: RosettaConcept = {
  id: 'comm-professional-communication', name: 'Professional Communication', domain: 'communication',
  description: 'Professional communication encompasses job interviews, workplace meetings, networking, performance reviews, and managing up/down the hierarchy. Key skills: preparing STAR stories for interviews, running effective meetings (agenda, facilitation, follow-up), and navigating difficult conversations with a problem-focused rather than blame-focused approach.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-register-formality', description: 'Professional contexts require formal register calibrated to the specific workplace culture' }],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
