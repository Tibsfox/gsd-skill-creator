import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const ensemblePlaying: RosettaConcept = {
  id: 'music-ensemble-playing',
  name: 'Ensemble Playing',
  domain: 'music',
  description:
    'Ensemble playing requires coordinating individual performance within a collective sound. ' +
    'Blend: matching tone quality and articulation style within a section; string sections bow ' +
    'in the same direction for visual and sonic uniformity. Balance: relative loudness between ' +
    'voices — melody should project, accompaniment support without overshadowing; dynamics ' +
    'markings apply differently by role. Intonation: tuning relative to other players in real ' +
    'time — equally-tempered instruments and just-intonation tendency instruments (strings, ' +
    'voices) must adjust to chords. Listening vertically (hearing harmony) and horizontally ' +
    '(hearing the phrase shape ahead) simultaneously is the core ensemble skill. Conducting cues ' +
    'signal tempo, dynamics, cutoffs, and entrances — ensemble members must maintain eye contact ' +
    'with the conductor while reading music. Chamber music (no conductor) requires total mutual ' +
    'listening — tempo changes emerge through breathing and physical gesture among performers. ' +
    'Rehearsal efficiency: productive ensembles isolate problem passages rather than always ' +
    'playing through from the beginning.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-acoustics',
      description: 'Ensemble blend and intonation require understanding acoustic properties of instrument resonance and harmonic spectra',
    },
    {
      type: 'analogy',
      targetId: 'music-instrument-families',
      description: 'Effective ensemble playing requires knowledge of each instrument family\'s strengths, ranges, and timbral characteristics',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
