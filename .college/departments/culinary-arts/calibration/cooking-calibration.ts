/**
 * Cooking Department Calibration Wiring
 *
 * Registers all 4 cooking domain calibration models with a CalibrationEngine.
 * Call registerCookingModels(engine) at startup to enable culinary calibration.
 *
 * @module departments/culinary-arts/calibration/cooking-calibration
 */

import type { CalibrationEngine } from '../../../calibration/engine.js';
import {
  temperatureModel,
  timingModel,
  seasoningModel,
  textureModel,
} from '../../../calibration/models/cooking.js';

/**
 * Register all 4 cooking calibration models with the provided engine.
 *
 * @throws TypeError if any model is already registered (use engine.replaceModel() for overrides)
 */
export function registerCookingModels(engine: CalibrationEngine): void {
  engine.registerModel(temperatureModel);
  engine.registerModel(timingModel);
  engine.registerModel(seasoningModel);
  engine.registerModel(textureModel);
}
