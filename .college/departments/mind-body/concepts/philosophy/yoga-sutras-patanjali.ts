import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Yoga Sutras of Patanjali -- The Eight Limbs
 *
 * The classical framework of yoga as a comprehensive system of practice,
 * of which physical postures (asana) are only one of eight components.
 *
 * Key source: Patanjali, Yoga Sutras (c. 200 BCE - 200 CE)
 *
 * This module teaches the philosophical framework as context for
 * physical practice, not as religious instruction. The Vedic/Yoga
 * tradition is practiced by hundreds of millions worldwide.
 *
 * @module departments/mind-body/concepts/philosophy/yoga-sutras-patanjali
 */

export const yogaSutrasPatanjali: RosettaConcept = {
  id: 'mb-phil-yoga-sutras',
  name: 'Yoga Sutras of Patanjali',
  domain: 'mind-body',
  description:
    'The Yoga Sutras of Patanjali (c. 200 BCE - 200 CE) codify yoga as a system of eight ' +
    'interconnected limbs (Ashtanga), of which physical postures are only one component. ' +
    'The eight limbs are: (1) Yama -- ethical restraints (non-violence, truthfulness, ' +
    'non-stealing, moderation, non-possessiveness); (2) Niyama -- personal observances ' +
    '(cleanliness, contentment, discipline, self-study, surrender); (3) Asana -- physical ' +
    'postures; (4) Pranayama -- breath control; (5) Pratyahara -- withdrawal of senses; ' +
    '(6) Dharana -- concentration; (7) Dhyana -- meditation; (8) Samadhi -- absorption or ' +
    'integration. The physical postures that most people in the West know as "yoga" are ' +
    'limb three of eight -- a foundation for the deeper practices of breath, concentration, ' +
    'and meditation rather than an end in themselves. This framework is presented as context ' +
    'for understanding yoga as a comprehensive system, not as a requirement. A practitioner ' +
    'can benefit from asana practice alone, while knowing that the tradition offers a much ' +
    'broader path. This module teaches the Yoga Sutras as a philosophical framework, not as ' +
    'religious instruction. The Vedic/Yoga tradition is a living tradition practiced by ' +
    'hundreds of millions of people worldwide -- this summary necessarily condenses ' +
    'thousands of years of commentary and interpretation.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-poses',
      description:
        'Asana (physical postures) is the third limb of the eight-limbed yoga system described in the Sutras',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-pranayama',
      description:
        'Pranayama (breath control) is the fourth limb -- breath practice is integral to the full yoga framework',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-concentration',
      description:
        'Dharana (concentration) and Dhyana (meditation) are limbs six and seven of the yoga system',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-mindfulness-daily',
      description:
        'The ethical limbs (Yama and Niyama) extend practice beyond the mat into daily conduct',
    },
  ],
  complexPlanePosition: {
    real: -0.1,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.01 + 0.36),
    angle: Math.atan2(0.6, -0.1),
  },
};
