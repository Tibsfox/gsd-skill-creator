/**
 * Chopper Stabilization concept — electronics noise wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.13129v1 (2026).
 *
 * @module departments/electronics/concepts/noise/chopper-stabilization-offset-flicker-noise
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const chopperStabilizationOffsetFlickerNoise: RosettaConcept = {
  id: 'elec-chopper-stabilization-offset-flicker-noise',
  name: 'Chopper Stabilization',
  domain: 'electronics',
  description: 'Chopper stabilization is a precision analog technique that removes an amplifier\'s DC offset and low-frequency 1/f (flicker) noise by translating the signal into a frequency band where the amplifier is quiet, amplifying it there, then translating it back. An input chopper -- a ring of MOS switches driven by a square wave at chopping frequency Fch -- modulates the near-DC input up to Fch and its odd harmonics. The amplifier\'s own offset Vos and flicker noise stay at baseband. A second chopper at the output, driven by the same clock, demodulates the wanted signal back to DC while simultaneously up-converting the offset and 1/f noise to Fch; a low-pass filter then rejects them. The governing design rule is Fch > Fcorner, the flicker-noise corner frequency, so the signal lands in the flat thermal region and the input-referred noise approaches the white floor Sv = 4*k*T*Rn (V^2/Hz) instead of the flicker term Kf/(Cox*W*L*f). Chopping does not lower thermal noise; it only banishes offset and 1/f, and residual offset is set by clock charge injection and switch mismatch rather than the intrinsic device. The method underpins precision op-amps, capacitively-coupled instrumentation amplifiers (gain = Cin/Cfb), Hall sensors, and biopotential (ECG/EEG) front-ends. A known cost is that switched-capacitor input choppers present a resistive input impedance Zin = 1/(Fch*Ci); modern designs add charge-conservation and impedance-boosting loops so high-source-impedance dry-electrode sensors are not loaded down.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-semiconductor-physics',
      description: 'Flicker (1/f) noise, the very error chopping cancels, originates in carrier trapping and detrapping at the MOSFET oxide interface; understanding the device-physics source explains why the corner frequency exists and why Fch must exceed it.',
    },
    {
      type: 'dependency',
      targetId: 'elec-opamp-configurations',
      description: 'Chopper stabilization is a modulation wrapper placed around a conventional gain stage; it is the technique used to realize precision op-amps and capacitively-coupled instrumentation amplifiers whose closed-loop gain (Cin/Cfb) follows standard op-amp feedback configuration.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-signal-ac-analysis',
      description: 'The modulate-amplify-demodulate mechanism is a frequency-domain spectral translation by a square-wave carrier; analyzing where signal, offset, and 1/f land after each chopper requires AC/frequency-domain reasoning about mixing and harmonics.',
    },
    {
      type: 'cross-reference',
      targetId: 'elc-1.6-strain-gauge-noise-budget',
      description: 'In an instrumentation-amplifier noise budget for bridge and strain-gauge sensors, 1/f noise dominates near DC; chopping is the concrete cancellation lever that trades a residual switching-spike term for removal of the flicker and offset contributions in that same budget.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
