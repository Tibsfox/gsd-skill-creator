import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ethicalFrameworks: RosettaConcept = {
  id: 'philo-ethics',
  name: 'Ethical Frameworks',
  domain: 'philosophy',
  description:
    'Ethics studies what makes actions right or wrong, what virtues to cultivate, and ' +
    'what makes a good life. Major frameworks offer different answers: ' +
    'Consequentialism (Bentham, Mill): rightness is determined by outcomes -- ' +
    'the greatest good for the greatest number (utilitarianism). ' +
    'Deontology (Kant): rightness is determined by adherence to duty and universal principles -- ' +
    'treat persons as ends in themselves, never merely as means; act only on maxims you ' +
    'could will to be universal laws. ' +
    'Virtue ethics (Aristotle): focus on character rather than rules or outcomes -- ' +
    'what would a virtuous person do? Cultivate virtues (courage, justice, temperance, wisdom). ' +
    'Care ethics (Gilligan, Noddings): moral decisions should center relationships and context ' +
    'rather than abstract principles. ' +
    'No single framework is complete; using multiple lenses illuminates different aspects of moral problems.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'crit-ethical-reasoning',
      description: 'Ethical frameworks provide the theoretical basis for applied ethical reasoning',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
