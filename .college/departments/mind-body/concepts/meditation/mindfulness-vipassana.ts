/**
 * Mindfulness/Vipassana -- observe without following.
 *
 * The most researched meditation technique. Open monitoring of
 * present-moment experience with non-judgmental awareness using
 * the "noting" technique.
 *
 * @module departments/mind-body/concepts/meditation/mindfulness-vipassana
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const vipassanaTerm = renderTerminology('Vipassana', 'insight, clear seeing', 'Pali, the original language of the Theravada Buddhist canon');
const satiTerm = renderTerminology('Sati', 'mindfulness, awareness', 'Pali, the quality of present-moment attention');

const buddhistCredit = creditTradition({
  id: 'chan-zen',
  name: 'Theravada/Zen Buddhist Traditions',
  region: 'India, Southeast Asia, East Asia',
  period: 'c. 500 BCE -- present',
  description: 'Vipassana meditation originates in the teachings of the Buddha, preserved in the Satipatthana Sutta',
  keyTexts: ['Satipatthana Sutta', 'Visuddhimagga', 'Anapanasati Sutta'],
  modernContext: 'Adapted by Jon Kabat-Zinn into MBSR (1979) at UMass Medical Center, now the gold standard for evidence-based mindfulness',
});

export const mindfulnessVipassana: RosettaConcept = {
  id: 'mb-med-vipassana',
  name: 'Mindfulness (Vipassana)',
  domain: 'mind-body',
  description:
    `${vipassanaTerm}: open monitoring of present-moment experience with non-judgmental ` +
    `awareness. The "noting" technique provides structure: when something arises in ` +
    `awareness -- a thought, sound, sensation, emotion -- silently label it ("thinking," ` +
    `"hearing," "itching," "planning") and return attention to the breath. ` +
    `\n\nHow to practice: Sit comfortably with an upright but not rigid posture. Bring ` +
    `attention to the breath at the nostrils, chest, or belly -- wherever you feel it ` +
    `most clearly. When something pulls your attention away, silently note what it is ` +
    `with a light mental touch, not deep analysis. Note and return to the breath. ` +
    `Start at 5 minutes, adding 1-2 minutes per week. ` +
    `\n\nScientific evidence: Jon Kabat-Zinn developed Mindfulness-Based Stress Reduction ` +
    `(MBSR) at UMass Medical Center in 1979, building primarily on vipassana. MBSR has ` +
    `produced nearly 1,000 certified instructors across 30+ countries. Research shows ` +
    `significant improvements in cortisol levels and sustained attention after 8 weeks ` +
    `of regular practice. Neuroscientist Amishi Jha found U.S. Marines who completed ` +
    `MBSR before deployment showed better memory, decision-making under stress, and ` +
    `lower PTSD incidence. Meta-analyses demonstrate gray matter density changes in ` +
    `regions associated with learning, memory, and emotional regulation. ` +
    `\n\nCultural lineage: ${buddhistCredit} The quality cultivated is ${satiTerm}. ` +
    `The Vedic tradition (~1500 BCE) developed contemplative practices, which the Buddha ` +
    `(~500 BCE) refined into vipassana and samatha. The practice traveled from India ` +
    `through Southeast Asia and was adapted into secular MBSR by Kabat-Zinn in 1979.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'The breath is the primary attention anchor in vipassana -- diaphragmatic breathing provides the steady base',
    },
    {
      type: 'analogy',
      targetId: 'mb-med-samatha',
      description: 'Vipassana (open monitoring) and samatha (focused attention) are complementary -- vipassana casts a wide net, samatha narrows to a point',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-counting',
      description: 'Breath counting is the entry gate to mindfulness -- vipassana extends the observational skill beyond counting',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-med-body-scan',
      description: 'Body scan applies vipassana-style observation systematically through the body',
    },
  ],
  complexPlanePosition: {
    real: -0.3,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.09 + 0.04),
    angle: Math.atan2(0.2, -0.3),
  },
};
