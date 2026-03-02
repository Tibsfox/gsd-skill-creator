import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const presentationStructure: RosettaConcept = {
  id: 'comm-presentation-structure', name: 'Presentation Structure', domain: 'communication',
  description: 'Effective presentations have a clear beginning (hook, thesis, preview), middle (organized content with signposting and transitions), and end (summary, call to action, memorable close). The rule "tell them what you\'ll tell them, tell them, tell them what you told them" captures the redundancy needed for oral retention. Structure reduces speaker anxiety by providing a roadmap.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-audience-adaptation', description: 'Structure must be adapted to the audience\'s knowledge level and expectations' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};
