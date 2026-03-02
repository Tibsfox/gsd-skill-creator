import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ohmsLawCircuits: RosettaConcept = {
  id: 'phys-ohms-law-circuits',
  name: "Ohm's Law & Circuits",
  domain: 'physics',
  description:
    "Ohm's law (V = IR) relates voltage (potential difference), current (charge flow rate), and resistance. " +
    'Series circuits share current with voltages adding; parallel circuits share voltage with currents adding. ' +
    'Kirchhoff\'s laws extend Ohm\'s law to complex circuit networks. Power dissipated is P = IV. ' +
    'Circuit analysis underpins all of electronics.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'phys-electric-charge-force',
      description: 'Circuit current is the directed flow of electric charge driven by electric force',
    },
    {
      type: 'dependency',
      targetId: 'phys-magnetic-fields',
      description: 'Current-carrying wires create magnetic fields, linking circuits to electromagnetism',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
