import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const consensusBuilding: RosettaConcept = {
  id: 'comm-consensus-building', name: 'Consensus Building', domain: 'communication',
  description: 'Consensus building seeks agreement that all participants can accept. Techniques include identifying shared values, separating positions from interests, seeking integrative solutions, and using a decision matrix for complex choices. Consensus is not unanimous agreement or compromise -- it is a solution that no participant actively opposes.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-respectful-disagreement', description: 'Consensus building requires the ability to manage disagreement respectfully toward shared solutions' }],
  complexPlanePosition: { real: 0.5, imaginary: 0.6, magnitude: Math.sqrt(0.25 + 0.36), angle: Math.atan2(0.6, 0.5) },
};
