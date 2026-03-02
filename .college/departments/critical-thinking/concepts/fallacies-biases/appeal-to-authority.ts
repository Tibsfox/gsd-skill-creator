import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const appealToAuthority: RosettaConcept = {
  id: 'crit-appeal-to-authority', name: 'Appeal to Authority', domain: 'critical-thinking',
  description: 'Citing expert authority is legitimate when the expert is relevant, current, and representing consensus -- not when they are out of their field, isolated, or contradicting scientific consensus. The fallacious version cites authority to avoid engaging with arguments. The valid version recognizes that we rely on expertise for most knowledge and that expert consensus tracks truth better than lay intuition in specialized domains.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-evidence-quality', description: 'Expert testimony is a type of evidence whose quality must be assessed' }],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
