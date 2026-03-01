import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Single Leg Stretch
 *
 * A core stability exercise with reciprocal leg movement -- trains
 * the ability to maintain a stable center while the limbs move
 * independently.
 */
export const singleLegStretch: RosettaConcept = {
  id: 'mb-pilates-single-leg-stretch',
  name: 'Single Leg Stretch',
  domain: 'mind-body',
  description:
    'The Single Leg Stretch is a core stability exercise that trains the ability to maintain ' +
    'a stable center while the limbs move independently. Lie on the back, curl head and ' +
    'shoulders up (Powerhouse engaged). Pull one knee to the chest with both hands while ' +
    'extending the other leg at 45 degrees from the floor. Switch legs rhythmically, ' +
    'coordinating the movement with breath. ' +
    'This exercise builds core stability with reciprocal leg movement -- the pelvis must ' +
    'remain stable while the legs alternate. It also develops coordination between upper and ' +
    'lower body. ' +
    'Beginner modification: extend the straight leg higher (toward the ceiling rather than 45 ' +
    'degrees) to reduce abdominal load. Keep the head down on the mat if neck fatigue occurs. ' +
    'Ensure the lower back maintains contact with the mat -- if the back arches, raise the ' +
    'extended leg higher. Maintain neutral spine alignment throughout. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'Single Leg Stretch requires continuous Powerhouse activation to stabilize the pelvis during reciprocal leg movement',
    },
    {
      type: 'analogy',
      targetId: 'mb-pilates-double-leg-stretch',
      description: 'Single Leg Stretch isolates each leg independently while Double Leg Stretch moves both legs together -- both train core stability',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};
