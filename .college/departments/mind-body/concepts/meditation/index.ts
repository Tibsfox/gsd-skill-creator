/**
 * Meditation Wing -- Stillness
 *
 * Six meditation practices: mindfulness (vipassana), concentration (samatha),
 * zazen, body scan, walking meditation (kinhin), and loving-kindness (metta).
 *
 * @module departments/mind-body/concepts/meditation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export { mindfulnessVipassana } from './mindfulness-vipassana.js';
export { concentrationSamatha } from './concentration-samatha.js';
export { zazen } from './zazen.js';
export { bodyScan } from './body-scan.js';
export { walkingMeditationKinhin } from './walking-meditation-kinhin.js';
export { lovingKindnessMetta } from './loving-kindness-metta.js';

import { mindfulnessVipassana } from './mindfulness-vipassana.js';
import { concentrationSamatha } from './concentration-samatha.js';
import { zazen } from './zazen.js';
import { bodyScan } from './body-scan.js';
import { walkingMeditationKinhin } from './walking-meditation-kinhin.js';
import { lovingKindnessMetta } from './loving-kindness-metta.js';

/** All 6 meditation concepts in teaching order */
export const allMeditationConcepts: RosettaConcept[] = [
  mindfulnessVipassana,
  concentrationSamatha,
  zazen,
  bodyScan,
  walkingMeditationKinhin,
  lovingKindnessMetta,
];
