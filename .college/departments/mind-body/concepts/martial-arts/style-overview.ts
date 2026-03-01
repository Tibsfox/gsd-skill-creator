import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Martial Arts Style Overview
 *
 * A survey of major martial arts traditions spanning Chinese, Japanese,
 * Korean, Southeast Asian, Brazilian, and modern hybrid systems. Each
 * tradition is presented with historical context and defining characteristics.
 *
 * Cultural attribution: Multiple traditions acknowledged and credited individually.
 */
export const styleOverview: RosettaConcept = {
  id: 'mb-ma-style-overview',
  name: 'Martial Arts Style Overview',
  domain: 'mind-body',
  description:
    'The world\'s martial arts traditions reflect centuries of cultural development, regional needs, ' +
    'and philosophical evolution. This overview presents six major regional groupings with their ' +
    'defining characteristics. ' +
    'Chinese Arts (武术, Wǔshù): The broadest family, spanning the full hard-soft and internal-external ' +
    'spectrum. Shaolin Kung Fu (少林功夫) -- external, hard, emphasizing strength, endurance, and ' +
    'spectacular acrobatics. Wing Chun (詠春) -- close-range, economy of motion, centerline theory, ' +
    'made famous by Ip Man and Bruce Lee. Hung Gar (洪家) -- powerful stances, strong hand techniques, ' +
    'tiger and crane influences. Tai Chi (太極拳) -- internal, soft, slow-form practice with martial ' +
    'depth. Bagua Zhang (八卦掌) -- circle walking, evasive footwork, continuous spiraling. ' +
    'Xing Yi Quan (形意拳) -- direct, powerful, based on five elemental fist shapes. ' +
    'Japanese Arts: Emphasis on form (kata), ritual discipline, and ranking systems. Karate (空手) -- ' +
    '"empty hand," striking art with Okinawan roots, prominent styles include Shotokan, Goju-Ryu, ' +
    'and Shito-Ryu. Judo (柔道) -- "gentle way," throwing and grappling art founded by Jigoro Kano in 1882. ' +
    'Aikido (合気道) -- "way of harmonious spirit," emphasizing blending with and redirecting force, ' +
    'founded by Morihei Ueshiba. Kendo (剣道) -- "way of the sword," bamboo sword fencing preserving ' +
    'samurai swordsmanship. ' +
    'Korean Arts: Dynamic kicking techniques and sport competition. Taekwondo (跆拳道) -- "way of foot ' +
    'and fist," known for spectacular kicking, Olympic sport since 2000. Hapkido (合氣道) -- joint locks, ' +
    'throws, and dynamic kicking combining hard and soft approaches. ' +
    'Southeast Asian Arts: Clinch work, elbow and knee techniques, and indigenous fighting traditions. ' +
    'Muay Thai (มวยไทย) -- "Thai boxing," the national sport of Thailand, using punches, kicks, elbows, ' +
    'and knees. Silat (Pencak Silat) -- Indonesian/Malay archipelago art emphasizing low stances, sweeps, ' +
    'and weapons, with deep cultural and spiritual roots. ' +
    'Brazilian Arts: Unique movement traditions. Capoeira -- Afro-Brazilian art combining acrobatics, ' +
    'music, and dance-like movement, developed by enslaved Africans as disguised martial training. ' +
    'Brazilian Jiu-Jitsu (BJJ) -- ground grappling art derived from Judo, emphasizing positional ' +
    'control and submissions, developed by the Gracie family. ' +
    'Modern/Hybrid Systems: Practical application across ranges. Krav Maga -- Israeli military system ' +
    'focused on real-world scenarios. Mixed Martial Arts (MMA) -- competitive format combining striking ' +
    'and grappling from multiple traditions. Jeet Kune Do (截拳道) -- Bruce Lee\'s "way of the ' +
    'intercepting fist," emphasizing directness, adaptability, and personal expression. ' +
    'Note: Each tradition has depth that no overview can fully capture. Finding a tradition that resonates ' +
    'is the first step; finding a qualified teacher is the second. ' +
    'Martial arts skill requires in-person instruction with a qualified teacher.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-hard-soft-distinction',
      description: 'Each style can be placed along the hard-soft spectrum to understand its fundamental character',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-internal-external',
      description: 'Chinese arts in particular span the full internal-external spectrum, from Shaolin to Tai Chi',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-ma-history-philosophy',
      description: 'Each tradition carries its own historical lineage and philosophical foundation',
    },
  ],
  complexPlanePosition: {
    real: -0.1,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.01 + 0.49),
    angle: Math.atan2(0.7, -0.1),
  },
};
