import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const rhythm: RosettaConcept = {
  id: 'music-rhythm',
  name: 'Rhythm',
  domain: 'music',
  description:
    'Rhythm is the pattern of sounds and silences organized in time. The pulse (beat) is the ' +
    'steady underlying unit; rhythm is the pattern of sounds relative to that pulse. ' +
    'Meter groups pulses into recurring patterns with accents: duple meter (2/4) accents beat 1; ' +
    'triple meter (3/4) accents beat 1 of 3; quadruple meter (4/4) accents beats 1 and 3. ' +
    'Note values: whole note (4 beats), half note (2), quarter note (1), eighth note (1/2), ' +
    'sixteenth note (1/4). Rests have equal time values. Dotted notes extend duration by half. ' +
    'Syncopation accents the normally unaccented: jazz, funk, and Afro-Cuban music rely on it. ' +
    'Polyrhythm layers two or more conflicting rhythms simultaneously (3 against 2 is common). ' +
    'The mathematical relationship between note values is a direct application of fractions -- ' +
    'rhythm is mathematics made audible.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-fractions',
      description: 'Note values and time signatures are direct applications of fraction arithmetic',
    },
    {
      type: 'dependency',
      targetId: 'music-meter',
      description: 'Meter organizes rhythm into recurring grouped patterns with accents',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.36 + 0.04),
    angle: Math.atan2(0.2, 0.6),
  },
};
