/**
 * Mixing domain — Ch 9-10, 16: legendary consoles, mixing science.
 */

import type { AudioConcept } from '../types.js';

export const consolesAndMixingConcepts: AudioConcept[] = [
  {
    id: 'channel-strip',
    name: 'Channel Strip',
    domain: 'mixing',
    chapter: 9,
    summary: 'Complete signal processing path for one input: preamp, EQ, dynamics, fader, pan, aux sends',
    meshMapping: 'chipset = console — each chipset subsystem processes one aspect of the signal chain',
    complexPlanePosition: { angle: 3.0, magnitude: 0.9 },
    relatedConcepts: ['bus-compressor', 'equalization', 'gain-staging'],
    keywords: ['channel', 'strip', 'preamp', 'fader', 'pan', 'signal-path'],
  },
  {
    id: 'bus-compressor',
    name: 'Bus Compressor',
    domain: 'mixing',
    chapter: 16,
    summary: 'Dynamics processor on a mix bus that glues multiple signals together with unified dynamics',
    meshMapping: 'DACP = bus compressor — applies unified quality control across bundled outputs',
    complexPlanePosition: { angle: 3.1, magnitude: 0.85 },
    relatedConcepts: ['channel-strip', 'gain-staging', 'summing'],
    keywords: ['compressor', 'dynamics', 'glue', 'ratio', 'threshold', 'bus'],
  },
  {
    id: 'equalization',
    name: 'Equalization (EQ)',
    domain: 'mixing',
    chapter: 16,
    summary: 'Frequency-selective gain adjustment to shape the tonal balance of a signal',
    meshMapping: 'capability weighting — boosting or cutting specific model capabilities for task fit',
    complexPlanePosition: { angle: 3.2, magnitude: 0.8 },
    relatedConcepts: ['channel-strip', 'frequency-response', 'vcf'],
    keywords: ['eq', 'parametric', 'shelving', 'notch', 'tonal-balance'],
  },
  {
    id: 'gain-staging',
    name: 'Gain Staging',
    domain: 'mixing',
    chapter: 16,
    summary: 'Managing signal levels through each processing stage to maintain optimal headroom',
    meshMapping: 'token budget management — maintaining headroom at each pipeline stage',
    complexPlanePosition: { angle: 3.3, magnitude: 0.75 },
    relatedConcepts: ['channel-strip', 'signal-to-noise', 'headroom'],
    keywords: ['gain', 'level', 'headroom', 'clipping', 'unity-gain'],
  },
  {
    id: 'summing',
    name: 'Summing',
    domain: 'mixing',
    chapter: 9,
    summary: 'Combining multiple audio signals into a composite output on a mix bus',
    meshMapping: 'result aggregation — combining outputs from parallel agents into unified response',
    complexPlanePosition: { angle: 3.4, magnitude: 0.7 },
    relatedConcepts: ['channel-strip', 'bus-compressor'],
    keywords: ['mix-bus', 'summing-amplifier', 'stereo-bus', 'combine'],
  },
  {
    id: 'signal-to-noise',
    name: 'Signal-to-Noise Ratio',
    domain: 'mixing',
    chapter: 16,
    summary: 'Ratio of desired signal power to background noise power, measured in decibels',
    meshMapping: 'quality metrics — ratio of useful output to noise/hallucination in model responses',
    complexPlanePosition: { angle: 3.5, magnitude: 0.65 },
    relatedConcepts: ['gain-staging', 'headroom'],
    keywords: ['snr', 'noise-floor', 'dynamic-range', 'clean-signal'],
  },
];
