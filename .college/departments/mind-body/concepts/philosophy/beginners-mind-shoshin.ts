import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Beginner's Mind (Shoshin) -- The Most Valuable Quality
 *
 * The attitude of openness, curiosity, and lack of preconceptions
 * that makes learning possible at every stage. The pack never
 * graduates the user from beginner -- openness IS the practice.
 *
 * Key source: Shunryu Suzuki, "Zen Mind, Beginner's Mind" (1970)
 * Original term: \u521d\u5fc3 (shoshin, Japanese)
 *
 * This module teaches shoshin as a practical philosophy of learning,
 * not as religious instruction.
 *
 * @module departments/mind-body/concepts/philosophy/beginners-mind-shoshin
 */

export const beginnersMindShoshin: RosettaConcept = {
  id: 'mb-phil-shoshin',
  name: 'Beginner\'s Mind (Shoshin)',
  domain: 'mind-body',
  description:
    '\u521d\u5fc3 (shoshin, "beginner\'s mind") is the quality of approaching any activity ' +
    'with openness, eagerness, and freedom from preconceptions -- regardless of how much ' +
    'experience you have. As Shunryu Suzuki wrote in "Zen Mind, Beginner\'s Mind" (1970): ' +
    '"In the beginner\'s mind there are many possibilities, in the expert\'s mind there ' +
    'are few." This is not anti-expertise -- it is the recognition that expertise can ' +
    'calcify into assumption, and that the willingness to not-know is what keeps learning ' +
    'alive. In the context of mind-body practice, shoshin means approaching each session ' +
    'as if it were the first: noticing what is actually happening in this body, on this ' +
    'day, rather than performing from memory. A practitioner with twenty years of ' +
    'meditation experience who sits with beginner\'s mind is practicing more deeply than ' +
    'one who approaches the cushion as routine. The pack embodies this principle by never ' +
    'graduating the user from beginner status -- there is no "advanced" badge, because ' +
    'openness is the most valuable quality a practitioner can cultivate. Shoshin applies ' +
    'beyond practice: approaching a familiar codebase with fresh eyes, listening to a ' +
    'colleague\'s idea without preemptive judgment, tasting a familiar food as if for the ' +
    'first time. This module teaches shoshin as a practical philosophy of learning and ' +
    'attention, not as religious instruction. The concept originates in the Zen Buddhist ' +
    'tradition, which is a living tradition practiced by millions worldwide -- this ' +
    'simplified presentation of shoshin is a starting point for a practice that deepens ' +
    'over a lifetime.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-phil-zen',
      description:
        'Shoshin is a foundational concept in Zen philosophy -- the attitude that makes all Zen practice possible',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-mindfulness-daily',
      description:
        'Beginner\'s mind is the attitude that makes everyday mindfulness possible -- seeing the familiar as fresh',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-martial-virtues',
      description:
        'Humility -- a core martial virtue across all traditions -- is the practical expression of beginner\'s mind in the training hall',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-mindfulness',
      description:
        'Mindfulness meditation cultivates the non-judgmental awareness that beginner\'s mind describes',
    },
  ],
  complexPlanePosition: {
    real: -0.1,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.01 + 0.25),
    angle: Math.atan2(0.5, -0.1),
  },
};
