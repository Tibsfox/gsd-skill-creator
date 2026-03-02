import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const harmony: RosettaConcept = {
  id: 'music-harmony',
  name: 'Harmony',
  domain: 'music',
  description:
    'Harmony is the combination of simultaneously sounded pitches to create chords and ' +
    'the progression of those chords through time. A triad (three-note chord) stacks thirds: ' +
    'major triad = root + major third + perfect fifth (bright, stable). ' +
    'Minor triad = root + minor third + perfect fifth (darker). ' +
    'The I-IV-V-I progression (tonic-subdominant-dominant-tonic) underlies blues, folk, and ' +
    'much of Western popular music. The V chord creates tension that resolves back to I -- ' +
    'the fundamental drive of tonal music. ' +
    'The I-V-vi-IV progression (C-G-Am-F in C major) underlies hundreds of pop songs from ' +
    '"Let It Be" to "Don\'t Stop Believin\'." ' +
    'Counterpoint is the combination of independent melodic lines that create harmony through ' +
    'their interaction -- Bach\'s fugues are the pinnacle. ' +
    'Extended chords (sevenths, ninths, elevenths) add color: jazz primarily uses seventh chords ' +
    '(dominant 7th = major triad + minor seventh = the blues sound).',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-scales-intervals',
      description: 'Chords are built from intervals within scales',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, 0.6),
  },
};
