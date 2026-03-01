import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Forward Fold / Uttanasana
 *
 * A standing forward bend that stretches the hamstrings and
 * posterior chain, teaching the concept of hinging at the hips
 * and releasing the neck.
 *
 * Sanskrit: Uttanasana (intense stretch pose) --
 * ut = intense, tan = to stretch, asana = pose.
 */
export const forwardFold: RosettaConcept = {
  id: 'mb-yoga-forward-fold',
  name: 'Forward Fold (Uttanasana)',
  domain: 'mind-body',
  description:
    'Uttanasana (intense stretch pose / forward fold) is a standing forward bend. From ' +
    'Mountain Pose (Tadasana), inhale arms overhead. Exhale, hinge at the hips (not the ' +
    'waist), and fold forward. Hands reach toward the floor, shins, or thighs -- wherever ' +
    'they arrive without forcing. Let the head hang heavy, releasing neck tension. A slight ' +
    'bend in the knees is fine and often preferable for beginners. Hold for 5 breaths. ' +
    'Uttanasana teaches hamstring flexibility, the skill of letting go, and provides a mild ' +
    'inversion effect (head below heart) that calms the nervous system. ' +
    'Safety modifications: generous knee bend for tight hamstrings or lower back sensitivity; ' +
    'hands on blocks to bring the floor closer; hold opposite elbows and sway gently (rag doll ' +
    'variation). Avoid deep forward folds with acute lower back injury, uncontrolled high blood ' +
    'pressure, or glaucoma. ' +
    'Common mistakes: rounding the spine from the waist instead of hinging at the hips, ' +
    'locking the knees, or bouncing to force depth. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Uttanasana -- ut = intense, tan = to stretch.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-yoga-mountain-tadasana',
      description: 'Forward fold begins from Tadasana and returns to Tadasana -- the same neutral alignment principles apply',
    },
    {
      type: 'dependency',
      targetId: 'mb-yoga-sun-salutation',
      description: 'Forward fold appears as positions 3 and 10 in the Sun Salutation sequence',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};
