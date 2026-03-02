import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const muscularStrength: RosettaConcept = {
  id: 'pe-muscular-strength',
  name: 'Muscular Strength',
  domain: 'physical-education',
  description:
    'Muscular strength is the maximum force a muscle or muscle group can generate in a single ' +
    'maximal effort. Training for strength uses the principle of progressive overload: gradually ' +
    'increasing resistance beyond what the body is accustomed to, forcing adaptation. Compound ' +
    'movements (squat, deadlift, bench press, pull-up) recruit multiple muscle groups and allow ' +
    'heavier loads than isolation exercises. Muscle adaptation occurs through neural factors ' +
    '(improved motor unit recruitment) in early training and hypertrophy (increased muscle fiber ' +
    'cross-sectional area) over time. Rest and recovery are essential: muscle protein synthesis ' +
    'peaks 24-48 hours post-exercise; training the same muscle group before it recovers causes ' +
    'overtraining. Relative strength (force per unit body mass) is often more relevant than ' +
    'absolute strength for athletic performance and daily function. Strength training also ' +
    'improves bone density, resting metabolism, and injury resistance.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-fitness-training',
      description: 'Muscular strength training is a specialized component of the broader fitness training framework',
    },
    {
      type: 'analogy',
      targetId: 'pe-cardiovascular-fitness',
      description: 'Both muscular strength and cardiovascular fitness require progressive overload and recovery for adaptation',
    },
  ],
  complexPlanePosition: {
    real: 0.75,
    imaginary: 0.25,
    magnitude: Math.sqrt(0.5625 + 0.0625),
    angle: Math.atan2(0.25, 0.75),
  },
};
