import type { RosettaConcept } from '../../../../rosetta-core/types.js';

/**
 * Yoga Nidra -- "Yogic Sleep"
 *
 * A systematic guided relaxation practice performed lying down, maintaining
 * awareness on the edge of sleep. Rooted in the Satyananda Yoga tradition,
 * with modern clinical adaptation through iRest (Dr. Richard Miller).
 *
 * Evidence basis: iRest protocol evaluated in 30+ clinical trials. U.S. Army
 * Surgeon General lists Yoga Nidra as Tier 1 approach for Pain Management
 * in Military Care. Efficacy demonstrated for PTSD, chronic pain, sleep quality,
 * and depression.
 *
 * @module departments/mind-body/concepts/relaxation/yoga-nidra
 */

export const yogaNidra: RosettaConcept = {
  id: 'mb-relax-yoga-nidra',
  name: 'Yoga Nidra',
  domain: 'mind-body',
  description:
    'Yoga nidra ("yogic sleep") is a systematic guided relaxation practice performed ' +
    'while lying in Savasana (corpse pose), maintaining a thread of awareness on the ' +
    'edge of sleep. The practice follows a structured protocol: body rotation (systematic ' +
    'body scanning), breath awareness, visualization, and intention setting. The iRest ' +
    '(Integrative Restoration) protocol developed by Dr. Richard Miller expands this to ' +
    '10 steps including connecting to heartfelt longing, inviting an inner resource of ' +
    'safety, body sensing, breath sensing, welcoming emotions and thoughts, experiencing ' +
    'joy, finding peace, and integration. Research from 30+ clinical trials shows efficacy ' +
    'for PTSD symptoms in veterans, chronic pain management, sleep quality improvement, ' +
    'and depression reduction. The U.S. Army Surgeon General has listed Yoga Nidra as a ' +
    'Tier 1 approach for Pain Management in Military Care. A typical session runs 15-30 ' +
    'minutes, though claims of "30 minutes equals 2 hours of sleep" have mixed research ' +
    'support -- the restorative benefits are real but not a direct sleep replacement. ' +
    'This is a simplified introduction to a practice with deep roots in the Satyananda ' +
    'Yoga tradition -- the iRest Institute offers comprehensive training for those ' +
    'seeking deeper study.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-relax-nervous-system',
      description:
        'Yoga nidra activates the parasympathetic nervous system through systematic relaxation and breath awareness',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-body-scan',
      description:
        'Body rotation in yoga nidra shares technique with the MBSR body scan but adds visualization and intention layers',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-diaphragmatic',
      description:
        'Breath sensing is a core step in the yoga nidra protocol',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-yoga-savasana',
      description:
        'Yoga nidra is traditionally performed in Savasana (corpse pose) -- the yoga posture of complete rest',
    },
  ],
  complexPlanePosition: {
    real: 0.3,
    imaginary: 0.1,
    magnitude: Math.sqrt(0.09 + 0.01),
    angle: Math.atan2(0.1, 0.3),
  },
};
