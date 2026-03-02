import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const chordProgressions: RosettaConcept = {
  id: 'music-chord-progressions',
  name: 'Chord Progressions',
  domain: 'music',
  description:
    'Chord progressions are sequences of harmonies that create tension, movement, and resolution ' +
    'in music. Roman numeral analysis labels chords by scale degree (I, ii, iii, IV, V, vi, vii°) ' +
    'independent of key, revealing functional relationships. The V→I (dominant to tonic) ' +
    'authentic cadence is the most powerful resolution in tonal music — the tritone between the ' +
    'leading tone and 7th of the dominant resolves inward. Common progressions: I-IV-V-I (blues ' +
    'and folk foundation), I-V-vi-IV (pop\'s most used: "Let It Be," "No Woman No Cry," hundreds ' +
    'more), ii-V-I (jazz cornerstone), I-vi-IV-V (50s doo-wop). Secondary dominants (V/V, V/ii) ' +
    'briefly tonicize non-tonic chords, creating chromatic color. Borrowed chords (modal mixture: ' +
    'iv in a major key, bVII) add emotional color. Understanding progressions allows musicians to ' +
    'predict harmony by ear, communicate efficiently with Roman numerals, and improvise within ' +
    'harmonic structure.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-harmony',
      description: 'Chord progressions apply the harmonic principles of tonal function and voice leading in musical sequences',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.3025 + 0.2025),
    angle: Math.atan2(0.45, 0.55),
  },
};
