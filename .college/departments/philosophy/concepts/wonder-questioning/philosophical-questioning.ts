import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const philosophicalQuestioning: RosettaConcept = {
  id: 'philo-philosophical-questioning',
  name: 'Philosophical Questioning',
  domain: 'philosophy',
  description:
    'Philosophical questions are distinguished by being open-ended, involving genuine ' +
    'disagreement among thoughtful people, and having answers that require reasoning rather ' +
    'than empirical investigation. Factual questions (What is the boiling point of water?) ' +
    'have determinable right answers. Opinion questions (What is the best flavor of ice cream?) ' +
    'are purely subjective. Philosophical questions occupy the middle: Is it ever right to ' +
    'lie? What makes a person the same person over time? Does life have meaning? ' +
    'These questions resist empirical resolution but are not merely matters of preference. ' +
    'The philosophical impulse begins in wonder (Aristotle: "all philosophy begins in wonder") ' +
    'and is sustained by intellectual humility -- the willingness to follow an argument wherever ' +
    'it leads, even if uncomfortable.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-socratic-method',
      description: 'The Socratic method operationalizes philosophical questioning as structured dialogue',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.16 + 0.16),
    angle: Math.atan2(0.4, 0.4),
  },
};
