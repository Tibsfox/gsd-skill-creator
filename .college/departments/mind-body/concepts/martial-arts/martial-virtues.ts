import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Martial Virtues -- Ethical Frameworks of the Fighting Arts
 *
 * The ethical codes that frame martial arts practice as character development:
 * Bushido (Japan), Wude (China), and universal principles of discipline,
 * respect, humility, perseverance, and integrity.
 *
 * Cultural attribution: Japanese Bushido tradition, Chinese Wude tradition,
 * with parallels in Korean Mudo and other martial cultures.
 */
export const martialVirtues: RosettaConcept = {
  id: 'mb-ma-martial-virtues',
  name: 'Martial Virtues',
  domain: 'mind-body',
  description:
    'Across cultures, martial arts traditions developed ethical frameworks that position combat training ' +
    'as a path of character development rather than mere fighting skill. These codes emerged from the ' +
    'practical recognition that teaching people to cause harm requires teaching them when not to. ' +
    'Bushido (武士道, "Way of the Warrior") is the Japanese ethical code associated with the samurai class, ' +
    'codified during the Edo period (1603-1868). Its seven virtues are: rectitude (義, gi), courage (勇, yū), ' +
    'benevolence (仁, jin), respect (礼, rei), honesty (誠, makoto), honor (名誉, meiyo), and loyalty ' +
    '(忠義, chūgi). Nitobe Inazō\'s 1900 book "Bushido: The Soul of Japan" brought these concepts ' +
    'to Western audiences, though the living tradition is far more nuanced than any single text captures. ' +
    'Wude (武德, "Martial Virtue") is the Chinese ethical tradition of martial arts. It comprises two ' +
    'dimensions: morality of deed (行为道德) -- humility, respect, righteousness, trust, loyalty -- and ' +
    'morality of mind (心理道德) -- courage, patience, endurance, perseverance, willpower. Wude teaches ' +
    'that technical skill without moral foundation is dangerous, and that the highest expression of ' +
    'martial ability is the wisdom to avoid conflict. ' +
    'Universal principles appear across virtually all martial traditions: discipline (consistent practice ' +
    'regardless of mood), respect (for teachers, training partners, and traditions), humility (recognizing ' +
    'how much remains to learn), perseverance (continuing through difficulty), and integrity (aligning ' +
    'actions with principles). These are not decorative additions to fighting technique -- they are ' +
    'the philosophical core that transforms physical training into personal cultivation.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-history-philosophy',
      description: 'Martial virtues emerged from the historical traditions that shaped martial arts practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-philosophy-zen',
      description: 'Zen Buddhist ethics and martial virtue codes share emphasis on mindful conduct and self-mastery',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'Tai chi principles of yielding and non-resistance embody martial virtue teachings about restraint and wisdom',
    },
  ],
  complexPlanePosition: {
    real: -0.5,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.25 + 0.49),
    angle: Math.atan2(0.7, -0.5),
  },
};
