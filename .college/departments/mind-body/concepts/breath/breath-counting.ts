/**
 * Breath Counting -- the simplest meditation.
 *
 * Count exhales from 1 to 10, then start over. When the mind wanders,
 * return to 1. The "failure" IS the practice.
 *
 * @module departments/mind-body/concepts/breath/breath-counting
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const susokukanTerm = renderTerminology('Susokukan', 'counting the breath', 'Japanese Zen Buddhist meditation technique');
const anaPanaSati = renderTerminology('Anapanasati', 'mindfulness of breathing', 'Pali, the Buddha\'s core meditation instruction');

const zenCredit = creditTradition({
  id: 'chan-zen',
  name: 'Chan/Zen Buddhism',
  region: 'China, Japan, Korea',
  period: 'c. 6th century CE -- present',
  description: 'Breath counting (susokukan) is the traditional entry-level Zen meditation technique',
  keyTexts: ['Zazengi (Rules for Zazen)', 'Shobogenzo'],
  modernContext: 'Used in MBSR programs and secular mindfulness training worldwide',
});

export const breathCounting: RosettaConcept = {
  id: 'mb-breath-counting',
  name: 'Breath Counting',
  domain: 'mind-body',
  description:
    `The simplest meditation technique: count exhales from 1 to 10, then start over. When the ` +
    `mind wanders (and it will), return to 1. No judgment about the wandering -- the "failure" ` +
    `is the practice. Every time you notice you have drifted and return to counting, you have ` +
    `successfully trained attention. ` +
    `\n\nHow to practice: Sit in a comfortable, upright position. Eyes closed or softly ` +
    `downcast. Breathe naturally -- do not control the breath. On each exhale, count ` +
    `silently: 1... 2... 3... up to 10. After 10, return to 1. When you notice the mind has ` +
    `wandered (you are at "17" or thinking about lunch), simply return to 1. Start with ` +
    `2-5 minutes. This is harder than it sounds. ` +
    `\n\nWhy it works: The counting provides just enough cognitive structure to anchor attention ` +
    `without overwhelming awareness. The regular "reset" when the mind wanders builds the ` +
    `core skill of mindfulness -- recognizing when attention has drifted and gently redirecting ` +
    `it. This is the same attentional muscle used in every form of meditation. ` +
    `\n\nCultural roots: Known as ${susokukanTerm} in the Zen tradition. ${zenCredit} ` +
    `The broader practice of breath-focused meditation originates as ${anaPanaSati}, ` +
    `taught by the Buddha as the primary meditation instruction.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Natural diaphragmatic breathing provides the steady rhythm for counting',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'Breath counting is the entry gate to mindfulness practice -- vipassana extends the observational skill beyond counting',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-zazen',
      description: 'In Zen tradition, breath counting (susokukan) is the preliminary practice that prepares the student for shikantaza (just sitting)',
    },
    {
      type: 'analogy',
      targetId: 'mb-breath-box',
      description: 'Both techniques use counting to structure attention -- box breathing counts phases, breath counting counts exhales',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: -0.7,
    magnitude: Math.sqrt(0.36 + 0.49),
    angle: Math.atan2(-0.7, 0.6),
  },
};
