import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const proxemics: RosettaConcept = {
  id: 'comm-proxemics', name: 'Proxemics & Personal Space', domain: 'communication',
  description: 'Proxemics is the study of spatial distance in human interaction. Edward Hall identified four zones: intimate (0-18 inches), personal (18 inches-4 feet), social (4-12 feet), and public (12+ feet). Cultural norms vary significantly. Violating expected proximity creates discomfort; understanding it enables appropriate spatial behavior in professional and social contexts.',
  panels: new Map(),
  relationships: [{ type: 'analogy', targetId: 'comm-intercultural-communication', description: 'Proxemics norms vary across cultures and are a key source of cross-cultural miscommunication' }],
  complexPlanePosition: { real: 0.65, imaginary: 0.45, magnitude: Math.sqrt(0.4225 + 0.2025), angle: Math.atan2(0.45, 0.65) },
};
