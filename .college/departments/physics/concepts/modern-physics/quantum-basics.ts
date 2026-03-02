import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const quantumBasics: RosettaConcept = {
  id: 'phys-quantum-basics',
  name: 'Quantum Mechanics Basics',
  domain: 'physics',
  description:
    'Quantum mechanics describes behavior at atomic and subatomic scales. Key ideas: wave-particle duality ' +
    '(particles behave as waves and vice versa), quantization (energy comes in discrete packets called quanta), ' +
    'the photoelectric effect (Einstein\'s Nobel prize), atomic emission spectra, and the uncertainty principle ' +
    '(position and momentum cannot both be precisely known simultaneously).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-wave-properties',
      description: 'Wave-particle duality connects quantum mechanics to classical wave physics',
    },
    {
      type: 'dependency',
      targetId: 'phys-nuclear-physics',
      description: 'Nuclear structure and radioactive decay are explained by quantum mechanical models of the nucleus',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.9,
    magnitude: Math.sqrt(0.04 + 0.81),
    angle: Math.atan2(0.9, 0.2),
  },
};
