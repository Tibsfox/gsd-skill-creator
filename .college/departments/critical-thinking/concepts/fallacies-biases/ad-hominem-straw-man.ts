import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const adHominemStrawMan: RosettaConcept = {
  id: 'crit-ad-hominem-straw-man', name: 'Ad Hominem & Straw Man', domain: 'critical-thinking',
  description: 'Ad hominem attacks the person making an argument rather than the argument itself. The straw man misrepresents an opponent\'s position to make it easier to attack. Both are fallacies because they divert attention from the actual argument. Identifying these fallacies protects against being persuaded by rhetorical attacks rather than evidence and logic.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-argument-structure', description: 'These fallacies attack the arguer or a distorted version of the argument instead of the real argument structure' }],
  complexPlanePosition: { real: 0.75, imaginary: 0.25, magnitude: Math.sqrt(0.5625 + 0.0625), angle: Math.atan2(0.25, 0.75) },
};
