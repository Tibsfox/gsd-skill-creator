/**
 * Doherty Power Amplifier concept — electronics analog-systems wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.18395v1 (2026).
 *
 * @module departments/electronics/concepts/analog-systems/doherty-power-amplifier
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const dohertyPowerAmplifier: RosettaConcept = {
  id: 'elec-doherty-power-amplifier',
  name: 'Doherty Power Amplifier',
  domain: 'electronics',
  description: 'The Doherty power amplifier (DPA) is an RF architecture that keeps efficiency high not only at saturation but also at power back-off, the region where modern high-crest-factor waveforms spend most of their time. Introduced by W. H. Doherty in 1936, it combines two devices: a carrier (main) amplifier biased Class AB that conducts continuously, and a peaking (auxiliary) amplifier biased Class C that turns on only near peak power. Its defining mechanism is active load modulation. A quarter-wave transmission line (or lumped equivalent) acts as an impedance inverter obeying Z_in = Z0^2 / Z_L, so current injected by the peaking amplifier at the common node lowers the effective load the carrier device sees; this lets the carrier stay in voltage saturation, and therefore near peak efficiency, across roughly a 6 dB back-off range. Ideal Class-B efficiency tops out at pi/4 = 0.785 (78.5%); the Doherty scheme holds a broad efficiency plateau instead of a single peak. Because the Class-C peaking stage is inherently nonlinear, practical transmitters pair the DPA with digital predistortion (DPD) to meet spectral-mask and adjacent-channel-leakage-ratio (ACLR) limits. Doherty PAs are the workhorse of cellular base-station and 5G massive-MIMO transmitters, typically realized in GaN HEMT technology for high power density at 2-4 GHz. The three-port output combiner, which must simultaneously perform load modulation, impedance matching, and phase compensation, is the hardest element to synthesize and is now an active target of machine-learning-assisted inverse design: a pixelated combiner layout is represented as a grid of metal cells, a convolutional neural network predicts its electrical response, and a genetic algorithm searches that space under a dual-state impedance-synthesis objective that targets both the peak and the 6 dB back-off load conditions at once. Two GaN HEMT prototypes built this way demonstrate the method, delivering above 44.2 dBm saturated output, above 71.2% peak drain efficiency across 2.6-2.8 GHz, 64% drain efficiency at 6 dB back-off, and adjacent-channel-leakage-ratio below -51.3 dBc after DPD.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'elec-transistor-amplifiers',
      description: 'A Doherty PA is built from two transistor amplifier stages with different bias classes (carrier Class AB, peaking Class C); understanding single-stage device bias, conduction angle, and load lines is prerequisite to the two-amplifier load-modulation scheme.',
    },
    {
      type: 'dependency',
      targetId: 'elec-wide-bandgap-power-devices',
      description: 'Modern high-power Doherty PAs are almost universally realized in GaN HEMT wide-bandgap technology, whose high breakdown voltage and power density enable the tens-of-watts saturated output at microwave frequencies these transmitters require.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-signal-ac-analysis',
      description: 'The core load-modulation mechanism relies on the quarter-wave transmission line as an impedance inverter (Z_in = Z0^2 / Z_L), a small-signal AC / distributed-network result that governs how the combiner transforms and phase-compensates impedances.',
    },
    {
      type: 'analogy',
      targetId: 'elec-feedback-linearization',
      description: 'Digital predistortion applied to a Doherty PA linearizes an inherently nonlinear Class-C stage by pre-warping the input, analogous to feedback linearization cancelling plant nonlinearity, except DPD is an open-loop, model-based inverse rather than a closed loop.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
