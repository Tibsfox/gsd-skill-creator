import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Side Kick Series
 *
 * A lateral stabilization series performed lying on the side,
 * strengthening the hip abductors, adductors, and obliques.
 */
export const sideKickSeries: RosettaConcept = {
  id: 'mb-pilates-side-kick-series',
  name: 'Side Kick Series',
  domain: 'mind-body',
  description:
    'The Side Kick Series is a collection of lateral exercises performed lying on one side, ' +
    'strengthening the hip abductors, adductors, and obliques while training pelvic stability ' +
    'in a new orientation. The basic series includes: ' +
    'Front/Back Kick -- swing the top leg forward (kick) and back (sweep) while the torso ' +
    'remains perfectly still. The challenge is to move the leg without rocking the pelvis. ' +
    'Up/Down -- lift the top leg toward the ceiling and lower it with control, working the ' +
    'outer hip (abductors). ' +
    'Small Circles -- small circular movements with the top leg, engaging the deep hip ' +
    'rotators and stabilizers. ' +
    'Inner Thigh Lift -- the bottom leg lifts toward the ceiling, working the inner thigh ' +
    '(adductors) while the top leg supports from above. ' +
    'The Side Kick Series develops hip strength and stability in the frontal plane -- a ' +
    'direction of movement often neglected in daily life and sagittal-plane-dominant exercise. ' +
    'Strong hip abductors and adductors are essential for walking, single-leg balance, and ' +
    'preventing knee valgus (inward collapse). ' +
    'Beginner modification: bend the bottom leg for a wider base of support; rest the head ' +
    'on the arm rather than propping it up; reduce the range of leg movement. Maintain ' +
    'Powerhouse engagement to prevent the torso from rocking. ' +
    'Developed by Joseph Pilates as part of the classical mat sequence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-pilates-powerhouse',
      description: 'Side Kick Series requires Powerhouse activation to stabilize the torso while the legs move in the frontal plane',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-rehab-applications',
      description: 'The Side Kick Series directly targets weak gluteal muscles -- a common rehabilitation target for desk workers',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
