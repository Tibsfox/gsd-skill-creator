import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Self-Massage and Myofascial Release
 *
 * Simple self-care techniques using hands, tennis balls, and foam rollers
 * to release muscular tension and improve tissue mobility. Particularly
 * relevant for desk workers experiencing tension in wrists, forearms,
 * upper back, and neck.
 *
 * Evidence basis: Foam rolling and self-myofascial release are widely used
 * in sports medicine and rehabilitation. Research supports short-term
 * improvements in range of motion and reduction in delayed-onset muscle
 * soreness (DOMS).
 *
 * @module departments/mind-body/concepts/relaxation/myofascial-release
 */

export const myofascialRelease: RosettaConcept = {
  id: 'mb-relax-myofascial',
  name: 'Self-Massage and Myofascial Release',
  domain: 'mind-body',
  description:
    'Self-myofascial release uses simple tools -- hands, tennis balls, and foam rollers -- ' +
    'to apply sustained pressure to tight or restricted soft tissue, improving mobility and ' +
    'reducing muscular tension. Key areas for desk workers and keyboard users include: feet ' +
    '(roll over a tennis ball, pausing on tender spots), calves and IT band (slow foam ' +
    'rolling along muscle length), upper back (tennis ball between shoulder blades and wall, ' +
    'lean and roll), neck (gentle hand pressure on suboccipital muscles at the base of the ' +
    'skull), and forearms and hands (roll on desk surface with tennis ball -- especially ' +
    'important for those spending long hours at a keyboard). The technique works by ' +
    'stimulating mechanoreceptors in fascia and muscle, which can reduce muscle tone and ' +
    'improve local blood flow. Research supports short-term improvements in range of motion ' +
    'and reduction in delayed-onset muscle soreness (DOMS) following exercise. Apply slow, ' +
    'sustained pressure (30-60 seconds per area) rather than rapid rolling. Discomfort is ' +
    'normal; sharp pain is not -- back off if it hurts. This overview covers basic self-care ' +
    'techniques; clinical myofascial release therapy involves specialized training and ' +
    'hands-on treatment by qualified practitioners.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-relax-stretching',
      description:
        'Myofascial release and stretching are complementary recovery strategies -- release tight tissue first, then stretch for range of motion',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-relax-nervous-system',
      description:
        'Sustained pressure from myofascial release can activate the parasympathetic nervous system through mechanoreceptor stimulation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-poses',
      description:
        'Myofascial release supports yoga and movement practices by improving tissue mobility before or after sessions',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-pilates-foundation',
      description:
        'Foam rolling is commonly paired with Pilates practice for pre-session tissue preparation',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.3,
    magnitude: Math.sqrt(0.64 + 0.09),
    angle: Math.atan2(-0.3, 0.8),
  },
};
