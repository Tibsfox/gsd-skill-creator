/**
 * Pilates Wing -- Strength
 *
 * Powerhouse activation, the six principles, mat work progressions,
 * alignment cueing, and rehabilitation applications.
 *
 * 12 concepts: Powerhouse, 6 principles, 8 mat exercises,
 * neutral spine alignment, and rehabilitation applications.
 *
 * @module departments/mind-body/concepts/pilates
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export { powerhouseConcept } from './powerhouse-concept.js';
export { sixPrinciples } from './six-principles.js';
export { theHundred } from './the-hundred.js';
export { rollUp } from './roll-up.js';
export { singleLegStretch } from './single-leg-stretch.js';
export { doubleLegStretch } from './double-leg-stretch.js';
export { spineStretch } from './spine-stretch.js';
export { swan } from './swan.js';
export { sideKickSeries } from './side-kick-series.js';
export { teaser } from './teaser.js';
export { neutralSpineAlignment } from './neutral-spine-alignment.js';
export { rehabApplications } from './rehab-applications.js';

import { powerhouseConcept } from './powerhouse-concept.js';
import { sixPrinciples } from './six-principles.js';
import { theHundred } from './the-hundred.js';
import { rollUp } from './roll-up.js';
import { singleLegStretch } from './single-leg-stretch.js';
import { doubleLegStretch } from './double-leg-stretch.js';
import { spineStretch } from './spine-stretch.js';
import { swan } from './swan.js';
import { sideKickSeries } from './side-kick-series.js';
import { teaser } from './teaser.js';
import { neutralSpineAlignment } from './neutral-spine-alignment.js';
import { rehabApplications } from './rehab-applications.js';

/** All 12 pilates concepts as an array for iteration and registration */
export const allPilatesConcepts: RosettaConcept[] = [
  powerhouseConcept,
  sixPrinciples,
  theHundred,
  rollUp,
  singleLegStretch,
  doubleLegStretch,
  spineStretch,
  swan,
  sideKickSeries,
  teaser,
  neutralSpineAlignment,
  rehabApplications,
];
