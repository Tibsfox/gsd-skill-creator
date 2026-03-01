/**
 * Concentration/Samatha -- single-pointed focus.
 *
 * Sustained focus on a single object. Where mindfulness casts a wide net,
 * concentration narrows to a single point. The two are complementary:
 * concentration is the lens, mindfulness is the panoramic view.
 *
 * @module departments/mind-body/concepts/meditation/concentration-samatha
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const samathaTerm = renderTerminology('Samatha', 'calm abiding, tranquility', 'Pali/Sanskrit, the concentration branch of Buddhist meditation');
const dhanaTerm = renderTerminology('Dharana', 'concentration, holding steady', 'Sanskrit, the sixth limb of Patanjali\'s yoga system');

const buddhistCredit = creditTradition({
  id: 'chan-zen',
  name: 'Buddhist Meditation Traditions',
  region: 'India, Southeast Asia, East Asia',
  period: 'c. 500 BCE -- present',
  description: 'Samatha is one of the two core meditation modes taught by the Buddha, alongside vipassana',
  keyTexts: ['Visuddhimagga', 'Anapanasati Sutta'],
  modernContext: 'Used as a complementary practice in MBSR and as the foundation for advanced contemplative training',
});

export const concentrationSamatha: RosettaConcept = {
  id: 'mb-med-samatha',
  name: 'Concentration (Samatha)',
  domain: 'mind-body',
  description:
    `${samathaTerm}: sustained focus on a single object -- breath, candle flame, mantra, or ` +
    `mental image. Where mindfulness casts a wide net of awareness, concentration narrows ` +
    `to a single point. The two are complementary: concentration is the lens, mindfulness ` +
    `is the panoramic view. ` +
    `\n\nHow to practice: Choose an object of focus. For beginners, the breath at the ` +
    `nostrils is ideal. Hold attention on that object exclusively. When attention wanders, ` +
    `return it to the object -- no noting, just return. The quality to cultivate is sustained, ` +
    `unbroken attention. Start at 3-5 minutes. This is intensely demanding -- even experienced ` +
    `meditators find sustained single-pointed focus challenging beyond 10-15 minutes. ` +
    `\n\nWhy it works: Concentration meditation builds the attentional "muscle" that supports ` +
    `all other contemplative practices. Research shows regular samatha practice increases ` +
    `activity in the prefrontal cortex and strengthens the brain's capacity for sustained ` +
    `voluntary attention, with measurable improvements in attentional stability after ` +
    `consistent practice. ` +
    `\n\nCultural lineage: ${buddhistCredit} The concept also appears in the Vedic yoga ` +
    `tradition as ${dhanaTerm}. The Buddha taught samatha and vipassana as the two ` +
    `complementary wings of meditation (~500 BCE). The practice is foundational across ` +
    `Theravada, Tibetan, and Zen traditions.`,
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'mb-med-vipassana',
      description: 'Samatha (focused attention) and vipassana (open monitoring) are the two complementary wings of meditation',
    },
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'The breath at the nostrils is the most common concentration object -- requires comfortable diaphragmatic breathing',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-zazen',
      description: 'Zazen can be seen as concentration taken to its logical extreme -- focus without any specific object',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-box',
      description: 'The sustained focus during box breathing holds mirrors the single-pointed attention of samatha',
    },
  ],
  complexPlanePosition: {
    real: -0.4,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.16 + 0.09),
    angle: Math.atan2(0.3, -0.4),
  },
};
