import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const appliedEthics: RosettaConcept = {
  id: 'philo-applied-ethics',
  name: 'Applied Ethics',
  domain: 'philosophy',
  description:
    'Applied ethics uses philosophical frameworks to address real moral questions in ' +
    'specific domains. Bioethics addresses medical decisions: autonomy (patient\'s right to choose), ' +
    'beneficence (do good), non-maleficence (do no harm), justice (fair distribution of care). ' +
    'Environmental ethics asks what moral standing non-human nature has: do animals have rights? ' +
    'Do ecosystems? Technology ethics examines AI decision-making, privacy, data use, and ' +
    'algorithmic bias. Political philosophy addresses justice, rights, and the social contract. ' +
    'The trolley problem (sacrifice one to save five?) is a thought experiment testing consequentialist ' +
    'vs. deontological intuitions. Moral dilemmas often reveal conflicts between frameworks: ' +
    'the consequentialist may justify an act the deontologist considers a categorical violation. ' +
    'Applied ethics requires knowing the facts of the situation AND having ethical frameworks ' +
    'to analyze them.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-ethics',
      description: 'Applied ethics applies theoretical ethical frameworks to concrete situations',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
