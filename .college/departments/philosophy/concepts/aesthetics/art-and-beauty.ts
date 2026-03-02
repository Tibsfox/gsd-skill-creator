import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const artAndBeauty: RosettaConcept = {
  id: 'philo-art-and-beauty',
  name: 'Art & Beauty',
  domain: 'philosophy',
  description:
    'Theories of beauty ask whether it is an objective property of things or a subjective ' +
    'response of perceivers. Plato located beauty in eternal Forms — particular beautiful things ' +
    'participate imperfectly in the Form of Beauty itself. Hume\'s empiricist view: beauty exists ' +
    'in the mind, not the object, yet there is a standard of taste based on ideal critics with ' +
    'delicate faculties, free of prejudice. Kant synthesizes: aesthetic judgments claim universal ' +
    'agreement ("this is beautiful") yet rest on feeling, not concepts — they are "subjectively ' +
    'universal." Contemporary approaches include the neurological (beauty as reward circuitry ' +
    'response), evolutionary (fitness indicators), and cultural constructivist (beauty standards ' +
    'as historically variable social agreements). The question of natural beauty vs. artistic ' +
    'beauty divides theorists: is a sunset beautiful in the same sense as a Vermeer?',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-aesthetics',
      description: 'Theories of beauty are the central question of philosophical aesthetics',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.09 + 0.49),
    angle: Math.atan2(0.7, 0.3),
  },
};
