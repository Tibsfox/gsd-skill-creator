import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electromagneticInduction: RosettaConcept = {
  id: 'phys-electromagnetic-induction',
  name: 'Electromagnetic Induction',
  domain: 'physics',
  description:
    'Faraday\'s law: a changing magnetic field through a loop induces an electromotive force (EMF) that ' +
    'drives current. This is the principle behind generators (mechanical energy to electrical) and transformers ' +
    '(voltage step-up or step-down for power transmission). Lenz\'s law states the induced current ' +
    'opposes the change that caused it, a consequence of energy conservation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-magnetic-fields',
      description: 'Induction requires changing magnetic flux through a conductor',
    },
    {
      type: 'cross-reference',
      targetId: 'phys-conservation-of-energy',
      description: 'Lenz\'s law (opposing the inducing change) is a consequence of energy conservation',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
