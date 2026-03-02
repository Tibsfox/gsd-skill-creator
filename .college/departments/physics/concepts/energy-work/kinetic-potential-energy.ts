import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const kineticPotentialEnergy: RosettaConcept = {
  id: 'phys-kinetic-potential-energy',
  name: 'Kinetic & Potential Energy',
  domain: 'physics',
  description:
    'Kinetic energy (KE = ½mv²) is energy of motion; potential energy is stored energy due to position ' +
    'or configuration (gravitational: mgh; elastic: ½kx²). As a roller coaster descends, potential energy ' +
    'converts to kinetic energy -- and vice versa on the way up. The ability to convert between forms ' +
    'while conserving total energy is the foundation of energy analysis in physics.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-work-power',
      description: 'Work is the mechanism by which energy is transferred to or from an object',
    },
    {
      type: 'dependency',
      targetId: 'phys-conservation-of-energy',
      description: 'KE-PE interconversion is the most common application of energy conservation',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
