/**
 * Relaxation Wing -- Release
 *
 * Progressive muscle relaxation, yoga nidra, myofascial release,
 * stretching protocols, sleep hygiene, and nervous system regulation.
 *
 * Recovery is not optional -- it is an essential component of every
 * practice. Every technique here activates the parasympathetic
 * nervous system through a specific physiological pathway.
 *
 * @module departments/mind-body/concepts/relaxation
 */

export { progressiveMuscleRelaxation } from './progressive-muscle-relaxation.js';
export { yogaNidra } from './yoga-nidra.js';
export { myofascialRelease } from './myofascial-release.js';
export { stretchingProtocols } from './stretching-protocols.js';
export { sleepHygiene } from './sleep-hygiene.js';
export { nervousSystem } from './nervous-system.js';

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { progressiveMuscleRelaxation } from './progressive-muscle-relaxation.js';
import { yogaNidra } from './yoga-nidra.js';
import { myofascialRelease } from './myofascial-release.js';
import { stretchingProtocols } from './stretching-protocols.js';
import { sleepHygiene } from './sleep-hygiene.js';
import { nervousSystem } from './nervous-system.js';

/** All 6 relaxation concepts for wing registration */
export const allRelaxationConcepts: RosettaConcept[] = [
  progressiveMuscleRelaxation,
  yogaNidra,
  myofascialRelease,
  stretchingProtocols,
  sleepHygiene,
  nervousSystem,
];
