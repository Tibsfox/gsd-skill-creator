import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const instrumentFamilies: RosettaConcept = {
  id: 'music-instrument-families',
  name: 'Instrument Families',
  domain: 'music',
  description:
    'Musical instruments are classified by how they produce sound. Chordophones (strings): ' +
    'vibrating strings amplified by a resonating body (violin, cello, guitar, piano — the piano ' +
    'is technically a struck chordophone). Aerophones (winds): vibrating air column — woodwinds ' +
    '(clarinet, oboe, flute, saxophone) and brass (trumpet, trombone, French horn, tuba). ' +
    'Membranophones (percussion): vibrating membrane — snare drum, bass drum, timpani. ' +
    'Idiophones: the instrument body itself vibrates — cymbals, marimba, triangle, xylophone. ' +
    'Electrophones: electronic sound generation — synthesizers, electric guitar (without ' +
    'amplifier generates minimal acoustic sound). Orchestral sections correspond to families: ' +
    'string section (largest, bowed), woodwind section, brass section, percussion section. ' +
    'Timbre (tone color) distinguishes instruments in the same register — a violin and oboe ' +
    'playing the same pitch sound different due to harmonic overtone spectra. Orchestration is ' +
    'the art of combining instrument timbres for blend, contrast, and expressive effect.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-acoustics',
      description: 'Instrument families are defined by their acoustic sound production mechanisms',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
