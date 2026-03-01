import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Zen Philosophy -- Direct Experience and Beginner's Mind
 *
 * Zen emphasizes direct experience over scripture, beginner's mind
 * (shoshin) over expertise, and practice over theory. This module
 * teaches philosophical techniques and concepts, not religious practice.
 *
 * Key source: Shunryu Suzuki, "Zen Mind, Beginner's Mind" (1970)
 *
 * This is a living tradition practiced by millions worldwide. The
 * simplified presentation here is a doorway, not a destination.
 *
 * @module departments/mind-body/concepts/philosophy/zen-philosophy
 */

export const zenPhilosophy: RosettaConcept = {
  id: 'mb-phil-zen',
  name: 'Zen Philosophy',
  domain: 'mind-body',
  description:
    'Zen is a tradition of direct experience -- understanding through practice rather ' +
    'than scripture study or intellectual analysis. Its central teaching method uses koans ' +
    '(paradoxical questions such as "What is the sound of one hand clapping?") not as ' +
    'riddles to solve but as tools to break the habit of thinking-as-solving and open ' +
    'awareness to direct perception. The concept of shoshin -- ' +
    '\u521d\u5fc3 (beginner\'s mind) -- is foundational: as Shunryu Suzuki wrote in ' +
    '"Zen Mind, Beginner\'s Mind" (1970), "In the beginner\'s mind there are many ' +
    'possibilities, in the expert\'s mind there are few." Zen mind is the quality of ' +
    'disappearing into work -- complete absorption without self-conscious separation ' +
    'between doer and doing. In Chan/Zen Buddhism (originating in China around the 6th ' +
    'century CE, spreading to Japan, Korea, and Vietnam), this state is cultivated through ' +
    'zazen (seated meditation), kinhin (walking meditation), and the integration of ' +
    'awareness into daily activities. This module teaches Zen as a philosophical framework ' +
    'and set of attention practices, not as religious instruction. Zen is a living tradition ' +
    'practiced by millions worldwide -- this simplified presentation loses the depth that ' +
    'comes from sustained practice with a qualified teacher in a community (sangha).',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-phil-shoshin',
      description:
        'Shoshin (beginner\'s mind) is a core Zen concept -- the attitude of openness and curiosity regardless of experience level',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-zazen',
      description:
        'Zazen (just sitting) is the primary meditation practice of the Zen tradition',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-mindfulness-daily',
      description:
        'Zen philosophy grounds the practice of bringing meditation awareness into everyday activities',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-taoism',
      description:
        'Zen and Taoism share historical roots in Chinese philosophy -- Chan Buddhism integrated Taoist concepts of naturalness and wu wei',
    },
  ],
  complexPlanePosition: {
    real: -0.2,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.04 + 0.49),
    angle: Math.atan2(0.7, -0.2),
  },
};
