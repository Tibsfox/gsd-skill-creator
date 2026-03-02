import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const socraticMethod: RosettaConcept = {
  id: 'philo-socratic-method',
  name: 'The Socratic Method',
  domain: 'philosophy',
  description:
    'The Socratic method is a form of cooperative inquiry through systematic questioning ' +
    'that exposes contradictions in interlocutors\' beliefs, leading them to deeper understanding. ' +
    'Socrates claimed to know nothing, asking questions rather than delivering answers. ' +
    'The elenchus (refutation) follows: assert a definition, find a counterexample, revise, repeat. ' +
    'This process reveals that most confident assertions rest on unexamined assumptions. ' +
    'In classroom settings, Socratic seminars structure discussion around open-ended questions ' +
    'with no predetermined right answer, requiring participants to build on each other\'s ideas. ' +
    'The method is uncomfortable -- it requires intellectual honesty and tolerance for not knowing -- ' +
    'but produces genuine understanding rather than memorized answers.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-philosophical-questioning',
      description: 'The Socratic method is a structured form of philosophical questioning',
    },
    {
      type: 'cross-reference',
      targetId: 'crit-ethical-reasoning',
      description: 'Socratic dialogue is central to ethical reasoning processes',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, 0.5),
  },
};
