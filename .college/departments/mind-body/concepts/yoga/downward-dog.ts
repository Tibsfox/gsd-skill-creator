import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Downward-Facing Dog / Adho Mukha Svanasana
 *
 * One of the most recognized yoga poses -- a full-body engagement
 * posture that builds shoulder stability and hamstring/calf flexibility.
 *
 * Sanskrit: Adho Mukha Svanasana (downward-facing dog pose) --
 * adho = downward, mukha = face, svana = dog, asana = pose.
 */
export const downwardDog: RosettaConcept = {
  id: 'mb-yoga-downward-dog',
  name: 'Downward-Facing Dog (Adho Mukha Svanasana)',
  domain: 'mind-body',
  description:
    'Adho Mukha Svanasana (downward-facing dog pose) creates an inverted V shape with the body. ' +
    'From hands and knees: hands shoulder-width apart, knees hip-width. Tuck toes, lift knees ' +
    'off floor, press hips up and back. Heels reach toward the floor but do not need to touch. ' +
    'Fingers spread wide, weight distributed across the entire hand. Head hangs between upper ' +
    'arms, neck relaxed. Hold for 5-10 breaths. This pose teaches full-body engagement, ' +
    'shoulder stability, and hamstring/calf flexibility. It is both a strengthening and ' +
    'resting pose in vinyasa sequences. ' +
    'Safety modifications: bend the knees generously if hamstrings are tight; place hands on ' +
    'blocks or an elevated surface to reduce wrist pressure; keep the head lifted slightly if ' +
    'inversions cause dizziness. Avoid with uncontrolled high blood pressure or glaucoma. ' +
    'Common mistakes: rounding the spine, dumping weight into the wrists, or locking the elbows. ' +
    'From the Vedic/Yoga Tradition. Sanskrit: Adho Mukha Svanasana -- ' +
    'adho = downward, mukha = face, svana = dog.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-yoga-sun-salutation',
      description: 'Downward Dog appears as position 8 in the Sun Salutation and is held for 5 breaths',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-forward-fold',
      description: 'Both poses stretch the posterior chain (hamstrings, calves) and share similar spinal alignment cues',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.49 + 0.04),
    angle: Math.atan2(0.2, 0.7),
  },
};
