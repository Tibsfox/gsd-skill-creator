import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const respectfulDisagreement: RosettaConcept = {
  id: 'comm-respectful-disagreement', name: 'Respectful Disagreement', domain: 'communication',
  description: 'Disagreeing productively means challenging ideas while respecting the person. Strategies: address the argument, not the arguer; acknowledge merit in the opposing view before disagreeing; use "I" statements to express your perspective; separate facts from interpretations. Modeling respectful disagreement builds a culture of intellectual safety where ideas can be examined honestly.',
  panels: new Map(),
  relationships: [{ type: 'analogy', targetId: 'crit-charitable-interpretation', description: 'Respectful disagreement and charitable interpretation both require engaging with the strongest version of others\' views' }],
  complexPlanePosition: { real: 0.55, imaginary: 0.55, magnitude: Math.sqrt(0.3025 + 0.3025), angle: Math.atan2(0.55, 0.55) },
};
