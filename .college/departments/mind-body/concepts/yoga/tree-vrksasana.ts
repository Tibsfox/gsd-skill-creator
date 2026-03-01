import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Tree Pose / Vrksasana
 *
 * A standing balance pose that develops proprioception and
 * single-leg stability through focused attention.
 *
 * Sanskrit: Vrksasana (tree pose) -- vrksa = tree, asana = pose.
 */
export const treeVrksasana: RosettaConcept = {
  id: 'mb-yoga-tree-vrksasana',
  name: 'Tree Pose (Vrksasana)',
  domain: 'mind-body',
  description:
    'Vrksasana (tree pose) is a foundational balance posture. From Mountain Pose (Tadasana), ' +
    'shift weight to one foot. Place the opposite foot on the inner calf or inner thigh -- ' +
    'never on the knee joint. Hands at heart center, or arms reaching overhead. Find a fixed ' +
    'point to gaze at (drishti) for balance. Hold 5-10 breaths each side. ' +
    'Tree pose teaches balance, proprioception, and single-leg stability. The wobbling is ' +
    'the practice -- balance is not stillness but constant micro-adjustment. ' +
    'Safety modifications: place toes on the ground with heel against the ankle for a more ' +
    'stable base; use a hand on a wall for support; practice near a doorframe or corner. ' +
    'Common mistakes: placing the foot directly on the knee (risks lateral knee stress), ' +
    'holding the breath, or tensing the standing leg so hard that balance becomes rigid. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Vrksasana -- vrksa = tree.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-yoga-mountain-tadasana',
      description: 'Tree pose begins from Tadasana and uses the same alignment principles for the standing leg',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Steady diaphragmatic breathing is essential for maintaining balance in tree pose',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.36 + 0.09),
    angle: Math.atan2(0.3, 0.6),
  },
};
