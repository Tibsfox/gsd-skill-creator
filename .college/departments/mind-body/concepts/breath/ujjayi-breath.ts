/**
 * Ujjayi Breath -- ocean breath with audible feedback.
 *
 * A yoga breathing technique where slight throat constriction produces
 * an audible whisper, providing continuous feedback during practice.
 *
 * @module departments/mind-body/concepts/breath/ujjayi-breath
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const ujjayiTerm = renderTerminology('Ujjayi', 'victorious breath', 'Sanskrit, from the Hatha yoga tradition');
const pranayamaTerm = renderTerminology('Pranayama', 'breath control', 'the broader yogic breath discipline');

const yogaCredit = creditTradition({
  id: 'vedic-yoga',
  name: 'Vedic/Yoga Tradition',
  region: 'Indian subcontinent',
  period: 'c. 1500 BCE -- present',
  description: 'Ujjayi is a core pranayama technique described in the Hatha Yoga Pradipika',
  keyTexts: ['Hatha Yoga Pradipika', 'Yoga Sutras of Patanjali'],
  modernContext: 'Standard breathing technique in Ashtanga and Vinyasa yoga styles',
});

export const ujjayiBreath: RosettaConcept = {
  id: 'mb-breath-ujjayi',
  name: 'Ujjayi Breath',
  domain: 'mind-body',
  description:
    `${ujjayiTerm}: a breathing technique from the yoga tradition where a slight constriction ` +
    `at the back of the throat (the glottis) produces an audible whisper -- often compared to ` +
    `the sound of ocean waves or fogging a mirror. The constriction slows the breath and ` +
    `provides auditory feedback throughout practice. ` +
    `\n\nHow to practice: Sit comfortably with the mouth closed. Slightly constrict the back ` +
    `of the throat -- imagine fogging a mirror, but with the mouth closed. Inhale through ` +
    `the nose; you should hear a soft, ocean-like sound. Exhale through the nose with the ` +
    `same gentle constriction. The breath should be slow, smooth, and audible to you but ` +
    `not loud to others nearby. ` +
    `\n\nWhy it works: The throat constriction creates back-pressure that naturally slows ` +
    `respiration rate, engaging the parasympathetic nervous system. The audible sound serves ` +
    `as a built-in biofeedback mechanism -- if the sound becomes ragged or disappears, you ` +
    `have exceeded your capacity. In yoga practice, ujjayi maintains breath awareness during ` +
    `movement, bridging breathwork and physical practice. ` +
    `\n\nCultural roots: ${yogaCredit} Ujjayi is part of ${pranayamaTerm}, the fourth ` +
    `limb of Patanjali's eight-limbed yoga system. It is the standard breathing technique ` +
    `in Ashtanga and Vinyasa yoga styles.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Ujjayi adds throat constriction to the diaphragmatic breathing foundation',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'The audible breath in ujjayi serves as an attention anchor similar to the breath focus in vipassana',
    },
    {
      type: 'analogy',
      targetId: 'mb-breath-martial',
      description: 'Both ujjayi and martial breath use controlled throat engagement -- ujjayi for sustained flow, kiai for explosive release',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: -0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(-0.3, 0.7),
  },
};
