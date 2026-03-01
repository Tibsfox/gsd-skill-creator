import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Yoga Styles Overview
 *
 * A survey of the five major yoga styles commonly practiced today:
 * Hatha, Vinyasa, Ashtanga, Yin, and Restorative. Each style
 * emphasizes different aspects of the practice.
 */
export const yogaStylesOverview: RosettaConcept = {
  id: 'mb-yoga-styles-overview',
  name: 'Yoga Styles Overview',
  domain: 'mind-body',
  description:
    'Five major yoga styles define the landscape of modern practice, each emphasizing ' +
    'different aspects of the tradition: ' +
    'Hatha yoga is the classical, foundational style. Poses are held for several breaths ' +
    'with emphasis on proper alignment. Pace is slow. Best for beginners learning alignment ' +
    'and the basic vocabulary of poses. ' +
    'Vinyasa yoga links breath to movement in a flowing sequence. Pace is moderate to fast. ' +
    'Builds heat and has a cardiovascular component. The Sun Salutation is the signature ' +
    'vinyasa sequence. ' +
    'Ashtanga yoga follows a fixed sequence of poses performed in the same order every session. ' +
    'Pace is fast and physically demanding. Requires discipline and consistency -- the same ' +
    'sequence is practiced daily, building depth through repetition rather than variety. ' +
    'Developed by K. Pattabhi Jois in the tradition of T. Krishnamacharya. ' +
    'Yin yoga holds passive poses for 3-5 minutes, targeting connective tissue (fascia, ' +
    'ligaments, joints) rather than muscles. Pace is very slow. Uses gravity rather than ' +
    'muscular effort. Best for flexibility and meditative stillness. ' +
    'Restorative yoga uses props (bolsters, blankets, blocks) to support the body in ' +
    'passive poses held for 5-20 minutes. Pace is very slow. Designed for recovery, ' +
    'stress relief, and deep relaxation. Typically only 4-6 poses per session. ' +
    'All five styles share the same foundation poses but apply them differently. A balanced ' +
    'practice often draws from multiple styles depending on the day and the practitioner\'s needs. ' +
    'From the Vedic/Yoga Tradition (Indian subcontinent, c. 1500 BCE -- present).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-sun-salutation',
      description: 'The Sun Salutation is the signature sequence of Vinyasa style and appears in Hatha and Ashtanga as well',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-breath-movement-linking',
      description: 'Vinyasa and Ashtanga styles are defined by breath-movement coordination; Yin and Restorative emphasize stillness instead',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.16 + 0.25),
    angle: Math.atan2(0.5, 0.4),
  },
};
