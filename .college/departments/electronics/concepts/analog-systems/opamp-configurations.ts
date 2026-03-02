import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const opampConfigurations: RosettaConcept = {
  id: 'elec-opamp-configurations',
  name: 'Op-Amp Configurations',
  domain: 'electronics',
  description:
    'Operational amplifiers follow two golden rules: (1) inputs draw no current; (2) with negative ' +
    'feedback, V+ = V-. Inverting amplifier: gain = -R_f/R_in, output is phase-inverted. ' +
    'Non-inverting amplifier: gain = 1 + R_f/R_in, output is in phase. Voltage follower: R_f=0, ' +
    'R_in=infinity, gain=1, used as buffer. Summing amplifier adds scaled inputs. Integrator uses ' +
    'capacitor as R_f: V_out = -(1/RC)*integral(V_in dt). Differentiator uses capacitor as R_in. ' +
    'Comparator has no feedback -- output saturates to supply rail. Active filters use op-amps with ' +
    'RC networks: Sallen-Key topology achieves Butterworth, Chebyshev, or Bessel responses. ' +
    'Instrumentation amplifiers use 3 op-amps for high CMRR differential measurement.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-transistor-amplifiers',
      description: 'Op-amps are integrated circuits built from differential transistor pairs and current mirrors',
    },
    {
      type: 'dependency',
      targetId: 'elec-feedback-stability',
      description: 'Op-amp stability requires understanding loop gain, phase margin, and frequency compensation',
    },
  ],
  complexPlanePosition: {
    real: 0.60,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.60 ** 2 + 0.45 ** 2),
    angle: Math.atan2(0.45, 0.60),
  },
};
