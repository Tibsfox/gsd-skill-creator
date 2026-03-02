import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const syncopation: RosettaConcept = {
  id: 'music-syncopation',
  name: 'Syncopation',
  domain: 'music',
  description:
    'Syncopation places rhythmic emphasis on normally weak beats or the weak parts of beats, ' +
    'creating the "offbeat" feel characteristic of jazz, funk, Latin, and pop music. In common ' +
    'time (4/4), the strong beats are 1 and 3; the weak beats are 2 and 4. Syncopation stresses ' +
    '2 and 4 (backbeat in rock and jazz), the "and" subdivisions between beats (eighth-note ' +
    'syncopation), or creates ties across barlines that displace metric accent. Anticipation: ' +
    'placing a note slightly before its expected position, pulling the phrase forward. Hemiola: ' +
    'a 3-against-2 rhythmic displacement creating the sense of two meters simultaneously — ' +
    'common in African music and Afro-Cuban styles. Jazz swing feel: eighth notes are played ' +
    'as a long-short triplet subdivision rather than equal eighths, creating a lilting forward ' +
    'motion. Syncopation creates energy and interest by playing against listener metric expectations — ' +
    'the tension between the implied steady beat and the displaced accent is the source of groove.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-rhythm',
      description: 'Syncopation is a rhythmic technique that subverts the regular metric patterns established in rhythm fundamentals',
    },
    {
      type: 'analogy',
      targetId: 'music-meter',
      description: 'Syncopation is defined relative to the regular beat grid established by meter — without a metric framework, there is no syncopation',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
