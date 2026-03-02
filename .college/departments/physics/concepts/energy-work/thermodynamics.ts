import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const thermodynamics: RosettaConcept = {
  id: 'phys-thermodynamics',
  name: 'Thermodynamics & Heat Transfer',
  domain: 'physics',
  description:
    'Thermodynamics studies heat, temperature, and their relationship to work and energy. The first law ' +
    '(energy conservation) and second law (entropy increases in closed systems) define limits on what ' +
    'engines can do. Heat transfers by conduction, convection, and radiation. Absolute temperature ' +
    '(Kelvin scale) is proportional to average molecular kinetic energy.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-conservation-of-energy',
      description: 'Thermodynamics is the branch of physics that extends energy conservation to include heat',
    },
    {
      type: 'cross-reference',
      targetId: 'chem-thermochemistry',
      description: 'Thermochemistry applies thermodynamic principles to chemical reactions',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};
