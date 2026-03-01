/**
 * Yoga Wing -- Flow
 *
 * Poses (asanas), sequences (vinyasa), breath-movement linking,
 * and styles from Hatha to Ashtanga.
 *
 * 10 concepts: 7 foundation poses, Sun Salutation sequence,
 * breath-movement linking principle, and styles overview.
 *
 * @module departments/mind-body/concepts/yoga
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export { mountainTadasana } from './mountain-tadasana.js';
export { downwardDog } from './downward-dog.js';
export { warriorPoses } from './warrior-poses.js';
export { treeVrksasana } from './tree-vrksasana.js';
export { childsPoseBalasana } from './childs-pose-balasana.js';
export { corpseSavasana } from './corpse-savasana.js';
export { forwardFold } from './forward-fold.js';
export { sunSalutation } from './sun-salutation.js';
export { breathMovementLinking } from './breath-movement-linking.js';
export { yogaStylesOverview } from './yoga-styles-overview.js';

import { mountainTadasana } from './mountain-tadasana.js';
import { downwardDog } from './downward-dog.js';
import { warriorPoses } from './warrior-poses.js';
import { treeVrksasana } from './tree-vrksasana.js';
import { childsPoseBalasana } from './childs-pose-balasana.js';
import { corpseSavasana } from './corpse-savasana.js';
import { forwardFold } from './forward-fold.js';
import { sunSalutation } from './sun-salutation.js';
import { breathMovementLinking } from './breath-movement-linking.js';
import { yogaStylesOverview } from './yoga-styles-overview.js';

/** All 10 yoga concepts as an array for iteration and registration */
export const allYogaConcepts: RosettaConcept[] = [
  mountainTadasana,
  downwardDog,
  warriorPoses,
  treeVrksasana,
  childsPoseBalasana,
  corpseSavasana,
  forwardFold,
  sunSalutation,
  breathMovementLinking,
  yogaStylesOverview,
];
