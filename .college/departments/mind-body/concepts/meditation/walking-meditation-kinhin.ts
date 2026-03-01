/**
 * Walking Meditation (Kinhin) -- meditation in motion.
 *
 * Extremely slow, deliberate walking with full attention on each phase
 * of the step. Bridges sitting meditation and moving practices like tai chi.
 *
 * @module departments/mind-body/concepts/meditation/walking-meditation-kinhin
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const kinhinTerm = renderTerminology('Kinhin', 'walking meditation', 'Japanese Zen Buddhist practice between zazen periods');
const chankramanaTerm = renderTerminology('Chankramana', 'walking back and forth', 'Pali, the Buddha\'s walking meditation instruction');

const zenCredit = creditTradition({
  id: 'chan-zen',
  name: 'Chan/Zen Buddhism',
  region: 'China, Japan, Korea',
  period: 'c. 6th century CE -- present',
  description: 'Kinhin is practiced between zazen periods in Zen monasteries, integrating meditation with movement',
  keyTexts: ['Zazengi (Rules for Zazen)', 'Shobogenzo'],
  modernContext: 'Incorporated into MBSR programs and mindfulness retreats as a complement to sitting practice',
});

export const walkingMeditationKinhin: RosettaConcept = {
  id: 'mb-med-kinhin',
  name: 'Walking Meditation (Kinhin)',
  domain: 'mind-body',
  description:
    `${kinhinTerm}: meditation in motion -- extremely slow, deliberate walking with full ` +
    `attention on each phase of the step. This practice bridges sitting meditation and ` +
    `moving practices like tai chi and yoga. ` +
    `\n\nHow to practice: Stand with feet hip-width apart. Hands clasped gently in front ` +
    `or behind. Shift weight entirely onto the left foot. Lift the right foot -- slowly. ` +
    `Notice the lifting sensation. Move the right foot forward -- slowly. Notice the ` +
    `moving sensation. Place the right foot down -- heel, then ball, then toes. Notice ` +
    `the placing sensation. Shift weight onto the right foot. Repeat with left. Speed: ` +
    `approximately one step every 3-5 seconds. A path of 10-20 feet is sufficient -- ` +
    `walk to the end, turn slowly, walk back. ` +
    `\n\nWhy it works: Walking meditation develops proprioceptive awareness -- the ` +
    `conscious perception of weight transfer, balance adjustments, and coordinated ` +
    `movement that normally operates below conscious attention. This awareness transfers ` +
    `directly to martial arts footwork, yoga balance poses, and tai chi weight shifts. ` +
    `It also provides a movement alternative for practitioners who find sitting meditation ` +
    `physically uncomfortable or mentally agitating. ` +
    `\n\nCultural lineage: ${zenCredit} The practice originates as ${chankramanaTerm} ` +
    `in the earliest Buddhist texts. In Zen monasteries, kinhin alternates with zazen ` +
    `periods -- typically 25 minutes of sitting followed by 5-10 minutes of walking. ` +
    `The practice is also incorporated into MBSR retreat curricula.`,
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mb-med-zazen',
      description: 'Kinhin alternates with zazen in traditional Zen practice, providing movement between sitting periods',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-body-scan',
      description: 'Both practices develop interoceptive awareness -- body scan through systematic internal attention, kinhin through conscious movement',
    },
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Natural diaphragmatic breathing maintains calm during the slow walking practice',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-vipassana',
      description: 'Walking meditation applies vipassana-style noting to movement sensations: lifting, moving, placing',
    },
  ],
  complexPlanePosition: {
    real: 0.1,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.01 + 0.04),
    angle: Math.atan2(0.2, 0.1),
  },
};
