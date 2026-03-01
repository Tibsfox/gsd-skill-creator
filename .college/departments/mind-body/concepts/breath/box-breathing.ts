/**
 * Box Breathing (4-4-4-4) -- tactical stress regulation.
 *
 * A four-phase breathing pattern used by Navy SEALs, law enforcement,
 * and first responders for acute stress regulation and sustained focus.
 *
 * @module departments/mind-body/concepts/breath/box-breathing
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const pranayamaRoot = renderTerminology('Pranayama', 'breath control', 'the Ayurvedic breathwork tradition originating in India');
const samaVrtti = renderTerminology('Sama Vrtti', 'equal fluctuation', 'the yogic equal-ratio breathing pattern that box breathing derives from');

const vedicCredit = creditTradition({
  id: 'vedic-yoga',
  name: 'Vedic/Yoga Tradition',
  region: 'Indian subcontinent',
  period: 'c. 1500 BCE -- present',
  description: 'Box breathing draws from pranayama, the ancient yogic breath control system',
  keyTexts: ['Yoga Sutras of Patanjali', 'Hatha Yoga Pradipika'],
  modernContext: 'Adopted by military and first responders as tactical breathing',
});

export const boxBreathing: RosettaConcept = {
  id: 'mb-breath-box',
  name: 'Box Breathing',
  domain: 'mind-body',
  description:
    `A four-phase breathing pattern where each phase lasts an equal number of counts: ` +
    `inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Also called square breathing ` +
    `or tactical breathing. Used by U.S. Navy SEALs, law enforcement, and first responders ` +
    `for acute stress regulation and sustained focus. ` +
    `\n\nHow to practice: Sit, stand, or lie comfortably. Expel all air. Inhale slowly through ` +
    `the nose for 4 counts, filling lungs and abdomen. Hold for 4 counts with a relaxed ` +
    `throat. Exhale slowly through the mouth for 4 counts. Hold empty for 4 counts. Repeat ` +
    `for a minimum of 5 cycles (approximately 5 minutes). ` +
    `\n\nWhy it works: The hold phases allow temporary CO2 buildup, which enhances the ` +
    `cardioinhibitory response (lowering heart rate). The rhythmic, predictable pattern ` +
    `activates the brain's pattern-recognition systems, promoting a sense of control. The ` +
    `4-4-4-4 ratio is "energetically neutral" -- it produces alertness and calm simultaneously ` +
    `without inducing drowsiness or hyperarousal. Research (2023) showed twice-daily box ` +
    `breathing for one month produced significant sleep improvements. ` +
    `\n\nCultural roots: ${vedicCredit} The technique derives from ${samaVrtti}, ` +
    `rooted in ${pranayamaRoot}. The military adoption is modern, but the underlying ` +
    `pattern has ancient roots in yogic practice.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Diaphragmatic breathing must be established before adding the hold phases of box breathing',
    },
    {
      type: 'analogy',
      targetId: 'mb-breath-counting',
      description: 'Both provide a counting structure that anchors attention -- box breathing counts the breath phases, breath counting counts the exhales',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-samatha',
      description: 'The sustained single-pointed focus required during box breathing holds mirrors the concentration training of samatha meditation',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.5,
    magnitude: Math.sqrt(0.64 + 0.25),
    angle: Math.atan2(-0.5, 0.8),
  },
};
