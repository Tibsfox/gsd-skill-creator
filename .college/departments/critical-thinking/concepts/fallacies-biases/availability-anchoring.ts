import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const availabilityAnchoring: RosettaConcept = {
  id: 'crit-availability-anchoring', name: 'Availability & Anchoring Biases', domain: 'critical-thinking',
  description: 'The availability heuristic judges probability by how easily examples come to mind -- plane crashes feel more likely than car accidents because they get more news coverage. Anchoring bias gives excessive weight to the first information encountered. Both are fast, automatic processes (System 1 thinking) that can mislead in contexts requiring careful probability assessment.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-confirmation-bias', description: 'Availability and anchoring are cognitive biases operating alongside confirmation bias' }],
  complexPlanePosition: { real: 0.55, imaginary: 0.6, magnitude: Math.sqrt(0.3025 + 0.36), angle: Math.atan2(0.6, 0.55) },
};
