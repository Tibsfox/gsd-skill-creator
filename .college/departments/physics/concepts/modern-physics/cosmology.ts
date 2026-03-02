import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cosmology: RosettaConcept = {
  id: 'phys-cosmology',
  name: 'Cosmology & the Universe',
  domain: 'physics',
  description:
    'Cosmology studies the origin, structure, and evolution of the universe. The Big Bang theory describes ' +
    'the universe beginning ~13.8 billion years ago in an extremely hot, dense state and expanding ever since. ' +
    'Evidence includes the cosmic microwave background, Hubble\'s redshift observations, and elemental abundances. ' +
    'Dark matter and dark energy constitute most of the universe but remain poorly understood.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-special-relativity',
      description: 'General relativity (extending special relativity) provides the framework for modern cosmology',
    },
    {
      type: 'cross-reference',
      targetId: 'geo-stellar-evolution',
      description: 'Stellar evolution and galaxy formation are studied at the intersection of physics and astronomy',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.95,
    magnitude: Math.sqrt(0.04 + 0.9025),
    angle: Math.atan2(0.95, 0.2),
  },
};
