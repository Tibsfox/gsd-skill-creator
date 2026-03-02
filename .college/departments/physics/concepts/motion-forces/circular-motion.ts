import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const circularMotion: RosettaConcept = {
  id: 'phys-circular-motion',
  name: 'Circular Motion & Centripetal Force',
  domain: 'physics',
  description:
    'Objects moving in circles are continuously accelerating toward the center even at constant speed, ' +
    'because their direction changes. Centripetal acceleration (v²/r) is provided by a centripetal force ' +
    '(not a new type of force, but the net inward force from tension, gravity, friction, etc.). ' +
    'Applications include satellites, car cornering, and centrifuges.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-newtons-laws',
      description: 'Centripetal force is understood through Newton\'s second law applied to circular acceleration',
    },
    {
      type: 'dependency',
      targetId: 'phys-gravitation',
      description: 'Planetary orbits are a key application of circular motion under gravitational centripetal force',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
