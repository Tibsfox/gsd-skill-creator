import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Beijing 24 Form (Simplified Yang Style)
 *
 * The standardized simplified tai chi form created in 1956 for public health
 * promotion. Based on traditional Yang-style tai chi, it contains 24 unique
 * movements and takes approximately 6 minutes to perform.
 *
 * Cultural attribution: Chinese martial arts tradition, Yang-style tai chi lineage.
 * Standardized by the Chinese Sports Committee under Li Tianji's leadership.
 */
export const beijing24Form: RosettaConcept = {
  id: 'mb-tc-beijing-24-form',
  name: 'Beijing 24 Form',
  domain: 'mind-body',
  description:
    'The Beijing 24 Form (二十四式简化太极拳, "24-movement Simplified Tai Chi") was created in 1956 when ' +
    'the Chinese Sports Committee gathered five tai chi masters, led by Li Tianji (李天骥), to create a ' +
    'simplified form for public health promotion. Based on traditional Yang-style tai chi (the most widely ' +
    'practiced style, originated by Yang Luchan in the 19th century), it distills the essence of the long ' +
    'form (85-108 movements) into 24 unique movements that take approximately 6 minutes to perform. ' +
    'The 24 named movements (with selected Pinyin): ' +
    '1. Commencing Form (起势, Qi Shi) -- rising and settling, the opening breath. ' +
    '2. Part the Wild Horse\'s Mane (野马分鬃, Ye Ma Fen Zong) -- left and right, weight shifting with ' +
    'arm separation. ' +
    '3. White Crane Spreads Its Wings (白鹤亮翅, Bai He Liang Chi) -- one arm rises, one settles, ' +
    'weight shifts back. ' +
    '4. Brush Knee and Push (搂膝拗步, Lou Xi Ao Bu) -- left and right, sweeping low while pushing forward. ' +
    '5. Playing the Lute (手挥琵琶, Shou Hui Pipa) -- hands positioned as if holding an instrument. ' +
    '6. Repulse Monkey (倒卷肱, Dao Juan Gong) -- stepping backward while the arms alternate. ' +
    '7. Grasp the Sparrow\'s Tail - Right (右揽雀尾, You Lan Que Wei) -- the signature Yang-style sequence: ' +
    'ward off, roll back, press, push. ' +
    '8. Grasp the Sparrow\'s Tail - Left (左揽雀尾, Zuo Lan Que Wei). ' +
    '9. Single Whip (单鞭, Dan Bian) -- distinctive hook hand with extended palm. ' +
    '10. Cloud Hands (云手, Yun Shou) -- weight shifting side to side with circular arm movements. ' +
    '11. Single Whip (单鞭, Dan Bian) -- repeated. ' +
    '12. High Pat on Horse (高探马, Gao Tan Ma) -- rising with one palm extended. ' +
    '13. Right Heel Kick (右蹬脚, You Deng Jiao). ' +
    '14. Strike Ears with Both Fists (双峰贯耳, Shuang Feng Guan Er). ' +
    '15. Left Heel Kick (左蹬脚, Zuo Deng Jiao). ' +
    '16. Snake Creeps Down / Golden Rooster - Left (左下势独立, Zuo Xia Shi Du Li). ' +
    '17. Snake Creeps Down / Golden Rooster - Right (右下势独立, You Xia Shi Du Li). ' +
    '18. Fair Lady Works the Shuttles (玉女穿梭, Yu Nu Chuan Suo). ' +
    '19. Needle at Sea Bottom (海底针, Hai Di Zhen). ' +
    '20. Flash Arms (闪通臂, Shan Tong Bi). ' +
    '21. Turn, Deflect, Parry, and Punch (转身搬拦捶, Zhuan Shen Ban Lan Chui). ' +
    '22. Apparent Close-Up (如封似闭, Ru Feng Si Bi). ' +
    '23. Cross Hands (十字手, Shi Zi Shou). ' +
    '24. Closing Form (收势, Shou Shi) -- returning to stillness. ' +
    'Teaching approach: The form is traditionally taught in sections. Begin with the Commencing Form as ' +
    'a standalone practice -- simply rising and settling the arms with the breath. Add movements ' +
    'progressively, mastering each before moving on. The entire form can be learned in weeks to months. ' +
    'This is a solo movement practice. Learning the form with a qualified teacher is recommended ' +
    'for developing correct alignment and timing.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-tc-tai-chi-principles',
      description: 'Every movement in the Beijing 24 Form expresses the five tai chi principles: song, root, central equilibrium, flow, and yin-yang',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-simple-form',
      description: 'Both martial arts forms and tai chi forms use choreographed solo sequences as the primary training method',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-yin-yang-movement',
      description: 'The form\'s movements continuously alternate between yin and yang qualities: opening/closing, rising/sinking, forward/backward',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.25 + 0.25),
    angle: Math.atan2(0.5, 0.5),
  },
};
