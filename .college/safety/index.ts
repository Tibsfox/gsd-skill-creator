/**
 * Safety module -- SafetyWarden and AllergenManager.
 *
 * Provides absolute food safety enforcement (temperature floors, danger zone tracking)
 * and non-negotiable allergen flagging for ingredient substitutions.
 *
 * @module safety
 */

// Core safety enforcement
export { SafetyWarden } from './safety-warden.js';

// Allergen management
export { AllergenManager } from './allergen-manager.js';

// Types
export type {
  SafetyMode,
  SafetyCheckInput,
  SafetyCheckResult,
  DangerZoneEntry,
  AllergenFlag,
  SubstitutionCheck,
} from './types.js';
