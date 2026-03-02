import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const thoughtExperiments: RosettaConcept = {
  id: 'philo-thought-experiments',
  name: 'Thought Experiments',
  domain: 'philosophy',
  description:
    'Thought experiments are hypothetical scenarios constructed to test philosophical intuitions ' +
    'and isolate conceptual issues. Plato\'s Ring of Gyges (would a just person act justly if ' +
    'invisible?) tests whether justice is intrinsically or instrumentally valued. Descartes\' ' +
    'Evil Demon isolates the question of what can be known with certainty. Trolley problems ' +
    '(Philippa Foot, Judith Jarvis Thomson) expose the tension between consequentialist and ' +
    'deontological moral intuitions. John Searle\'s Chinese Room challenges strong AI: following ' +
    'syntax rules doesn\'t constitute understanding semantics. Derek Parfit\'s teleporter cases ' +
    'probe personal identity across physical discontinuity. Mary\'s Room (Frank Jackson) argues ' +
    'that knowing all physical facts about color doesn\'t capture the qualia of seeing red. ' +
    'Good thought experiments are precise (eliminate ambiguity), isolating (one variable changes), ' +
    'and pump strong, widely-shared intuitions.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-socratic-method',
      description: 'Thought experiments extend Socratic questioning by constructing hypothetical cases rather than interrogating actual beliefs',
    },
  ],
  complexPlanePosition: {
    real: 0.35,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.1225 + 0.4225),
    angle: Math.atan2(0.65, 0.35),
  },
};
