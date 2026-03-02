import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const interculturalCommunication: RosettaConcept = {
  id: 'comm-intercultural-communication', name: 'Intercultural Communication', domain: 'communication',
  description: 'Intercultural communication recognizes that communication norms (directness, interruption tolerance, eye contact, silence) vary significantly across cultures. High-context cultures rely on implicit understanding; low-context cultures prefer explicit communication. Intercultural competence involves awareness of one\'s own cultural assumptions and curiosity about different norms.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-proxemics', description: 'Proxemics norms vary across cultures and are a common source of intercultural misunderstanding' }],
  complexPlanePosition: { real: 0.5, imaginary: 0.65, magnitude: Math.sqrt(0.25 + 0.4225), angle: Math.atan2(0.65, 0.5) },
};
