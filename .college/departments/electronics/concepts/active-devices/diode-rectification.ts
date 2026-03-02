import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const diodeRectification: RosettaConcept = {
  id: 'elec-diode-rectification',
  name: 'Diode Circuits & Rectification',
  domain: 'electronics',
  description:
    'A diode is a one-way valve for current: it conducts in forward bias and blocks in reverse. ' +
    'The Shockley equation I = I_s*(exp(V/(n*V_T)) - 1) describes I-V behavior where I_s is ' +
    'saturation current (~10^-12 A), n is ideality factor (1-2), and V_T = kT/q ≈ 26mV at room ' +
    'temperature. Silicon diodes drop ~0.6-0.7V forward. Rectification converts AC to pulsating DC: ' +
    'half-wave uses one diode, full-wave bridge uses four diodes. Zener diodes operate in reverse ' +
    'breakdown maintaining a fixed voltage (V_Z) for voltage regulation. LEDs emit photons when ' +
    'electrons recombine across the semiconductor junction. Clamping and clipping circuits use ' +
    'diodes to limit or shift signal levels.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-ohms-law-fundamentals',
      description: "Forward voltage drop and current calculations still use Ohm's Law in the surrounding circuit",
    },
    {
      type: 'dependency',
      targetId: 'elec-semiconductor-physics',
      description: 'Shockley equation emerges from p-n junction carrier physics in semiconductor materials',
    },
  ],
  complexPlanePosition: {
    real: 0.80,
    imaginary: 0.20,
    magnitude: Math.sqrt(0.80 ** 2 + 0.20 ** 2),
    angle: Math.atan2(0.20, 0.80),
  },
};
