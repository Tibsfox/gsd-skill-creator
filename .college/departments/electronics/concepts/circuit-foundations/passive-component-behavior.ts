import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const passiveComponentBehavior: RosettaConcept = {
  id: 'elec-passive-component-behavior',
  name: 'Passive Component Behavior',
  domain: 'electronics',
  description:
    'Capacitors store energy in electric fields: V=Q/C, impedance Z_C = 1/(j*omega*C). In DC steady-state ' +
    'a capacitor is an open circuit; during transients it charges with time constant tau=RC. ' +
    'Inductors store energy in magnetic fields: V=L*di/dt, impedance Z_L = j*omega*L. In DC steady-state ' +
    'an inductor is a short circuit. RLC circuits resonate at omega_0 = 1/sqrt(LC) where reactive ' +
    'impedances cancel. Thevenin equivalent replaces any linear network with V_th and R_th in series. ' +
    'Norton equivalent uses I_n and R_th in parallel. Thevenin and Norton are dual representations ' +
    'interconvertible via I_n = V_th/R_th.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-ohms-law-fundamentals',
      description: "Ohm's Law is the prerequisite; capacitors and inductors generalize it to frequency-dependent impedance",
    },
    {
      type: 'dependency',
      targetId: 'elec-signal-ac-analysis',
      description: 'Frequency response and Bode plots require understanding RC/RL/RLC filter behavior',
    },
  ],
  complexPlanePosition: {
    real: 0.80,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.80 ** 2 + 0.25 ** 2),
    angle: Math.atan2(0.25, 0.80),
  },
};
