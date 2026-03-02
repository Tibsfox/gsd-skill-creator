import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const orbitalMechanics: RosettaConcept = {
  id: 'astro-orbital-mechanics',
  name: 'Orbital Mechanics',
  domain: 'astronomy',
  description:
    'Orbital mechanics (celestial mechanics) governs the motion of objects under gravity. ' +
    'Kepler\'s three laws (empirical, 1609-1619): ' +
    '1. Orbits are ellipses with the Sun at one focus. ' +
    '2. Equal areas swept in equal time (faster at perihelion, slower at aphelion). ' +
    '3. Orbital period squared is proportional to semi-major axis cubed (P² ∝ a³). ' +
    'Newton derived these from his law of gravitation (F = Gm₁m₂/r²) -- Kepler\'s laws are ' +
    'consequences of gravity. Escape velocity: the minimum speed to escape a gravitational field ' +
    '(Earth escape velocity = 11.2 km/s). Orbital speed: objects in lower orbits move faster (ISS at ' +
    '7.7 km/s, Moon at 1.0 km/s). The Hohmann transfer orbit is the most fuel-efficient path ' +
    'between circular orbits. Lagrange points are gravitational equilibrium locations in a ' +
    'two-body system -- L2 hosts the James Webb Space Telescope.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-newtons-laws',
      description: 'Kepler\'s laws follow from Newton\'s law of gravitation -- the mathematical connection is orbital mechanics',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.49 + 0.16),
    angle: Math.atan2(0.4, 0.7),
  },
};
