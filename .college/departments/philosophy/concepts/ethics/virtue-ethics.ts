import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const virtueEthics: RosettaConcept = {
  id: 'philo-virtue-ethics',
  name: 'Virtue Ethics',
  domain: 'philosophy',
  description:
    'Virtue ethics focuses on the character of the moral agent rather than on rules (deontology) ' +
    'or outcomes (consequentialism). Aristotle\'s Nicomachean Ethics identifies eudaimonia ' +
    '(flourishing, living well) as the highest good. Virtues are stable character traits — courage, ' +
    'justice, temperance, practical wisdom (phronesis) — acquired through habituation: we become ' +
    'courageous by practicing courageous actions. Each virtue is a mean between excess and ' +
    'deficiency: courage lies between cowardice and recklessness. Phronesis (practical wisdom) is ' +
    'the master virtue enabling correct judgment about means in particular situations. Neo-Aristotelian ' +
    'revival (MacIntyre, Foot, Anscombe) critiques modern ethics for abstracting from social ' +
    'practices and narrative context. Care ethics (Noddings, Gilligan) offers a feminist virtue ' +
    'approach emphasizing relationships, empathy, and responsiveness over universal principles.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-ethical-frameworks',
      description: 'Virtue ethics is one of the three major ethical frameworks alongside deontology and consequentialism',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.1225 + 0.4225),
    angle: Math.atan2(0.65, 0.35),
  },
};
