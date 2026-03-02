import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Spine Stretch Forward
 *
 * A seated forward fold that develops spinal articulation and
 * hamstring flexibility while maintaining Powerhouse engagement.
 * Combined with elements of the Saw for rotational component.
 */
export const spineStretch: RosettaConcept = {
  id: 'mb-pilates-spine-stretch',
  name: 'Spine Stretch Forward',
  domain: 'mind-body',
  description:
    'The Spine Stretch Forward is a seated exercise developing spinal articulation and hamstring ' +
    'flexibility. Sit tall with legs extended wider than hip-width, feet flexed. Arms reach ' +
    'forward at shoulder height. Inhale to lengthen the spine upward. Exhale: round forward ' +
    'from the crown of the head, peeling the spine into a C-curve, reaching past the toes as ' +
    'if curling over a beach ball. Inhale: restack the spine from the base, returning to tall ' +
    'seated position one vertebra at a time. ' +
    'This exercise teaches the same segmental spinal articulation as the Roll-Up but from a ' +
    'seated position, adding gravity resistance in a different orientation. The Saw variation ' +
    'adds rotation: twist the torso toward one leg, then fold forward, reaching the opposite ' +
    'hand past the little toe. This adds an oblique and rotational component. ' +
    'Beginner modification: bend the knees slightly if hamstrings prevent sitting upright; sit ' +
    'on a folded blanket to tilt the pelvis forward; reduce the range of the forward fold. ' +
    'Maintain Powerhouse engagement throughout -- the abdominals draw in as the spine rounds ' +
    'forward. Neutral spine alignment awareness on the return to upright. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'Spine Stretch requires Powerhouse activation to control the spinal articulation through the C-curve',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-forward-fold',
      description: 'Both exercises stretch the posterior chain but with different emphasis -- Pilates focuses on spinal articulation, yoga on release and surrender',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
