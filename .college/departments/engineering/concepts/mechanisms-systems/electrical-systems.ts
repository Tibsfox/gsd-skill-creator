import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const electricalSystems: RosettaConcept = {
  id: 'engr-electrical-systems',
  name: 'Electrical Systems',
  domain: 'engineering',
  description:
    'Electrical systems use electron flow to transmit power and signals. ' +
    'Basic circuit elements: resistors, capacitors, inductors, diodes, transistors. ' +
    'Ohm\'s law (V = IR) and Kirchhoff\'s laws govern circuit analysis. ' +
    'Power systems (motors, generators, power supplies) convert between electrical and mechanical energy. ' +
    'Digital systems encode information as binary signals processed by logic gates. ' +
    'Modern engineering is inseparable from electrical systems.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-ohms-law-circuits',
      description: 'Electrical engineering applies Ohm\'s law and circuit analysis at the systems and design level',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.3025 + 0.4225),
    angle: Math.atan2(0.65, 0.55),
  },
};
