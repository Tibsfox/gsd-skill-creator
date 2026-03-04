/**
 * Music department enrichment — adds Audio Production & Engineering wing.
 */

export interface DepartmentEnrichment {
  department: string;
  wing: string;
  description: string;
  concepts: string[];
  trySessions: { name: string; description: string }[];
  crossReferences: { department: string; topic: string }[];
}

export const musicEnrichment: DepartmentEnrichment = {
  department: 'music',
  wing: 'Audio Production & Engineering',
  description: 'Audio production techniques, synthesis, mixing science, and the mapping from audio engineering to mesh architecture',
  concepts: [
    'overtone-series', 'resonance', 'vco', 'vcf', 'vca', 'envelope',
    'modulation', 'patch', 'channel-strip', 'bus-compressor', 'equalization',
    'gain-staging', 'daw', 'multitrack', 'crossfade', 'beatmatch',
  ],
  trySessions: [
    {
      name: 'Your First Oscillator',
      description: 'Explore sine, sawtooth, and square waves — hear how waveform shape creates timbre',
    },
    {
      name: 'Signal Flow Journey',
      description: 'Trace a sound from microphone through preamp, EQ, compressor, to mix bus',
    },
  ],
  crossReferences: [
    { department: 'physics', topic: 'Acoustics & Wave Physics' },
    { department: 'electronics', topic: 'Circuit Design for Audio' },
    { department: 'mathematics', topic: 'Fourier Analysis' },
  ],
};
