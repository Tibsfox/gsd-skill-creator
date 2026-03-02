import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const signalAcAnalysis: RosettaConcept = {
  id: 'elec-signal-ac-analysis',
  name: 'Signal & AC Analysis',
  domain: 'electronics',
  description:
    'AC signals are sinusoidal voltages and currents characterized by amplitude, frequency (Hz), and phase. ' +
    'Frequency response describes how a circuit attenuates or amplifies signals at each frequency. ' +
    'Bode plots display gain (dB) and phase (degrees) on a logarithmic frequency axis -- a first-order ' +
    'RC low-pass filter has a -3dB corner at f_c = 1/(2*pi*RC) and rolls off at -20dB/decade. ' +
    'Decibels convert ratios to log scale: dB = 20*log10(V_out/V_in). Noise is unwanted electrical ' +
    'variation: thermal noise power P_n = kTB where k is Boltzmann\'s constant, T is temperature, ' +
    'and B is bandwidth. Spectrum analysis via Fourier transform reveals frequency content of time-domain signals.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-passive-component-behavior',
      description: 'RC/RL/RLC frequency response shapes the AC signals through capacitive and inductive impedances',
    },
    {
      type: 'cross-reference',
      targetId: 'math-logarithmic-scales',
      description: 'Bode plots use logarithmic frequency and dB scales from mathematical logarithms',
    },
  ],
  complexPlanePosition: {
    real: 0.72,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.72 ** 2 + 0.35 ** 2),
    angle: Math.atan2(0.35, 0.72),
  },
};
