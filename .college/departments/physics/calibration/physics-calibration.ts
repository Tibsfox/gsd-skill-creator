/**
 * Physics Department Calibration Wiring
 *
 * Registers all physics domain calibration models with a CalibrationEngine.
 * Call registerPhysicsModels(engine) at startup to enable physics calibration.
 *
 * @module departments/physics/calibration/physics-calibration
 */

import type { CalibrationEngine } from '../../../calibration/engine.js';

/**
 * Register physics calibration models with the provided engine.
 *
 * Stub: registers no models yet — populated in Phase 27 test suite.
 * Models planned: kinematics measurement, force measurement, energy calculation accuracy
 */
export function registerPhysicsModels(engine: CalibrationEngine): void {
  // Models to be defined in calibration/models/physics.ts
  // Stub intentionally empty — implementation deferred to Phase 27
  void engine;
}
