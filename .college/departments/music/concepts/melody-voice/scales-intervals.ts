import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const scalesIntervals: RosettaConcept = {
  id: 'music-scales-intervals',
  name: 'Scales and Intervals',
  domain: 'music',
  description:
    'Scales are ordered sequences of pitches following a pattern of intervals. ' +
    'An interval is the distance between two pitches measured in semitones (half steps). ' +
    'Major scale pattern: W-W-H-W-W-W-H (whole and half steps), creating a bright, happy character. ' +
    'Natural minor scale pattern: W-H-W-W-H-W-W, creating a darker, more melancholy character. ' +
    'Pentatonic scale (5 tones, removing the two "leading" semitone tensions): ' +
    'used globally from Chinese folk music to blues guitar -- the most universally accessible scale. ' +
    'The chromatic scale divides the octave into 12 equal semitones. ' +
    'An octave represents doubling of frequency: A4 = 440 Hz; A5 = 880 Hz. ' +
    'Equal temperament (modern tuning) slightly misattunes all intervals except the octave to ' +
    'allow playing in all keys -- a mathematical compromise. ' +
    'Just intonation uses pure ratios (5:4 for major third) but cannot freely modulate keys.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-waves-sound',
      description: 'Musical intervals are ratios of sound wave frequencies -- physics grounds music theory',
    },
    {
      type: 'dependency',
      targetId: 'music-harmony',
      description: 'Scales and intervals are the building blocks from which chords and harmony are constructed',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
