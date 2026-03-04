/**
 * Muse vocabulary index — searchable registry of domain terms
 * mapped to muse affinities.
 */

import type { MuseVocabularyEntry, MuseVocabularyIndex } from './muse-vocabulary.js';

export function createMuseVocabularyIndex(entries: MuseVocabularyEntry[]): MuseVocabularyIndex {
  return {
    entries,

    getByMuse(museId: string): string[] {
      return entries
        .filter((e) => e.museAffinity.includes(museId))
        .map((e) => e.term);
    },

    getByDomain(domain: string): MuseVocabularyEntry[] {
      return entries.filter((e) => e.domain === domain);
    },

    search(query: string): MuseVocabularyEntry[] {
      if (!query) return [];
      const q = query.toLowerCase();
      return entries.filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.domain.toLowerCase().includes(q)
      );
    },
  };
}

/**
 * Audio engineering vocabulary entries distributed across 6 system muses.
 */
export const audioVocabularyEntries: MuseVocabularyEntry[] = [
  // Foxy — creative direction
  { term: 'arrangement', domain: 'production', museAffinity: ['foxy'] },
  { term: 'orchestration', domain: 'production', museAffinity: ['foxy'] },
  { term: 'timbre', domain: 'acoustics', museAffinity: ['foxy', 'sam'] },
  { term: 'overtone-series', domain: 'acoustics', museAffinity: ['foxy', 'sam'] },
  { term: 'crossfade', domain: 'culture', museAffinity: ['foxy'] },
  { term: 'crescendo', domain: 'culture', museAffinity: ['foxy'] },
  { term: 'resonant-frequency', domain: 'acoustics', museAffinity: ['foxy'] },
  { term: 'sound-design', domain: 'production', museAffinity: ['foxy'] },
  { term: 'synthesis-patch', domain: 'synthesis', museAffinity: ['foxy'] },
  { term: 'modulation-depth', domain: 'synthesis', museAffinity: ['foxy'] },
  { term: 'harmonic-content', domain: 'acoustics', museAffinity: ['foxy'] },
  { term: 'generative-system', domain: 'production', museAffinity: ['foxy'] },
  { term: 'sweet-spot', domain: 'mixing', museAffinity: ['foxy'] },
  { term: 'frequency-response', domain: 'acoustics', museAffinity: ['foxy', 'hemlock'] },
  { term: 'film-scoring', domain: 'production', museAffinity: ['foxy'] },
  // Lex — execution discipline
  { term: 'sample-rate', domain: 'protocols', museAffinity: ['lex'] },
  { term: 'bit-depth', domain: 'protocols', museAffinity: ['lex'] },
  { term: 'latency', domain: 'protocols', museAffinity: ['lex'] },
  { term: 'throughput', domain: 'protocols', museAffinity: ['lex'] },
  { term: 'buffer-size', domain: 'protocols', museAffinity: ['lex'] },
  { term: 'signal-chain', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'gain-staging', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'bus-routing', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'send-return', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'insert-point', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'signal-to-noise', domain: 'mixing', museAffinity: ['lex', 'hemlock'] },
  { term: 'dynamic-range', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'headroom', domain: 'mixing', museAffinity: ['lex'] },
  { term: 'clipping', domain: 'mixing', museAffinity: ['lex'] },
  // Hemlock — quality & standards
  { term: 'aes-standard', domain: 'protocols', museAffinity: ['hemlock'] },
  { term: 'midi-specification', domain: 'protocols', museAffinity: ['hemlock'] },
  { term: 'nyquist-theorem', domain: 'acoustics', museAffinity: ['hemlock'] },
  { term: 'iso-226', domain: 'acoustics', museAffinity: ['hemlock'] },
  { term: 'frequency-analysis', domain: 'acoustics', museAffinity: ['hemlock'] },
  { term: 'spectrum', domain: 'acoustics', museAffinity: ['hemlock', 'sam'] },
  { term: 'decibel', domain: 'acoustics', museAffinity: ['hemlock'] },
  { term: 'rms-level', domain: 'mixing', museAffinity: ['hemlock'] },
  { term: 'peak-level', domain: 'mixing', museAffinity: ['hemlock'] },
  { term: 'impedance-matching', domain: 'mixing', museAffinity: ['hemlock'] },
  { term: 'phase-coherence', domain: 'acoustics', museAffinity: ['hemlock'] },
  { term: 'calibration', domain: 'mixing', museAffinity: ['hemlock'] },
  { term: 'reference-level', domain: 'mixing', museAffinity: ['hemlock'] },
  // Sam — curious exploration
  { term: 'acoustic-treatment', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'room-modes', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'standing-wave', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'resonance', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'psychoacoustics', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'masking', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'cocktail-party-effect', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'binaural', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'waveshaping', domain: 'synthesis', museAffinity: ['sam'] },
  { term: 'granular-synthesis', domain: 'synthesis', museAffinity: ['sam'] },
  { term: 'spectral-analysis', domain: 'acoustics', museAffinity: ['sam'] },
  { term: 'formant', domain: 'acoustics', museAffinity: ['sam'] },
  // Cedar — scribe & oracle
  { term: 'multitrack', domain: 'production', museAffinity: ['cedar'] },
  { term: 'overdub', domain: 'production', museAffinity: ['cedar'] },
  { term: 'tape-saturation', domain: 'production', museAffinity: ['cedar'] },
  { term: 'vinyl-mastering', domain: 'production', museAffinity: ['cedar'] },
  { term: 'phonograph', domain: 'production', museAffinity: ['cedar'] },
  { term: 'magnetophon', domain: 'production', museAffinity: ['cedar'] },
  { term: 'studer', domain: 'production', museAffinity: ['cedar'] },
  { term: 'ampex', domain: 'production', museAffinity: ['cedar'] },
  { term: 'content-addressing', domain: 'protocols', museAffinity: ['cedar'] },
  { term: 'provenance', domain: 'protocols', museAffinity: ['cedar'] },
  { term: 'master-recording', domain: 'production', museAffinity: ['cedar'] },
  // Willow — user interface
  { term: 'fader', domain: 'mixing', museAffinity: ['willow'] },
  { term: 'knob', domain: 'mixing', museAffinity: ['willow'] },
  { term: 'meter', domain: 'mixing', museAffinity: ['willow'] },
  { term: 'waveform-display', domain: 'production', museAffinity: ['willow'] },
  { term: 'spectrum-analyzer', domain: 'mixing', museAffinity: ['willow'] },
  { term: 'equal-loudness', domain: 'acoustics', museAffinity: ['willow'] },
  { term: 'fletcher-munson', domain: 'acoustics', museAffinity: ['willow'] },
  { term: 'monitoring', domain: 'mixing', museAffinity: ['willow'] },
  { term: 'listening-position', domain: 'acoustics', museAffinity: ['willow'] },
  { term: 'first-oscillator', domain: 'synthesis', museAffinity: ['willow'] },
  { term: 'guided-tour', domain: 'culture', museAffinity: ['willow'] },
];

export const audioVocabularyIndex = createMuseVocabularyIndex(audioVocabularyEntries);
