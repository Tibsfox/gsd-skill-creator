/**
 * Chemistry Department Calibration Wiring
 *
 * Registers all chemistry domain calibration models with a CalibrationEngine.
 * Call registerChemistryModels(engine) at startup to enable chemistry calibration.
 *
 * @module departments/chemistry/calibration/chemistry-calibration
 */

import type { CalibrationEngine } from '../../../calibration/engine.js';

/**
 * Register chemistry calibration models with the provided engine.
 *
 * Stub: registers no models yet — populated in Phase 27 test suite.
 * Models planned: stoichiometry accuracy, equation balancing, pH calculation
 */
export function registerChemistryModels(engine: CalibrationEngine): void {
  // Models to be defined in calibration/models/chemistry.ts
  // Stub intentionally empty — implementation deferred to Phase 27
  void engine;
}
