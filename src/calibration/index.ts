/**
 * Calibration module for collecting and storing calibration events.
 *
 * Calibration events record skill activation decisions and user outcomes
 * to enable threshold calibration and accuracy benchmarking.
 */

// Types
export type {
  CalibrationOutcome,
  SkillScore,
  CalibrationEvent,
  CalibrationEventInput,
} from './calibration-types.js';

export {
  CalibrationOutcomeSchema,
  SkillScoreSchema,
  CalibrationEventSchema,
  CalibrationEventInputSchema,
} from './calibration-types.js';

// Store
export { CalibrationStore } from './calibration-store.js';
