import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const burdenOfProof: RosettaConcept = {
  id: 'crit-burden-of-proof', name: 'Burden of Proof', domain: 'critical-thinking',
  description: 'The burden of proof rests on the person making a claim, not on others to disprove it. "Absence of evidence is not evidence of absence" -- but the more extraordinary the claim, the more compelling the evidence required (Sagan standard). Shifting the burden of proof ("prove I\'m wrong") is a common rhetorical tactic. Understanding burden of proof prevents accepting unsupported claims by default.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-claims-facts-opinions', description: 'Burden of proof applies once claims have been identified and categorized' }],
  complexPlanePosition: { real: 0.55, imaginary: 0.6, magnitude: Math.sqrt(0.3025 + 0.36), angle: Math.atan2(0.6, 0.55) },
};
