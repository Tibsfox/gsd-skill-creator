import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const conservationOfEnergy: RosettaConcept = {
  id: 'phys-conservation-of-energy',
  name: 'Conservation of Energy',
  domain: 'physics',
  description:
    'Energy can neither be created nor destroyed -- only transformed from one form to another. ' +
    'In a closed system without non-conservative forces, total mechanical energy is constant. ' +
    'When friction is present, mechanical energy converts to thermal energy. This law spans all of ' +
    'physics and connects to chemistry (thermodynamics), biology (metabolism), and engineering (efficiency).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-kinetic-potential-energy',
      description: 'Energy conservation governs the exchange between kinetic and potential energy',
    },
    {
      type: 'dependency',
      targetId: 'phys-thermodynamics',
      description: 'Thermodynamics extends energy conservation to include thermal energy and entropy',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.25 + 0.36),
    angle: Math.atan2(0.6, 0.5),
  },
};
