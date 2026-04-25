/**
 * HB-03 STD Calibration — types.
 *
 * Source: arXiv:2604.20911 (Omission Constraints Decay While Commission
 * Constraints Persist; 4416-trial study; prohibition decay 73%→33% by
 * turn 16).
 *
 * Safe-Turn-Depth (STD) is the conversation depth (in turns) before a
 * model's omission-constraint compliance falls below tolerance. The
 * calibration table records per-model STD; the re-injection middleware
 * fires when conversation depth approaches a model's STD floor.
 *
 * @module safety/std-calibration/types
 */

/** Models the calibration table tracks. */
export type CalibratedModel = 'opus' | 'sonnet' | 'haiku';

/** Schema version for the persisted calibration table. */
export const STD_CALIBRATION_SCHEMA_VERSION = '1.0.0' as const;

/** Conservative bootstrap STD floor — paper's lowest reported decay turn. */
export const BOOTSTRAP_STD_FLOOR = 5 as const;

/** Compliance tolerance — STD is the depth at which compliance crosses this floor. */
export const DEFAULT_COMPLIANCE_TOLERANCE = 0.5 as const;

/** Per-model calibration record persisted in the table. */
export interface StdCalibration {
  readonly model: CalibratedModel;
  /** Safe-turn-depth (in turns) measured for this model. */
  readonly std: number;
  /** ISO-8601 timestamp of the measurement. */
  readonly measuredAt: string;
  /** Number of synthetic trials that produced this measurement. */
  readonly trialCount: number;
  /** Compliance fraction at the STD threshold (0..1). */
  readonly complianceAtStd: number;
}

/** A staged calibration awaiting CAPCOM authorization to become active. */
export interface StagedStdCalibration extends StdCalibration {
  readonly stagedAt: string;
  /** Prior STD value being replaced (null if first calibration for this model). */
  readonly previousStd: number | null;
}

/** Persisted calibration-table shape. */
export interface CalibrationTable {
  readonly schemaVersion: typeof STD_CALIBRATION_SCHEMA_VERSION;
  readonly entries: ReadonlyArray<StdCalibration>;
  /** Calibrations awaiting human authorization (CAPCOM gate). */
  readonly staged?: ReadonlyArray<StagedStdCalibration>;
}

/** Result of a re-injection-middleware decision. */
export interface ReInjectionDecision {
  readonly triggered: boolean;
  readonly depth: number;
  readonly std: number;
  readonly model: CalibratedModel | null;
  readonly constraintsReinjected: ReadonlyArray<string>;
  /** Indicates the decision used the bootstrap conservative floor. */
  readonly usedBootstrapFloor: boolean;
  /** True when flag is off; the decision is a no-op. */
  readonly disabled: boolean;
}

/** Bootstrap state — what the system did on first run / when no calibration exists. */
export interface BootstrapState {
  readonly engaged: boolean;
  readonly conservativeStd: number;
  readonly warned: boolean;
  /** Whether the user has run `npx skill-creator safety std-calibrate <model>`. */
  readonly explicitTriggerRecorded: boolean;
  readonly disabled: boolean;
}

/** CAPCOM gate trigger reason — fires for both update + fail-closed activation. */
export type CapcomGateReason = 'calibration-update' | 'fail-closed-activation';

/** Single CAPCOM gate emission record. */
export interface CapcomGateRecord {
  readonly reason: CapcomGateReason;
  readonly model: CalibratedModel | null;
  readonly proposedStd: number | null;
  readonly previousStd: number | null;
  readonly timestamp: string;
  readonly authorized: boolean;
  /** Free-form note (e.g., bootstrap conservative floor activated). */
  readonly note: string;
}

/** Result of a CAPCOM gate check. */
export interface CapcomGateResult {
  readonly emitted: boolean;
  readonly authorized: boolean;
  readonly disabled: boolean;
  readonly record: CapcomGateRecord | null;
}

/** Result of a calibration measurement run. */
export interface DecayMeasurementResult {
  readonly model: CalibratedModel;
  readonly std: number;
  readonly trialCount: number;
  readonly complianceAtStd: number;
  /** Per-turn compliance fractions in trial order. */
  readonly perTurnCompliance: ReadonlyArray<number>;
  readonly disabled: boolean;
}

/** A single synthetic trial transcript turn used by the measurement harness. */
export interface DecayTrialTurn {
  readonly turn: number;
  /** True if the omission constraint was honored at this turn. */
  readonly compliant: boolean;
}

/** A single synthetic trial — many turns long. */
export interface DecayTrial {
  readonly trialId: string;
  readonly turns: ReadonlyArray<DecayTrialTurn>;
}
