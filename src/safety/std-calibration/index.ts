/**
 * HB-03 STD Calibration — barrel export.
 *
 * v1.49.575 cs25-26-sweep Half B. Source: arXiv:2604.20911.
 * Default-off via `cs25-26-sweep.std-calibration.enabled`.
 * **CAPCOM HARD GATE** — touches Safety Warden BLOCK timing; calibration
 * update + fail-closed activation both require explicit human authorization
 * via the `.planning/safety/std-calibration.capcom` marker file.
 *
 * @module safety/std-calibration
 */

// Settings.
export type { StdCalibrationConfig } from './settings.js';
export {
  DEFAULT_STD_CALIBRATION_CONFIG,
  isStdCalibrationEnabled,
  readStdCalibrationConfig,
} from './settings.js';

// Types.
export type {
  CalibratedModel,
  StdCalibration,
  StagedStdCalibration,
  CalibrationTable,
  ReInjectionDecision,
  BootstrapState,
  CapcomGateReason,
  CapcomGateRecord,
  CapcomGateResult,
  DecayMeasurementResult,
  DecayTrial,
  DecayTrialTurn,
} from './types.js';
export {
  STD_CALIBRATION_SCHEMA_VERSION,
  BOOTSTRAP_STD_FLOOR,
  DEFAULT_COMPLIANCE_TOLERANCE,
} from './types.js';

// Decay measurement.
export {
  measureDecay,
  DECAY_MEASUREMENT_DISABLED_RESULT,
} from './decay-measurement.js';

// Calibration table.
export {
  readTable,
  writeTable,
  lookupCalibration,
  stageCalibration,
  promoteStaged,
  defaultTablePath,
  EMPTY_CALIBRATION_TABLE,
} from './calibration-table.js';

// CAPCOM HARD GATE.
export {
  emitCapcomGate,
  isCapcomAuthorized,
  defaultCapcomMarkerPath,
  CAPCOM_GATE_DISABLED_RESULT,
} from './capcom-gate.js';

// Bootstrap.
export {
  evaluateBootstrap,
  isExplicitTriggerRecorded,
  resetBootstrapLatch,
  defaultTriggerMarkerPath,
  BOOTSTRAP_DISABLED_STATE,
} from './bootstrap.js';

// Re-injection middleware.
export {
  decideReInjection,
  RE_INJECTION_DISABLED_DECISION,
} from './re-injection.js';
