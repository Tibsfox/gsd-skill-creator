/**
 * Low-Power Bus Encoding concept — electronics digital-mixed-signal wing (June-2026 EE-scan, T2).
 *
 * Source: arXiv:2606.14203v1 (2026).
 *
 * @module departments/electronics/concepts/digital-mixed-signal/low-power-bus-encoding
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 1 * 2 * Math.PI / 29;
const radius = 0.8;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const lowPowerBusEncoding: RosettaConcept = {
  id: 'elec-low-power-bus-encoding',
  name: 'Low-Power Bus Encoding',
  domain: 'electronics',
  description: 'Dynamic power in CMOS is dominated by charging and discharging switching nodes, following P = alpha*C*V^2*f, where alpha is the switching activity factor (average bit-transitions per clock), C the load capacitance, V the supply, and f the clock frequency. Wide on- and off-chip buses have large wire capacitance C, so the energy they burn is set almost entirely by how many lines toggle between successive words. Bus encoding attacks alpha directly: rather than sending raw data, the transmitter maps each word to a codeword chosen to minimize the Hamming distance (number of bit-flips) from the previously transmitted word, and a matching decoder recovers the original. The canonical scheme is bus-invert coding: compute the Hamming distance d between the new word and the last word on the wires; if d > n/2, transmit the bitwise complement and raise one extra "invert" flag line, otherwise transmit unchanged. This caps transitions at n/2 per transfer and lowers the average, e.g. adding a handful of redundant lines to 64-bit data yields roughly 25 percent fewer flips. Low-weight and codebook-assisted codes generalize the idea, spending a few redundant bits to bias patterns toward fewer transitions; the same trick extends the endurance of flip-limited non-volatile memories (write-efficient memory). Encoder and decoder are small combinational blocks (compare, majority, XOR), so the technique is cheap and common in memory interfaces, SoC interconnect, and energy-sensitive I/O. Modern work makes two contributions: closed-form average-bit-flip expressions for the practical schemes, and two predefined-random-codebook-assisted encoders. Their point is near-optimality at low complexity -- with 8 redundant bits on 64-bit data the sub-optimal random-codebook schemes cut bit-flips (energy) by about 24.7%, within striking distance of the 26.4% achieved by the far more complex optimal scheme.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'elec-clock-gating-dynamic-power',
      description: 'Both techniques reduce the switching activity factor alpha in the same dynamic-power law P = alpha*C*V^2*f: clock gating suppresses toggles on the clock network, while bus encoding suppresses toggles on data lines.',
    },
    {
      type: 'dependency',
      targetId: 'elec-combinational-logic',
      description: 'The encoder and decoder (Hamming-distance compare, majority vote, bitwise XOR inversion) are realized as small combinational logic blocks, so bus encoding is built directly on combinational design.',
    },
    {
      type: 'dependency',
      targetId: 'elec-semiconductor-physics',
      description: 'The 0.5*C*V^2 energy dissipated per line transition arises from charging and discharging CMOS load capacitance, the device-physics basis for why minimizing bit-flips minimizes energy.',
    },
    {
      type: 'cross-reference',
      targetId: 'elec-microcontroller-interfacing',
      description: 'Off-chip address and data buses between an MCU and external memory carry the largest capacitance in an embedded system, making them the primary place low-power bus codes save energy.',
    },
    {
      type: "analogy",
      targetId: "elec-wide-bandgap-power-devices",
      description: "Low-power bus encoding minimizes toggle activity to shrink the C*V^2*f dynamic-power term on interconnect capacitance; wide-bandgap devices minimize the analogous C_oss*V^2*f_sw switching loss. Adding this edge completes the shared CV^2f cluster in which the other two members already interlink.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
