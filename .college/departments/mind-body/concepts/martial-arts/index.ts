/**
 * Martial Arts Wing -- The Fighting Arts
 *
 * History, philosophy, stances, strikes, blocks, a simple form, and style
 * overviews spanning Chinese, Japanese, Korean, Southeast Asian, Brazilian,
 * and modern traditions. All content is framed for solo practice only.
 *
 * @module departments/mind-body/concepts/martial-arts
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export { historyPhilosophy } from './history-philosophy.js';
export { hardSoftDistinction } from './hard-soft-distinction.js';
export { internalExternal } from './internal-external.js';
export { martialVirtues } from './martial-virtues.js';
export { horseStance } from './horse-stance.js';
export { bowStance } from './bow-stance.js';
export { catStance } from './cat-stance.js';
export { basicStrikes } from './basic-strikes.js';
export { basicBlocks } from './basic-blocks.js';
export { simpleForm } from './simple-form.js';
export { styleOverview } from './style-overview.js';

import { historyPhilosophy } from './history-philosophy.js';
import { hardSoftDistinction } from './hard-soft-distinction.js';
import { internalExternal } from './internal-external.js';
import { martialVirtues } from './martial-virtues.js';
import { horseStance } from './horse-stance.js';
import { bowStance } from './bow-stance.js';
import { catStance } from './cat-stance.js';
import { basicStrikes } from './basic-strikes.js';
import { basicBlocks } from './basic-blocks.js';
import { simpleForm } from './simple-form.js';
import { styleOverview } from './style-overview.js';

/** All 11 martial arts concepts as a single array for wing loading */
export const allMartialArtsConcepts: RosettaConcept[] = [
  historyPhilosophy,
  hardSoftDistinction,
  internalExternal,
  martialVirtues,
  horseStance,
  bowStance,
  catStance,
  basicStrikes,
  basicBlocks,
  simpleForm,
  styleOverview,
];
