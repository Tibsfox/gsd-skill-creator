import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const magneticFields: RosettaConcept = {
  id: 'phys-magnetic-fields',
  name: 'Magnetic Fields & Forces',
  domain: 'physics',
  description:
    'Moving charges (currents) create magnetic fields. Magnetic fields exert forces on moving charges ' +
    'perpendicular to both the velocity and the field (Lorentz force). Permanent magnets are explained ' +
    'by aligned electron spins. Magnetic field lines never cross, and unlike electric fields, magnetic ' +
    'monopoles do not appear to exist. Earth\'s magnetic field deflects solar wind and enables compass navigation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-ohms-law-circuits',
      description: 'Current-carrying wires create magnetic fields, directly linking circuits to magnetism',
    },
    {
      type: 'dependency',
      targetId: 'phys-electromagnetic-induction',
      description: 'Changing magnetic fields induce electric currents, unifying electricity and magnetism',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
