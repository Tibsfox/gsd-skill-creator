/**
 * Martial Breath (Kiai/Kihap) -- explosive power generation.
 *
 * A sharp, forceful exhale timed to strike execution. The opposite end
 * of the breath spectrum from meditation -- cultivating explosive power
 * and timing rather than stillness and observation.
 *
 * @module departments/mind-body/concepts/breath/martial-breath
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { renderTerminology, creditTradition } from '../../cultural-framework.js';

const kiaiTerm = renderTerminology('Kiai', 'spirit meeting', 'Japanese martial arts -- the focused shout coordinating breath, technique, and intent');
const kihapTerm = renderTerminology('Kihap', 'energy shout', 'Korean martial arts -- the forceful exhale accompanying strikes');
const fajinTerm = renderTerminology('Fajin', 'explosive power release', 'Chinese martial arts -- issuing force through coordinated breath and structure');

const bushidoCredit = creditTradition({
  id: 'bushido',
  name: 'Bushido',
  region: 'Japan',
  period: 'c. 12th century CE -- present',
  description: 'Kiai is integral to Japanese martial arts, coordinating breath with technique in kendo, karate, and aikido',
  keyTexts: ['The Book of Five Rings', 'Hagakure'],
  modernContext: 'Martial breath techniques are practiced in dojos worldwide across Japanese, Korean, and Chinese martial arts',
});

const shaolinCredit = creditTradition({
  id: 'shaolin',
  name: 'Shaolin Tradition',
  region: 'China',
  period: 'c. 495 CE -- present',
  description: 'Fajin (explosive power release) integrates breath with whole-body mechanics in kung fu',
  keyTexts: ['Yijin Jing (Muscle/Tendon Change Classic)'],
  modernContext: 'Practiced in Shaolin kung fu, Wing Chun, and internal martial arts',
});

export const martialBreath: RosettaConcept = {
  id: 'mb-breath-martial',
  name: 'Martial Breath',
  domain: 'mind-body',
  description:
    `A sharp, forceful exhale timed to the execution of a strike or technique. Not a scream -- ` +
    `a controlled expulsion of breath from the diaphragm. The breath tightens the core at the ` +
    `moment of impact, provides a timing mechanism, and can have a psychological effect on ` +
    `an opponent. ` +
    `\n\nHow to practice: Stand in a relaxed, natural stance. Inhale deeply through the nose ` +
    `into the belly. On a forward punch or palm strike, exhale sharply through the mouth with ` +
    `a short, forceful sound originating from the belly, not the throat. The abdomen should ` +
    `visibly contract during the exhalation. Practice with simple techniques: straight punch, ` +
    `front kick, downward block. Do not strain the throat -- the power comes from the diaphragm. ` +
    `\n\nWhy it works: The sharp exhale reflexively engages the transversus abdominis and ` +
    `obliques, creating a rigid cylinder of core support at the moment of impact. This ` +
    `transmits force efficiently through the kinetic chain. The vocalization also serves as a ` +
    `timing mechanism, ensuring the breath and technique peak simultaneously. ` +
    `\n\nCultural roots: Known as ${kiaiTerm}, ${kihapTerm}, and ${fajinTerm} across ` +
    `different martial traditions. ${bushidoCredit} ${shaolinCredit} This is the opposite ` +
    `end of the breath spectrum from meditation -- where breath counting cultivates stillness ` +
    `and observation, martial breath cultivates explosive power and timing. Both train ` +
    `conscious control of breathing.`,
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'mb-breath-diaphragmatic',
      description: 'Martial breath requires a strong diaphragmatic foundation -- the power originates from the same muscle',
    },
    {
      type: 'analogy',
      targetId: 'mb-breath-ujjayi',
      description: 'Both use controlled throat engagement -- ujjayi for sustained flow, martial breath for explosive release',
    },
    {
      type: 'cross-reference',
      targetId: 'mb-breath-counting',
      description: 'Opposite ends of the breath spectrum: counting cultivates stillness, martial breath cultivates explosive power',
    },
  ],
  complexPlanePosition: {
    real: 0.8,
    imaginary: -0.4,
    magnitude: Math.sqrt(0.64 + 0.16),
    angle: Math.atan2(-0.4, 0.8),
  },
};
