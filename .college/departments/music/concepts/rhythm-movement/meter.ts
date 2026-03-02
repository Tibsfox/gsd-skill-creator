import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const meter: RosettaConcept = {
  id: 'music-meter',
  name: 'Meter',
  domain: 'music',
  description:
    'Meter (time signature) groups beats into recurring measures with predictable accent patterns. ' +
    'The time signature has two numbers: the top number shows how many beats per measure; ' +
    'the bottom shows which note value equals one beat. ' +
    '4/4 (common time): 4 quarter note beats per measure; most prevalent in Western popular music. ' +
    '3/4 (waltz time): 3 beats per measure; characteristic strong-weak-weak feel. ' +
    '6/8: 6 eighth note beats, but felt as 2 compound beats (each beat = 3 eighth notes); ' +
    'characteristic lilting compound feel. ' +
    'Simple meters divide each beat into 2 (2/4, 3/4, 4/4). ' +
    'Compound meters divide each beat into 3 (6/8, 9/8, 12/8). ' +
    'Asymmetric meters have irregular groupings: 5/4 (3+2 or 2+3), 7/8 -- common in Balkan, ' +
    'Indian, and progressive music. Dave Brubeck\'s "Take Five" popularized 5/4 jazz.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'music-rhythm',
      description: 'Meter provides the organizing framework within which rhythmic patterns function',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.25 + 0.09),
    angle: Math.atan2(0.3, 0.5),
  },
};
