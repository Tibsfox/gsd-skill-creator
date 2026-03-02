import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const acoustics: RosettaConcept = {
  id: 'music-acoustics',
  name: 'Acoustics of Instruments',
  domain: 'music',
  description:
    'Musical instruments produce sound through vibrating objects whose frequency determines pitch. ' +
    'String instruments: bowed or plucked strings vibrate; shorter, tighter, or lighter strings vibrate faster ' +
    '(higher pitch). Harmonics series: a string vibrates at its fundamental frequency plus ' +
    'integer multiples (overtones) that determine timbre. ' +
    'Wind instruments: vibrating air columns; woodwinds use a reed (clarinet, saxophone) or ' +
    'a split lip (flute); brass use lip buzzing. Opening holes shortens the effective air column, ' +
    'raising pitch. Valves divert air through additional tubing to lower pitch. ' +
    'Percussion: struck objects vibrate in complex modes. Membranophones (drums) use a stretched skin; ' +
    'idiophones (xylophone, bells) use the vibration of the body itself. ' +
    'The harmonic series explains why certain intervals sound consonant: frequencies with simple ' +
    'integer ratios (2:1 octave, 3:2 perfect fifth) share many overtones. ' +
    'Room acoustics (reverberation time) critically shapes how instruments sound -- ' +
    'concert hall design is applied acoustic physics.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'phys-waves-sound',
      description: 'Musical acoustics is the direct application of wave physics to sound-producing systems',
    },
    {
      type: 'dependency',
      targetId: 'music-scales-intervals',
      description: 'Intervals derive from frequency ratios -- the same physics that determines instrument tuning',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
