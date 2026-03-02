/**
 * Try Sessions barrel export for the Mind-Body department.
 *
 * All 8 Try Sessions -- one per wing. Each requires no equipment,
 * no special clothing, no minimum fitness level, and completes
 * in under 15 minutes. These are the zero-barrier entry points.
 *
 * @module departments/mind-body/try-sessions
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export { firstFiveMinutes } from './first-five-minutes.js';
export { meditationOneMinute } from './meditation-one-minute.js';
export { yogaFivePoses } from './yoga-five-poses.js';
export { pilatesBreath } from './pilates-breath.js';
export { horseStance } from './horse-stance.js';
export { taiChiCommencement } from './tai-chi-commencement.js';
export { threeMinuteReset } from './three-minute-reset.js';
export { teaMeditation } from './tea-meditation.js';

import { firstFiveMinutes } from './first-five-minutes.js';
import { meditationOneMinute } from './meditation-one-minute.js';
import { yogaFivePoses } from './yoga-five-poses.js';
import { pilatesBreath } from './pilates-breath.js';
import { horseStance } from './horse-stance.js';
import { taiChiCommencement } from './tai-chi-commencement.js';
import { threeMinuteReset } from './three-minute-reset.js';
import { teaMeditation } from './tea-meditation.js';

/**
 * All 8 Try Sessions in wing order (breath, meditation, yoga, pilates,
 * martial arts, tai chi, relaxation, philosophy).
 */
export const allTrySessions: TrySessionDefinition[] = [
  firstFiveMinutes,
  meditationOneMinute,
  yogaFivePoses,
  pilatesBreath,
  horseStance,
  taiChiCommencement,
  threeMinuteReset,
  teaMeditation,
];
