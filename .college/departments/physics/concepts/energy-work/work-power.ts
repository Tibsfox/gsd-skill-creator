import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const workPower: RosettaConcept = {
  id: 'phys-work-power',
  name: 'Work & Power',
  domain: 'physics',
  description:
    'Work is done when a force acts on an object and the object moves in the direction of the force ' +
    '(W = F·d·cosθ). Power is the rate at which work is done. Understanding work connects force and ' +
    'motion to energy: doing work on an object transfers energy to it. The work-energy theorem states ' +
    'that net work equals the change in kinetic energy.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-newtons-laws',
      description: 'Work is defined in terms of force from Newton\'s laws acting over a displacement',
    },
    {
      type: 'dependency',
      targetId: 'phys-kinetic-potential-energy',
      description: 'Work transfers energy between kinetic and potential forms',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.5625 + 0.09),
    angle: Math.atan2(0.3, 0.75),
  },
};
