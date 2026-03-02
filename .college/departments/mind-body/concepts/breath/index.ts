/**
 * Breath Wing -- The Universal Foundation
 *
 * Five breathing techniques spanning diaphragmatic breathing, box breathing,
 * ujjayi, counting methods, and martial breath control. Breath is the
 * universal foundation of all mind-body practice.
 *
 * @module departments/mind-body/concepts/breath
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export { diaphragmaticBreathing } from './diaphragmatic-breathing.js';
export { boxBreathing } from './box-breathing.js';
export { ujjayiBreath } from './ujjayi-breath.js';
export { breathCounting } from './breath-counting.js';
export { martialBreath } from './martial-breath.js';

import { diaphragmaticBreathing } from './diaphragmatic-breathing.js';
import { boxBreathing } from './box-breathing.js';
import { ujjayiBreath } from './ujjayi-breath.js';
import { breathCounting } from './breath-counting.js';
import { martialBreath } from './martial-breath.js';

/** All 5 breath concepts in teaching order */
export const allBreathConcepts: RosettaConcept[] = [
  diaphragmaticBreathing,
  boxBreathing,
  ujjayiBreath,
  breathCounting,
  martialBreath,
];
