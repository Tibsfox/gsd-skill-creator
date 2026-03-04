/**
 * Synthesis domain — Ch 5-6: analog synthesis, modular.
 */

import type { AudioConcept } from '../types.js';

export const synthesisConcepts: AudioConcept[] = [
  {
    id: 'vco',
    name: 'Voltage-Controlled Oscillator',
    domain: 'synthesis',
    chapter: 5,
    summary: 'Core sound source generating waveforms at frequencies determined by input voltage',
    meshMapping: 'skill = oscillator — each skill generates output at a frequency determined by context',
    complexPlanePosition: { angle: 1.0, magnitude: 0.9 },
    relatedConcepts: ['vcf', 'vca', 'modulation', 'patch'],
    keywords: ['oscillator', 'waveform', 'sine', 'sawtooth', 'square', 'voltage'],
  },
  {
    id: 'vcf',
    name: 'Voltage-Controlled Filter',
    domain: 'synthesis',
    chapter: 5,
    summary: 'Shapes timbre by attenuating frequencies above or below a cutoff point',
    meshMapping: 'eval = filter — evaluation pipeline filters output quality, passing what meets thresholds',
    complexPlanePosition: { angle: 1.1, magnitude: 0.85 },
    relatedConcepts: ['vco', 'vca', 'equalization', 'resonance'],
    keywords: ['lowpass', 'highpass', 'cutoff', 'resonance', 'filter-sweep'],
  },
  {
    id: 'vca',
    name: 'Voltage-Controlled Amplifier',
    domain: 'synthesis',
    chapter: 5,
    summary: 'Controls signal amplitude over time, typically driven by an envelope generator',
    meshMapping: 'token budget = amplifier — controls how much signal (tokens) reaches the output',
    complexPlanePosition: { angle: 1.2, magnitude: 0.8 },
    relatedConcepts: ['vco', 'vcf', 'envelope'],
    keywords: ['amplifier', 'gain', 'volume', 'dynamics', 'level'],
  },
  {
    id: 'envelope',
    name: 'ADSR Envelope',
    domain: 'synthesis',
    chapter: 5,
    summary: 'Attack-Decay-Sustain-Release shape controlling how parameters change over time',
    meshMapping: 'lifecycle phases — skill activation has attack (load), sustain (active), release (cleanup)',
    complexPlanePosition: { angle: 1.3, magnitude: 0.75 },
    relatedConcepts: ['vca', 'modulation'],
    keywords: ['attack', 'decay', 'sustain', 'release', 'adsr', 'shape'],
  },
  {
    id: 'modulation',
    name: 'Modulation',
    domain: 'synthesis',
    chapter: 5,
    summary: 'Using one signal to control a parameter of another signal',
    meshMapping: 'context modulation — session context modifies skill behavior dynamically',
    complexPlanePosition: { angle: 1.4, magnitude: 0.7 },
    relatedConcepts: ['vco', 'lfo', 'patch'],
    keywords: ['lfo', 'fm-synthesis', 'ring-modulation', 'vibrato', 'tremolo'],
  },
  {
    id: 'patch',
    name: 'Synthesis Patch',
    domain: 'synthesis',
    chapter: 6,
    summary: 'A specific configuration of interconnected modules creating a unique sound',
    meshMapping: 'skill bundle = patch — a configured set of skills wired together for a task',
    complexPlanePosition: { angle: 1.5, magnitude: 0.65 },
    relatedConcepts: ['vco', 'vcf', 'vca', 'modulation'],
    keywords: ['patch-cable', 'routing', 'configuration', 'preset', 'modular'],
  },
];
