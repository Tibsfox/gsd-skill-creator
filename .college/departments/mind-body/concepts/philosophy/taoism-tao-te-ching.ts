import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Taoism and the Tao Te Ching
 *
 * The philosophical tradition of the Way (\u9053, Dao), wu wei (\u7121\u70BA,
 * non-action), and harmony with natural patterns. Foundational to tai chi,
 * qigong, and the soft principle in martial arts.
 *
 * Key source: Laozi, Tao Te Ching (c. 4th century BCE)
 *
 * This module teaches philosophical techniques and concepts, not
 * religious practice. Taoism is a living tradition with both
 * philosophical and religious dimensions practiced by millions.
 *
 * @module departments/mind-body/concepts/philosophy/taoism-tao-te-ching
 */

export const taoismTaoTeChing: RosettaConcept = {
  id: 'mb-phil-taoism',
  name: 'Taoism and the Tao Te Ching',
  domain: 'mind-body',
  description:
    'Taoism centers on \u9053 (Dao, "the Way") -- the fundamental, indescribable ' +
    'principle underlying all of reality. The Tao Te Ching, attributed to Laozi (c. 4th ' +
    'century BCE), expresses this through paradox and metaphor: "The Tao that can be told ' +
    'is not the eternal Tao." Its most practical teaching is \u7121\u70BA (wu wei, ' +
    '"non-action" or "effortless action") -- not passivity but acting without forcing, ' +
    'like water flowing around a rock rather than through it. Water is the central metaphor: ' +
    'it is the softest substance yet wears away the hardest stone; it always seeks the ' +
    'lowest place yet is essential to all life. This soft principle profoundly influences ' +
    'martial arts (yielding to redirect force rather than meeting it head-on), tai chi ' +
    '(continuous flowing movement), and daily life (working with circumstances rather than ' +
    'against them). The Taoist concept of yin-yang (\u9670\u967D) describes complementary ' +
    'opposites in dynamic balance -- not good versus evil but interdependent forces like ' +
    'action and rest, tension and release, effort and surrender. This module teaches Taoist ' +
    'philosophy as a practical framework for movement and life, not as religious instruction. ' +
    'Taoism is a living tradition with both philosophical and religious dimensions, practiced ' +
    'by millions worldwide -- this presentation necessarily simplifies a vast and ancient ' +
    'tradition.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tai-chi-principles',
      description:
        'Tai chi is a direct physical expression of Taoist principles -- wu wei manifests as relaxed, flowing movement',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-zen',
      description:
        'Chan/Zen Buddhism integrated Taoist concepts of naturalness into its practice tradition',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-martial-virtues',
      description:
        'Taoist philosophy informs the "soft" or "internal" martial arts tradition emphasizing yielding over force',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-nervous-system',
      description:
        'The Taoist principle of dynamic balance between action and rest parallels the sympathetic/parasympathetic interplay',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.09 + 0.64),
    angle: Math.atan2(0.8, -0.3),
  },
};
