import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Mindfulness in Daily Life -- From Mat to Moment
 *
 * The transition from formal practice (seated meditation, yoga, tai chi)
 * to informal practice (bringing attention to everyday activities).
 * The point of practice is not getting good at sitting -- it is bringing
 * attention everywhere.
 *
 * Key sources: Jon Kabat-Zinn, MBSR curriculum; Thich Nhat Hanh,
 * "The Miracle of Mindfulness" (1975)
 *
 * This module teaches mindfulness as a practical attention skill,
 * not as religious instruction.
 *
 * @module departments/mind-body/concepts/philosophy/mindfulness-daily-life
 */

export const mindfulnessDailyLife: RosettaConcept = {
  id: 'mb-phil-mindfulness-daily',
  name: 'Mindfulness in Daily Life',
  domain: 'mind-body',
  description:
    'The purpose of formal practice -- meditation, yoga, tai chi -- is not to become ' +
    'skilled at sitting on a cushion or holding a pose. It is to cultivate a quality of ' +
    'attention that transfers into every moment of daily life. This transition from formal ' +
    'to informal practice is where mind-body disciplines produce their most lasting effects. ' +
    'Eating mindfully: tasting each bite, noticing texture, temperature, and flavor rather ' +
    'than eating on autopilot. Walking mindfully: feeling each step, even at normal speed, ' +
    'noticing the ground beneath your feet. Listening mindfully: giving full attention to ' +
    'conversations without rehearsing your response. Coding mindfully: noticing posture, ' +
    'breathing, and mental state while working; taking micro-breaks to reset attention. ' +
    'Working mindfully: single-tasking with awareness rather than fragmenting attention ' +
    'across multiple demands. As Jon Kabat-Zinn describes in the MBSR curriculum, ' +
    'mindfulness is "paying attention in a particular way: on purpose, in the present ' +
    'moment, and non-judgmentally." Thich Nhat Hanh\'s "The Miracle of Mindfulness" ' +
    'teaches that washing dishes can be meditation if done with full presence. This module ' +
    'teaches mindfulness as a practical attention skill and philosophical framework, not as ' +
    'religious instruction. Mindfulness is rooted in living traditions practiced by millions ' +
    'worldwide, drawing from Buddhist, Hindu, and secular sources -- this simplified ' +
    'presentation encourages seeking teachers for deeper study.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-med-mindfulness',
      description:
        'Formal mindfulness meditation is the training ground for daily life mindfulness',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-zen',
      description:
        'Zen philosophy emphasizes that practice is not separate from daily life -- every activity can be done with Zen mind',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-shoshin',
      description:
        'Beginner\'s mind (shoshin) is the attitude that makes everyday mindfulness possible -- approaching familiar activities with fresh attention',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-phil-yoga-sutras',
      description:
        'The ethical limbs of the Yoga Sutras (Yama, Niyama) extend practice into daily conduct and relationships',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.09 + 0.25),
    angle: Math.atan2(0.5, 0.3),
  },
};
