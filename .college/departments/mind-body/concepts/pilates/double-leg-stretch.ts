import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Double Leg Stretch
 *
 * A full-body coordination exercise extending both arms and legs
 * simultaneously, then drawing them back to center -- building
 * the ability to maintain core stability through a larger range
 * of motion.
 */
export const doubleLegStretch: RosettaConcept = {
  id: 'mb-pilates-double-leg-stretch',
  name: 'Double Leg Stretch',
  domain: 'mind-body',
  description:
    'The Double Leg Stretch is a full-body coordination exercise that extends the challenge of ' +
    'core stability through a larger range of motion. Begin lying on the back, knees pulled to ' +
    'chest, hands on shins, head and shoulders curled up. Inhale: simultaneously extend both ' +
    'arms overhead and both legs forward at 45 degrees, creating a long line from fingertips ' +
    'to toes. Exhale: circle the arms out and around while drawing the knees back to the chest. ' +
    'The Powerhouse must maintain the curl position throughout -- the torso does not move; ' +
    'only the arms and legs extend and return. This teaches the body to stabilize the center ' +
    'while the extremities move through space. ' +
    'Beginner modification: extend the legs toward the ceiling (higher angle) to reduce ' +
    'abdominal demand; keep the arms reaching forward rather than overhead; rest the head down ' +
    'between repetitions. Maintain neutral spine -- if the lower back lifts off the mat, the ' +
    'legs are extending too low. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'Double Leg Stretch demands sustained Powerhouse activation as both arms and legs extend away from center simultaneously',
    },
    {
      type: 'analogy',
      targetId: 'mb-pilates-single-leg-stretch',
      description: 'Single Leg Stretch isolates each leg while Double Leg Stretch extends both -- progressing from unilateral to bilateral challenge',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
