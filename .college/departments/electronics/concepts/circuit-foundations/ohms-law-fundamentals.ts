import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ohmsLawFundamentals: RosettaConcept = {
  id: 'elec-ohms-law-fundamentals',
  name: "Ohm's Law & Circuit Fundamentals",
  domain: 'electronics',
  description:
    "Voltage, current, and resistance are the three pillars of circuit analysis. Ohm's Law (V=IR) governs " +
    'every passive circuit element: double the resistance and current halves; double the voltage and ' +
    'current doubles. KVL (Kirchhoff\'s Voltage Law) states that voltages around any closed loop sum to ' +
    'zero. KCL (Kirchhoff\'s Current Law) states that currents into any node sum to zero. Series ' +
    'combinations add resistances; parallel combinations reduce to R_eq = R1*R2/(R1+R2). Power ' +
    'dissipated by a resistor is P = V*I = I^2*R = V^2/R.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-passive-component-behavior',
      description: "Passive component behavior extends Ohm's Law to capacitors (V=Q/C) and inductors (V=L*di/dt)",
    },
    {
      type: 'cross-reference',
      targetId: 'math-ratios-proportions',
      description: 'Voltage dividers are direct applications of ratio arithmetic',
    },
  ],
  complexPlanePosition: {
    real: 0.85,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.85 ** 2 + 0.15 ** 2),
    angle: Math.atan2(0.15, 0.85),
  },
};
