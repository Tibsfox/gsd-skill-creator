import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Corpse Pose / Savasana
 *
 * The final resting pose -- often described as the hardest pose in
 * yoga because doing nothing is surprisingly difficult. Teaches
 * complete relaxation and integration of practice.
 *
 * Sanskrit: Savasana (corpse pose) -- sava = corpse, asana = pose.
 */
export const corpseSavasana: RosettaConcept = {
  id: 'mb-yoga-corpse-savasana',
  name: 'Corpse Pose (Savasana)',
  domain: 'mind-body',
  description:
    'Savasana (corpse pose) is the final resting posture of every yoga practice. Lie flat on ' +
    'the back. Legs extended, feet fall naturally apart. Arms at sides, palms facing up. Close ' +
    'the eyes. Release all muscular effort -- let the floor support the entire body. Hold for ' +
    '5-15 minutes at the end of practice. ' +
    'Savasana is often described as the hardest pose in yoga -- doing nothing is surprisingly ' +
    'difficult. The mind wants to plan, review, fidget. The practice is to notice these ' +
    'impulses and let them pass without acting. This teaches complete relaxation and allows ' +
    'the body to integrate the physical and neurological effects of the preceding practice. ' +
    'Safety modifications: place a bolster or rolled blanket under the knees to relieve lower ' +
    'back pressure; cover the body with a blanket for warmth (body temperature drops during ' +
    'stillness); use an eye pillow for deeper relaxation. Avoid if lying flat causes discomfort ' +
    '-- a reclined seated position works as well. ' +
    'Common mistakes: skipping Savasana entirely, checking the phone, or treating it as optional. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Savasana -- sava = corpse.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-relaxation-pmr',
      description: 'Savasana and Progressive Muscle Relaxation both produce deep physical relaxation through conscious release of tension',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-childs-pose-balasana',
      description: 'Both are restorative poses -- Balasana during practice, Savasana to close practice',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.64 + 0.01),
    angle: Math.atan2(0.1, 0.8),
  },
};
