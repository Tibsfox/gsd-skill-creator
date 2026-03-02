/**
 * Tai Chi Wing -- Moving Meditation
 *
 * Tai chi principles, Zhan Zhuang standing meditation, Beijing 24 Form,
 * push hands conceptual principles, evidence-based health research, and
 * yin-yang movement philosophy.
 *
 * @module departments/mind-body/concepts/tai-chi
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export { taiChiPrinciples } from './tai-chi-principles.js';
export { zhanZhuang } from './zhan-zhuang.js';
export { beijing24Form } from './beijing-24-form.js';
export { pushHandsConcepts } from './push-hands-concepts.js';
export { healthResearch } from './health-research.js';
export { yinYangMovement } from './yin-yang-movement.js';

import { taiChiPrinciples } from './tai-chi-principles.js';
import { zhanZhuang } from './zhan-zhuang.js';
import { beijing24Form } from './beijing-24-form.js';
import { pushHandsConcepts } from './push-hands-concepts.js';
import { healthResearch } from './health-research.js';
import { yinYangMovement } from './yin-yang-movement.js';

/** All 6 tai chi concepts as a single array for wing loading */
export const allTaiChiConcepts: RosettaConcept[] = [
  taiChiPrinciples,
  zhanZhuang,
  beijing24Form,
  pushHandsConcepts,
  healthResearch,
  yinYangMovement,
];
