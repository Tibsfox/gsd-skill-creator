import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Child's Pose / Balasana
 *
 * A resting pose that provides spinal decompression and calming.
 * The universal "safe harbor" -- anytime a pose feels too intense,
 * return to Child's Pose.
 *
 * Sanskrit: Balasana (child's pose) -- bala = child, asana = pose.
 */
export const childsPoseBalasana: RosettaConcept = {
  id: 'mb-yoga-childs-pose-balasana',
  name: "Child's Pose (Balasana)",
  domain: 'mind-body',
  description:
    'Balasana (child\'s pose) is the go-to resting position in yoga practice. Kneel on the ' +
    'floor, big toes touching, knees hip-width or wider. Fold forward, extending arms in ' +
    'front or alongside the body. Forehead rests on the floor (or on a folded blanket or ' +
    'block). Hold for 5-10 breaths or longer -- this is a resting pose with no time limit. ' +
    'Balasana teaches surrender, provides spinal decompression, and activates the calming ' +
    'parasympathetic nervous system. It is the universal safe position: anytime a pose feels ' +
    'too intense, return to Child\'s Pose. This is not failure -- it is skillful self-awareness. ' +
    'Safety modifications: place a blanket between calves and thighs if knees are sensitive; ' +
    'widen the knees to make room for the belly; use a bolster or pillow under the chest for ' +
    'supported rest; keep the arms alongside the body rather than extended for shoulder relief. ' +
    'Common mistakes: forcing the forehead to the floor when the body resists, or rushing ' +
    'through it instead of using it as genuine rest. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Balasana -- bala = child.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-corpse-savasana',
      description: 'Both Balasana and Savasana are restorative poses that emphasize relaxation and integration',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description: 'The folded position in Balasana naturally encourages diaphragmatic breathing into the back body',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.64 + 0.01),
    angle: Math.atan2(0.1, 0.8),
  },
};
