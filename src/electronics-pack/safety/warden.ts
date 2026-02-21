/**
 * Safety Warden
 *
 * Enforces safety modes per module and voltage range.
 * To be implemented in Phase 266.
 */

/** Safety operating modes */
export enum SafetyMode {
  /** Notes only — no blocking. Modules 1-3, 7A, 8. */
  Annotate = 'annotate',
  /** Acknowledgment required before proceeding. Modules 4-7, 9-12, 15. */
  Gate = 'gate',
  /** Safety assessment required. Modules 13-14. */
  Redirect = 'redirect',
}

/** Voltage range classification */
export interface VoltageRange {
  min: number;  // volts
  max: number;  // volts
  mode: SafetyMode;
  requiresAssessment: boolean;
  label: string;
}

/** Safety assessment result */
export interface SafetyAssessment {
  moduleId: string;
  passed: boolean;
  score: number;
  timestamp: number;
  questions: number;
  correct: number;
}

/** Safety check result returned by the warden */
export interface SafetyCheckResult {
  allowed: boolean;
  mode: SafetyMode;
  message: string;
  voltageRange?: VoltageRange;
  assessmentRequired: boolean;
}
