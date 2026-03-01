import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * The Roll-Up
 *
 * A fundamental Pilates exercise teaching spinal articulation --
 * peeling the spine off the mat one vertebra at a time.
 */
export const rollUp: RosettaConcept = {
  id: 'mb-pilates-roll-up',
  name: 'The Roll-Up',
  domain: 'mind-body',
  description:
    'The Roll-Up is a fundamental Pilates exercise that teaches spinal articulation -- the ' +
    'ability to move the spine one vertebra at a time rather than as a rigid block. Lie flat ' +
    'on the back, arms overhead. Inhale to prepare. Exhale, peel the spine off the mat one ' +
    'vertebra at a time, reaching toward the toes. Inhale at the top of the movement. Exhale, ' +
    'roll back down one vertebra at a time, resisting gravity with the abdominals. ' +
    'The Roll-Up builds abdominal strength, teaches segmental spinal mobility, and develops ' +
    'the control required to resist momentum. It is harder than it appears because it demands ' +
    'that the abdominals do the work rather than hip flexors or momentum. ' +
    'Beginner modification: bend the knees to reduce the lever arm; use a strap or towel ' +
    'behind the thighs for assistance on the way up; perform the exercise as a "roll-down" ' +
    'only (start seated, roll down with control). Maintain Powerhouse engagement and neutral ' +
    'spine awareness throughout. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'The Roll-Up requires Powerhouse engagement to articulate the spine against gravity without using momentum',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-spine-stretch',
      description: 'Both exercises develop spinal flexibility and articulation -- the Roll-Up while supine, the Spine Stretch while seated',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
