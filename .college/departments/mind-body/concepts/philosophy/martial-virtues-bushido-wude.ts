import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Martial Virtues -- Bushido, Wude, and Mudo
 *
 * Character virtues cultivated through martial practice across Japanese,
 * Chinese, and Korean traditions. Parallel values emerge independently
 * in each culture, emphasizing that martial skill without moral
 * development is incomplete.
 *
 * Key sources: Nitobe Inazo, "Bushido: The Soul of Japan" (1900);
 * traditional Chinese wude precepts; Korean martial arts mudo tradition.
 *
 * This module teaches martial virtues as philosophical frameworks for
 * character development, not as religious instruction.
 *
 * @module departments/mind-body/concepts/philosophy/martial-virtues-bushido-wude
 */

export const martialVirtuesBushidoWude: RosettaConcept = {
  id: 'mb-phil-martial-virtues',
  name: 'Martial Virtues: Bushido, Wude, and Mudo',
  domain: 'mind-body',
  description:
    'Across martial arts traditions, physical skill is inseparable from character ' +
    'cultivation. Three major traditions articulate parallel virtue systems. Bushido ' +
    '(\u6B66\u58EB\u9053, "the way of the warrior," Japan) emphasizes seven virtues: ' +
    'rectitude (\u7FA9, gi), courage (\u52C7, y\u016B), benevolence (\u4EC1, jin), ' +
    'respect (\u793C, rei), honesty (\u8AA0, makoto), honor (\u540D\u8A89, meiyo), and ' +
    'loyalty (\u5FE0\u7FA9, ch\u016Bgi). Wude (\u6B66\u5FB7, "martial virtue," China) ' +
    'encompasses humility, respect, righteousness, trust, and loyalty -- qualities ' +
    'required alongside physical technique. Mudo (\u6B66\u9053, "the martial way," Korea) ' +
    'carries similar principles into Korean martial arts including Taekwondo and Hapkido. ' +
    'What is remarkable is the convergence: cultures that developed martial traditions ' +
    'independently arrived at similar conclusions about the relationship between skill ' +
    'and character. The common thread is that martial capability without moral development ' +
    'is dangerous, and that the discipline of training itself -- the perseverance, humility, ' +
    'and respect it demands -- cultivates these qualities over time. No tradition is ' +
    'presented as superior; each reflects its cultural context while addressing universal ' +
    'questions about the responsible use of learned capability. This module teaches martial ' +
    'virtues as philosophical frameworks for character development through practice, not as ' +
    'religious instruction. These are living traditions practiced by millions of martial ' +
    'artists worldwide -- this simplified presentation necessarily condenses rich and ' +
    'varied traditions into a brief comparative overview.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-martial-arts-philosophy',
      description:
        'Martial virtues are the ethical foundation of martial arts practice -- technique and character develop together',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-zen',
      description:
        'Bushido was historically influenced by Zen Buddhism, particularly the emphasis on discipline and direct experience',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-taoism',
      description:
        'Chinese martial virtues (wude) are intertwined with Taoist philosophy, especially in internal martial arts',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-shoshin',
      description:
        'Humility and openness to learning are shared values across all martial virtue traditions',
    },
  ],
  complexPlanePosition: {
    real: 0.1,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.01 + 0.49),
    angle: Math.atan2(0.7, 0.1),
  },
};
