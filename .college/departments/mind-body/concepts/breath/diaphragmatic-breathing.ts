/**
 * Diaphragmatic Breathing -- the universal foundation.
 *
 * The parasympathetic activator that underlies every other practice
 * in the Mind-Body department. Breathing that optimizes use of the
 * diaphragm rather than shallow chest breathing.
 *
 * @module departments/mind-body/concepts/breath/diaphragmatic-breathing
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const pranayama = renderTerminology('Pranayama', 'breath control', 'Sanskrit, from the Vedic yoga tradition');
const qigongBreath = renderTerminology('Tu Na', 'expel and inhale', 'Chinese qigong breathing method');

const vedicCredit = creditTradition({
  id: 'vedic-yoga',
  name: 'Vedic/Yoga Tradition',
  region: 'Indian subcontinent',
  period: 'c. 1500 BCE -- present',
  description: 'Pranayama (breath control) is the fourth limb of Patanjali\'s eight-limbed yoga system',
  keyTexts: ['Yoga Sutras of Patanjali', 'Hatha Yoga Pradipika'],
  modernContext: 'Diaphragmatic breathing is now standard in clinical stress reduction protocols',
});

export const diaphragmaticBreathing: RosettaConcept = {
  id: 'mb-breath-diaphragmatic',
  name: 'Diaphragmatic Breathing',
  domain: 'mind-body',
  description:
    `Breathing that optimizes use of the diaphragm -- the large dome-shaped muscle at the base ` +
    `of the lungs. Most people habitually breathe shallowly into the chest using intercostal ` +
    `muscles. Diaphragmatic breathing redirects the breath lower, causing visible abdominal ` +
    `expansion rather than chest rise. ` +
    `\n\nHow to practice: Lie on your back with knees bent. Place one hand on your upper chest ` +
    `and the other just below the rib cage. Breathe in slowly through the nose -- the belly hand ` +
    `should rise while the chest hand stays still. Exhale through pursed lips as the belly hand ` +
    `lowers. Start with 5-10 minutes, 3-4 times daily. ` +
    `\n\nWhy it works: At approximately 6 breaths per minute, the respiratory rhythm achieves ` +
    `resonance with the baroreflex loop, producing maximum vagal tone. This activates the ` +
    `parasympathetic nervous system, increases heart rate variability (HRV), and reduces ` +
    `cortisol levels. A 2023 systematic review (PMC, 58 studies) found that 54 of 72 breathing ` +
    `interventions significantly reduced stress and anxiety, with deep diaphragmatic breathing ` +
    `among the most effective approaches. ` +
    `\n\nCultural roots: Known as ${pranayama} in the yoga tradition. ${vedicCredit} ` +
    `Chinese traditions practice this as ${qigongBreath}. The technique appears across virtually ` +
    `every contemplative tradition worldwide -- it is the universal foundation of mind-body practice.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-box',
      description: 'Box breathing builds on diaphragmatic breathing as its foundation -- the belly breath must be established before adding holds',
    },
    {
      type: 'dependency',
      targetId: 'mb-breath-ujjayi',
      description: 'Ujjayi adds throat constriction to the diaphragmatic base',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'Mindfulness meditation uses natural diaphragmatic breathing as the primary attention anchor',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-body-scan',
      description: 'Body scan begins with awareness of the breath in the belly -- diaphragmatic breathing provides the foundation',
    },
  ],
  complexPlanePosition: {
    real: 0.9,
    imaginary: -0.8,
    magnitude: Math.sqrt(0.81 + 0.64),
    angle: Math.atan2(-0.8, 0.9),
  },
};
