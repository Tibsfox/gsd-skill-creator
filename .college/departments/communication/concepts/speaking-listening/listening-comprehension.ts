import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const listeningComprehension: RosettaConcept = {
  id: 'comm-listening-comprehension', name: 'Listening Comprehension', domain: 'communication',
  description: 'Listening comprehension is the ability to understand, retain, and analyze information received orally. It requires attending to main ideas, supporting details, and speaker purpose. Note-taking strategies (Cornell method, concept mapping) help listeners capture key information during lectures and presentations. Strong listening comprehension predicts academic success.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-active-listening', description: 'Active listening provides the attentional foundation for comprehending spoken content' }, { type: 'cross-reference', targetId: 'read-main-idea-details', description: 'Identifying main ideas and details applies to listening as it does to reading' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};
