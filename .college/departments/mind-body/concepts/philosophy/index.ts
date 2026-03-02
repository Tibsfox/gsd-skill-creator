/**
 * Philosophy Wing -- The Zen of Practice
 *
 * Zen philosophy, Taoism, Yoga Sutras, martial virtues (Bushido/Wude/Mudo),
 * mindfulness in daily life, and beginner's mind (shoshin).
 *
 * Philosophy is the thread that connects all eight wings of the Mind-Body
 * department. These are practical frameworks for understanding why we
 * practice, not religious instruction.
 *
 * @module departments/mind-body/concepts/philosophy
 */

export { zenPhilosophy } from './zen-philosophy.js';
export { taoismTaoTeChing } from './taoism-tao-te-ching.js';
export { yogaSutrasPatanjali } from './yoga-sutras-patanjali.js';
export { martialVirtuesBushidoWude } from './martial-virtues-bushido-wude.js';
export { mindfulnessDailyLife } from './mindfulness-daily-life.js';
export { beginnersMindShoshin } from './beginners-mind-shoshin.js';

import type { RosettaConcept } from '../../../../rosetta-core/types.js';
import { zenPhilosophy } from './zen-philosophy.js';
import { taoismTaoTeChing } from './taoism-tao-te-ching.js';
import { yogaSutrasPatanjali } from './yoga-sutras-patanjali.js';
import { martialVirtuesBushidoWude } from './martial-virtues-bushido-wude.js';
import { mindfulnessDailyLife } from './mindfulness-daily-life.js';
import { beginnersMindShoshin } from './beginners-mind-shoshin.js';

/** All 6 philosophy concepts for wing registration */
export const allPhilosophyConcepts: RosettaConcept[] = [
  zenPhilosophy,
  taoismTaoTeChing,
  yogaSutrasPatanjali,
  martialVirtuesBushidoWude,
  mindfulnessDailyLife,
  beginnersMindShoshin,
];
