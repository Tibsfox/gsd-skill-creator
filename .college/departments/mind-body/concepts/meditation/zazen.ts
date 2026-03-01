/**
 * Zazen -- just sitting.
 *
 * The most stripped-down meditation form. No technique, no object,
 * no counting, no noting. Sit. Be present. The simplicity IS the difficulty.
 *
 * @module departments/mind-body/concepts/meditation/zazen
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const zazenTerm = renderTerminology('Zazen', 'seated meditation', 'Japanese, the core practice of Zen Buddhism');
const shikantazaTerm = renderTerminology('Shikantaza', 'just sitting', 'Japanese, the objectless meditation of Soto Zen');

const zenCredit = creditTradition({
  id: 'chan-zen',
  name: 'Chan/Zen Buddhism',
  region: 'China, Japan, Korea',
  period: 'c. 6th century CE -- present',
  description: 'Zazen is the central practice of Zen Buddhism, transmitted from Chan Buddhism in China to Japan',
  keyTexts: ['Shobogenzo', 'Zen Mind, Beginner\'s Mind', 'Platform Sutra'],
  modernContext: 'Practiced in Zen centers worldwide, with Suzuki Roshi\'s "Zen Mind, Beginner\'s Mind" as the most widely read introduction',
});

export const zazen: RosettaConcept = {
  id: 'mb-med-zazen',
  name: 'Zazen',
  domain: 'mind-body',
  description:
    `${zazenTerm}: the most stripped-down meditation form. No technique, no object, no ` +
    `counting, no noting. Sit. Be present. When you notice you have drifted, return. The ` +
    `simplicity IS the difficulty. As Shunryu Suzuki wrote in "Zen Mind, Beginner's Mind": ` +
    `"In the beginner's mind there are many possibilities, but in the expert's mind there ` +
    `are few." ` +
    `\n\nHow to practice: Traditional posture is cross-legged on a cushion (zafu), hands ` +
    `in cosmic mudra (left hand resting in right, thumbs lightly touching), back straight, ` +
    `chin slightly tucked, eyes half-open gazing downward at approximately 45 degrees. ` +
    `Accessible alternative: seated in a chair, feet flat on the floor, hands resting on ` +
    `thighs, same upright but relaxed spine. The advanced form, ${shikantazaTerm}, is ` +
    `objectless awareness -- no anchor, no technique, just open presence. ` +
    `\n\nThe paradox: Zazen is best introduced after some experience with breath counting ` +
    `or mindfulness. Starting with zazen can be frustrating for beginners because there is ` +
    `no anchor point. Yet the tradition teaches that zazen is not a technique to master ` +
    `but a state to inhabit -- there is nothing to achieve, only practice to do. ` +
    `\n\nCultural lineage: ${zenCredit} Zen (Chan) originated when Bodhidharma brought ` +
    `Buddhist meditation from India to China (~6th century CE). Chan traveled to Japan ` +
    `where it became Zen, with the Soto school (Dogen, 13th century) emphasizing ` +
    `shikantaza and the Rinzai school emphasizing koan practice.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-counting',
      description: 'Breath counting (susokukan) is the traditional preliminary practice before zazen -- the training wheels that eventually come off',
    },
    {
      type: 'analogy',
      targetId: 'mb-med-samatha',
      description: 'Zazen can be seen as concentration taken to its extreme -- focus without any specific object',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'Vipassana and zazen both cultivate present-moment awareness, but vipassana uses noting while zazen uses no technique at all',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-kinhin',
      description: 'Kinhin (walking meditation) alternates with zazen in traditional Zen practice, providing movement between sitting periods',
    },
  ],
  complexPlanePosition: {
    real: -0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, -0.6),
  },
};
