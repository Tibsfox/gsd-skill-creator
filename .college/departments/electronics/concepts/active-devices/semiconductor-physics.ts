import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const semiconductorPhysics: RosettaConcept = {
  id: 'elec-semiconductor-physics',
  name: 'Semiconductor Physics',
  domain: 'electronics',
  description:
    'Silicon has 4 valence electrons forming a crystal lattice. N-type doping (phosphorus, arsenic) ' +
    'adds free electrons (majority carriers). P-type doping (boron) adds holes (missing electrons). ' +
    'At a p-n junction, electrons diffuse from N to P and holes diffuse from P to N, creating a ' +
    'depletion region with a built-in electric field (~0.6V for silicon). Forward bias reduces the ' +
    'depletion barrier allowing current; reverse bias widens it blocking current. Minority carrier ' +
    'lifetime determines how quickly devices switch. Avalanche breakdown occurs when the electric ' +
    'field is strong enough to ionize atoms by impact -- Zener breakdown is a quantum tunneling effect ' +
    'occurring at lower voltages. Band gap energy determines emission wavelength in LEDs and absorption ' +
    'in photodetectors.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'elec-ohms-law-fundamentals',
      description: 'Bulk semiconductor conductivity follows Ohm\'s Law: J = sigma*E (current density = conductivity * electric field)',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-diode-rectification',
      description: 'p-n junction physics is the physical basis for all diode and transistor behavior',
    },
  ],
  complexPlanePosition: {
    real: 0.70,
    imaginary: 0.40,
    magnitude: Math.sqrt(0.70 ** 2 + 0.40 ** 2),
    angle: Math.atan2(0.40, 0.70),
  },
};
