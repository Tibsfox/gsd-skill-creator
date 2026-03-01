import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Internal and External Martial Arts
 *
 * The distinction between external arts (train the body first, then refine
 * the mind) and internal arts (train the mind and intention first, then
 * express through the body). Both paths converge at mastery.
 *
 * Cultural attribution: Chinese martial arts classification, particularly
 * the Wudang/Shaolin distinction in Chinese martial theory.
 */
export const internalExternal: RosettaConcept = {
  id: 'mb-ma-internal-external',
  name: 'Internal and External Arts',
  domain: 'mind-body',
  description:
    'Chinese martial arts theory distinguishes between external (外家, wàijiā) and ' +
    'internal (內家, nèijiā) approaches to training. External arts train the body first: ' +
    'building muscular strength, cardiovascular endurance, speed, and technical precision through ' +
    'rigorous physical conditioning. Shaolin Kung Fu is the archetypal external art -- practitioners ' +
    'develop iron-hard conditioning through repeated striking of surfaces, demanding physical forms, ' +
    'and progressive resistance training. The philosophy is that a strong, conditioned body becomes ' +
    'the vessel through which skill is expressed. ' +
    'Internal arts train the mind first: developing intention (意, yì), awareness of internal ' +
    'sensation, relaxed structural alignment, and the ability to coordinate the whole body as a ' +
    'unified system. The three classical internal arts are Tai Chi (太極拳), Bagua Zhang (八卦掌, ' +
    '"Eight Trigram Palm"), and Xing Yi Quan (形意拳, "Form-Intention Fist"). Internal training ' +
    'begins with standing meditation, slow movement, and sensitivity exercises before progressing ' +
    'to martial application. The philosophy is that a calm, aware mind can direct the body more ' +
    'efficiently than brute force alone. ' +
    'The distinction describes starting points, not endpoints. Advanced external practitioners ' +
    'develop profound internal awareness; advanced internal practitioners develop significant ' +
    'physical capability. Both paths, pursued with dedication, arrive at integrated mind-body skill. ' +
    'Solo practice applications: External training emphasizes conditioning drills, powerful form ' +
    'repetitions, and progressive physical challenges. Internal training emphasizes standing meditation, ' +
    'slow-form practice, and awareness of subtle body mechanics.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-ma-hard-soft-distinction',
      description: 'Internal/external overlaps with but is distinct from hard/soft -- internal arts can express hard force, and external arts cultivate softness',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-tc-zhan-zhuang',
      description: 'Zhan Zhuang standing meditation is the foundational internal training method shared across all three classical internal arts',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-meditation-mindfulness',
      description: 'Internal arts training methods parallel meditation practices -- both cultivate sustained awareness and mental clarity',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.09 + 0.25),
    angle: Math.atan2(0.5, -0.3),
  },
};
