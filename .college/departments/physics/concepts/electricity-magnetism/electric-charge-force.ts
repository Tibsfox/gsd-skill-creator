import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electricChargeForce: RosettaConcept = {
  id: 'phys-electric-charge-force',
  name: 'Electric Charge & Force',
  domain: 'physics',
  description:
    'Electric charge is a fundamental property of matter: protons are positive, electrons negative, and ' +
    'like charges repel while opposite charges attract. Coulomb\'s law quantifies the electrostatic force ' +
    'between charges (proportional to charges, inversely proportional to distance squared). ' +
    'Electric fields describe the force per unit charge that would be experienced at any point in space.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-ohms-law-circuits',
      description: 'Charge flow (current) in circuits is driven by the electric force from potential difference',
    },
    {
      type: 'analogy',
      targetId: 'phys-gravitation',
      description: 'Coulomb\'s law and Newton\'s law of gravitation have the same mathematical form (inverse square laws)',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
