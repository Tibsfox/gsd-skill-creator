/**
 * Physics department enrichment — adds Acoustics & Wave Physics content.
 */

import type { DepartmentEnrichment } from './music-enrichment.js';

export const physicsEnrichment: DepartmentEnrichment = {
  department: 'physics',
  wing: 'Acoustics & Wave Physics',
  description: 'Physics of sound propagation, standing waves, resonance, and psychoacoustic phenomena',
  concepts: [
    'overtone-series', 'standing-waves', 'resonance', 'frequency-response',
    'fletcher-munson', 'psychoacoustics', 'masking',
  ],
  trySessions: [
    {
      name: 'Visualize a Standing Wave',
      description: 'Explore how constructive and destructive interference creates patterns in enclosed spaces',
    },
  ],
  crossReferences: [
    { department: 'music', topic: 'Audio Production & Engineering' },
    { department: 'mathematics', topic: 'Wave Equations & Fourier Series' },
  ],
};
