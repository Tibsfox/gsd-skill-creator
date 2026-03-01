import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Martial Arts History and Philosophy
 *
 * The origin stories, cross-cultural development, and foundational philosophy
 * of martial arts traditions worldwide. Covers the Shaolin Temple tradition
 * (separating myth from historical reality), the etymology of kung fu, and
 * the convergent evolution of combat systems across cultures.
 *
 * Cultural attribution: Chinese martial arts tradition (Shaolin, Wushu),
 * with cross-cultural parallels across Japanese, Korean, and Southeast Asian traditions.
 */
export const historyPhilosophy: RosettaConcept = {
  id: 'mb-ma-history-philosophy',
  name: 'Martial Arts History and Philosophy',
  domain: 'mind-body',
  description:
    'Kung fu (功夫, gōngfu) literally means "skill achieved through hard work and time" -- ' +
    'it does not specifically mean fighting. A master calligrapher, chef, or musician can all possess ' +
    'good kung fu. The martial application of kung fu (武术, wǔshù) is one expression of this broader concept. ' +
    'The Shaolin Temple tradition, often cited as the mythological origin of Chinese martial arts, places ' +
    'the arrival of the Indian monk Bodhidharma (達摩, Dámó) at the Shaolin Monastery in Henan province ' +
    'around 527 CE. The popular legend holds that Bodhidharma found the monks physically weak from prolonged ' +
    'meditation and taught them exercises that evolved into Shaolin kung fu. Historical reality is more nuanced: ' +
    'combat techniques existed in China long before Bodhidharma, and the Shaolin tradition likely developed ' +
    'over centuries through contributions from many practitioners. What is historically documented is that the ' +
    'Shaolin Monastery became a center where Chan (Zen) Buddhist meditation practice merged with martial ' +
    'training, producing a tradition where physical cultivation and spiritual development were inseparable. ' +
    'Martial arts developed independently across cultures: Japanese bujutsu emerged from samurai battlefield ' +
    'traditions, Korean martial arts drew from both indigenous techniques and Chinese influence, Southeast ' +
    'Asian arts like Muay Thai and Silat developed from regional combat needs, and Brazilian Capoeira arose ' +
    'from African traditions brought by enslaved peoples. Each tradition reflects its culture\'s values, ' +
    'geography, and historical circumstances. ' +
    'Note: Martial arts skill requires in-person instruction with a qualified teacher. ' +
    'This content provides historical and philosophical context for solo study.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-martial-virtues',
      description: 'Martial philosophy gave rise to ethical codes like Bushido and Wude that frame martial practice as character development',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'Tai chi emerged from the same Chinese martial tradition, emphasizing internal cultivation over external technique',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-philosophy-zen',
      description: 'Chan/Zen Buddhism and martial arts share deep historical roots at the Shaolin Monastery',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.09 + 0.36),
    angle: Math.atan2(0.6, -0.3),
  },
};
