import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Mountain Pose / Tadasana
 *
 * The foundational standing pose -- teaches awareness of posture,
 * grounding, and neutral alignment. Every standing pose begins and
 * ends here.
 *
 * From the Vedic/Yoga Tradition (Indian subcontinent, c. 1500 BCE -- present).
 * Sanskrit: Tadasana (mountain pose) -- tada = mountain, asana = pose.
 */
export const mountainTadasana: RosettaConcept = {
  id: 'mb-yoga-mountain-tadasana',
  name: 'Mountain Pose (Tadasana)',
  domain: 'mind-body',
  description:
    'Tadasana (mountain pose) is the foundational standing posture from which all other ' +
    'standing poses originate. Stand with feet together or hip-width apart, weight distributed ' +
    'evenly across both feet. Legs active, kneecaps slightly lifted but not locked. Pelvis ' +
    'neutral -- neither tucked nor arched. Shoulders roll back and down, arms at sides with ' +
    'palms forward. Crown of head reaches toward the ceiling. Hold for 5-10 breaths. ' +
    'Tadasana teaches awareness of posture, grounding, and neutral alignment -- the reference ' +
    'point for every other pose. ' +
    'Safety modifications: feet wider apart for better balance; stand near a wall for ' +
    'proprioceptive feedback; avoid locking the knees. ' +
    'Common mistakes: leaning forward or back, hyperextending the knees, lifting the shoulders ' +
    'toward the ears, or collapsing the arches of the feet. ' +
    'From the Vedic/Yoga Tradition (Indian subcontinent). Sanskrit: Tadasana -- ' +
    'tada means mountain, asana means pose.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-yoga-sun-salutation',
      description: 'Mountain pose is the starting and ending position of the Sun Salutation sequence',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-neutral-spine',
      description: 'Both Tadasana and Pilates neutral spine alignment emphasize natural spinal curves and balanced posture',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.64 + 0.01),
    angle: Math.atan2(0.1, 0.8),
  },
};
