import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Sun Salutation / Surya Namaskar
 *
 * The foundational linking sequence connecting breath to movement
 * in a continuous 12-position flow. Each movement corresponds to
 * either an inhale or an exhale.
 *
 * Sanskrit: Surya Namaskar (sun salutation) --
 * surya = sun, namaskar = greeting/salutation.
 */
export const sunSalutation: RosettaConcept = {
  id: 'mb-yoga-sun-salutation',
  name: 'Sun Salutation (Surya Namaskar)',
  domain: 'mind-body',
  description:
    'Surya Namaskar (sun salutation) is the foundational linking sequence in vinyasa yoga, ' +
    'connecting breath to movement in a continuous 12-position flow. Each movement corresponds ' +
    'to either an inhale (opening, expanding) or an exhale (folding, contracting). ' +
    'The 12 positions: (1) Mountain Pose -- stand tall, hands at heart (exhale). ' +
    '(2) Upward Salute -- inhale, arms overhead, slight backbend. ' +
    '(3) Forward Fold -- exhale, fold forward. ' +
    '(4) Halfway Lift -- inhale, flat back, fingertips on shins. ' +
    '(5) Plank -- exhale or step back, hold plank position. ' +
    '(6) Low Plank (Chaturanga) -- lower halfway down (exhale), or modified knees-chest-chin. ' +
    '(7) Upward-Facing Dog or Cobra -- inhale, chest forward and up. ' +
    '(8) Downward-Facing Dog -- exhale, press hips up and back, hold 5 breaths. ' +
    '(9) Step or jump forward -- inhale, return to halfway lift. ' +
    '(10) Forward Fold -- exhale. ' +
    '(11) Upward Salute -- inhale, rise to standing, arms overhead. ' +
    '(12) Mountain Pose -- exhale, hands to heart. ' +
    'Safety modifications: replace Chaturanga with knees-chest-chin for wrist or shoulder ' +
    'sensitivity; use Cobra instead of Upward Dog for lower back protection; step rather than ' +
    'jump between positions. Move at your own pace -- speed is not the goal, breath-movement ' +
    'coordination is. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Surya Namaskar -- surya = sun, namaskar = salutation.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-yoga-breath-movement-linking',
      description: 'Sun Salutation is the primary embodiment of the vinyasa principle -- each position is linked to inhale or exhale',
    },
    {
      type: 'dependency',
      targetId: 'mb-yoga-mountain-tadasana',
      description: 'Mountain Pose is both the starting and ending position of the Sun Salutation',
    },
    {
      type: 'dependency',
      targetId: 'mb-yoga-downward-dog',
      description: 'Downward Dog is position 8 and the longest hold in the sequence',
    },
    {
      type: 'dependency',
      targetId: 'mb-yoga-forward-fold',
      description: 'Forward Fold appears twice in the sequence (positions 3 and 10)',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-ujjayi',
      description: 'Ujjayi breath is traditionally used throughout Sun Salutation to maintain breath awareness during movement',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.36 + 0.16),
    angle: Math.atan2(0.4, 0.6),
  },
};
