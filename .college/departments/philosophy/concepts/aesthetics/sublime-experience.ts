import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sublimeExperience: RosettaConcept = {
  id: 'philo-sublime-experience',
  name: 'The Sublime',
  domain: 'philosophy',
  description:
    'The sublime is the aesthetic experience of something vast, overwhelming, or terrifying that ' +
    'paradoxically produces pleasure — an elevation of the mind above mere sensory experience. ' +
    'Edmund Burke\'s physiological account (1757): the sublime arises from objects associated ' +
    'with terror (vastness, infinity, darkness, power) and produces a modified fear. Kant ' +
    'distinguishes the mathematical sublime (enormous quantity that defeats imagination yet reason ' +
    'comprehends infinity) from the dynamical sublime (overwhelming natural power yet we are safe, ' +
    'discovering our rational dignity surpasses nature). Schiller\'s moral sublime: confronting ' +
    'nature\'s power reveals our supersensible freedom. Romantic painters (Turner, Friedrich) made ' +
    'the sublime their central subject — tiny human figures before glaciers or stormy seas. ' +
    'Contemporary theorists apply the sublime to technological scale, data, and nuclear threat.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-art-and-beauty',
      description: 'The sublime is distinguished from beauty by the element of overwhelming power and terror',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.04 + 0.64),
    angle: Math.atan2(0.8, 0.2),
  },
};
