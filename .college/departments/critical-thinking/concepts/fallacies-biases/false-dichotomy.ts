import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const falseDichotomy: RosettaConcept = {
  id: 'crit-false-dichotomy', name: 'False Dichotomy', domain: 'critical-thinking',
  description: 'A false dichotomy (false dilemma) presents only two options as if they were exhaustive when more exist. "You\'re either with us or against us" ignores neutral and intermediate positions. Recognizing false dichotomies opens space for nuanced solutions. Related fallacies: the excluded middle (assuming no middle ground), slippery slope (assuming extreme consequences from moderate actions).',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-ad-hominem-straw-man', description: 'False dichotomies, like straw men, misrepresent the available positions in a debate' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.35, magnitude: Math.sqrt(0.49 + 0.1225), angle: Math.atan2(0.35, 0.7) },
};
