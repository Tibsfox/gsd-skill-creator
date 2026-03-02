import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const gravitation: RosettaConcept = {
  id: 'phys-gravitation',
  name: 'Universal Gravitation',
  domain: 'physics',
  description:
    'Newton\'s law of universal gravitation states that every mass attracts every other mass with a force ' +
    'proportional to the product of their masses and inversely proportional to the square of their separation. ' +
    'This single law explains falling objects, the Moon\'s orbit, tidal forces, and the motions of planets. ' +
    'Gravitational fields describe the influence a mass has on the space around it.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-newtons-laws',
      description: 'Universal gravitation provides the force term in F=ma for objects in gravitational fields',
    },
    {
      type: 'cross-reference',
      targetId: 'geo-seasons-tides',
      description: 'Gravitational forces from the Moon and Sun cause Earth\'s tides',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
