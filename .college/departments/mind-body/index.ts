/**
 * Mind-Body Department -- public API barrel export.
 *
 * Provides a clean import path for downstream consumers:
 *   import { TrainingHall, mindBodyDepartment } from '.college/departments/mind-body/index.js';
 *
 * @module departments/mind-body
 */

// Domain types
export type {
  MindBodyWingId,
  Technique,
  Practice,
  CulturalContext,
  Tradition,
  TrainingHallView,
  TrainingHallOption,
  TrainingHallOptionId,
  SessionTemplate,
  JournalEntry,
  SafetyCondition,
} from './types.js';

// Training Hall
export { TrainingHall, renderTrainingHall } from './training-hall.js';

// Cultural Framework
export {
  creditTradition,
  renderTerminology,
  checkCulturalBalance,
  CulturalFramework,
  createCoreTraditions,
} from './cultural-framework.js';

// Department Definition
export {
  mindBodyDepartment,
  registerMindBodyDepartment,
} from './mind-body-department.js';
