import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const feedbackStability: RosettaConcept = {
  id: 'elec-feedback-stability',
  name: 'Feedback & Stability',
  domain: 'electronics',
  description:
    'Negative feedback reduces gain but improves linearity, bandwidth, and stability. Closed-loop gain ' +
    'A_cl = A_ol/(1 + A_ol*beta) where A_ol is open-loop gain and beta is feedback fraction. At high ' +
    'frequencies, phase shift accumulates through amplifier poles. If phase shift reaches 180 degrees ' +
    'while loop gain exceeds 0dB, the system oscillates (Barkhausen criterion). Phase margin is the ' +
    'additional phase shift needed to reach 180 degrees at the gain crossover frequency -- 45 degrees is ' +
    'the minimum acceptable margin; 60 degrees gives well-damped response. Gain margin is the gain ' +
    'reduction needed to reach 0dB at the phase crossover frequency. Compensation techniques include ' +
    'dominant-pole compensation (adding a large capacitor to roll off gain early), Miller compensation ' +
    'in op-amp design, and lead-lag networks to boost phase margin.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-signal-ac-analysis',
      description: 'Bode plot analysis of open-loop gain and phase is the foundation of stability analysis',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-opamp-configurations',
      description: 'Op-amp circuits apply negative feedback -- stability analysis determines compensation needs',
    },
  ],
  complexPlanePosition: {
    real: 0.50,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.50 ** 2 + 0.55 ** 2),
    angle: Math.atan2(0.55, 0.50),
  },
};
