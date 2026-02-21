/**
 * Safety Warden
 *
 * Enforces safety modes per module and voltage range.
 * Three operating modes: Annotate (informational), Gate (acknowledgment),
 * Redirect (assessment required). Module assignments and voltage thresholds
 * derived from safety-rules.yaml (IEC 60449).
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

// ---------------------------------------------------------------------------
// Constants — hardcoded from safety-rules.yaml (source of truth)
// ---------------------------------------------------------------------------

/** Module-to-safety-mode mapping for all 16 modules */
export const MODULE_MODES: Record<string, SafetyMode> = {
  '01-the-circuit': SafetyMode.Annotate,
  '02-passive-components': SafetyMode.Annotate,
  '03-the-signal': SafetyMode.Annotate,
  '04-diodes': SafetyMode.Gate,
  '05-transistors': SafetyMode.Gate,
  '06-op-amps': SafetyMode.Gate,
  '07-power-supplies': SafetyMode.Gate,
  '07a-logic-gates': SafetyMode.Annotate,
  '08-sequential-logic': SafetyMode.Annotate,
  '09-data-conversion': SafetyMode.Gate,
  '10-dsp': SafetyMode.Gate,
  '11-microcontrollers': SafetyMode.Gate,
  '12-sensors-actuators': SafetyMode.Gate,
  '13-plc': SafetyMode.Redirect,
  '14-off-grid-power': SafetyMode.Redirect,
  '15-pcb-design': SafetyMode.Gate,
};

/** IEC 60449 voltage thresholds — min inclusive, max exclusive */
export const VOLTAGE_RANGES: readonly VoltageRange[] = [
  { min: 0, max: 12, mode: SafetyMode.Annotate, requiresAssessment: false, label: 'Extra-low voltage (ELV)' },
  { min: 12, max: 48, mode: SafetyMode.Gate, requiresAssessment: false, label: 'Safe extra-low voltage (SELV)' },
  { min: 48, max: 120, mode: SafetyMode.Gate, requiresAssessment: true, label: 'Low voltage' },
  { min: 120, max: Infinity, mode: SafetyMode.Redirect, requiresAssessment: true, label: 'Hazardous voltage' },
];

// ---------------------------------------------------------------------------
// Mode severity for escalation comparison
// ---------------------------------------------------------------------------

const MODE_SEVERITY: Record<SafetyMode, number> = {
  [SafetyMode.Annotate]: 0,
  [SafetyMode.Gate]: 1,
  [SafetyMode.Redirect]: 2,
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up the safety mode for a given module ID.
 * @throws Error if moduleId is not a known module
 */
export function getModuleMode(moduleId: string): SafetyMode {
  const mode = MODULE_MODES[moduleId];
  if (mode === undefined) {
    throw new Error(`Unknown module: ${moduleId}`);
  }
  return mode;
}

/**
 * Classify a voltage into the appropriate range.
 * Ranges use min-inclusive, max-exclusive boundaries.
 * @throws Error if voltage is negative
 */
export function classifyVoltage(voltage: number): VoltageRange {
  if (voltage < 0) {
    throw new Error(`Voltage must be non-negative, got ${voltage}`);
  }
  for (const range of VOLTAGE_RANGES) {
    if (voltage >= range.min && voltage < range.max) {
      return range;
    }
  }
  // Should never reach here given Infinity upper bound, but guard anyway
  return VOLTAGE_RANGES[VOLTAGE_RANGES.length - 1];
}

/**
 * Combined safety check: module mode + optional voltage classification.
 * Uses the MORE restrictive mode when voltage suggests a higher severity
 * than the module default.
 */
export function checkSafety(moduleId: string, voltage?: number): SafetyCheckResult {
  const moduleMode = getModuleMode(moduleId);
  let effectiveMode = moduleMode;
  let assessmentRequired = moduleMode === SafetyMode.Redirect;
  let voltageRange: VoltageRange | undefined;

  if (voltage !== undefined) {
    voltageRange = classifyVoltage(voltage);
    // Escalate to the more restrictive mode
    if (MODE_SEVERITY[voltageRange.mode] > MODE_SEVERITY[effectiveMode]) {
      effectiveMode = voltageRange.mode;
    }
    assessmentRequired = voltageRange.requiresAssessment;
  }

  const allowed = effectiveMode !== SafetyMode.Redirect;
  const message = buildMessage(effectiveMode);

  return {
    allowed,
    mode: effectiveMode,
    message,
    voltageRange,
    assessmentRequired,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildMessage(mode: SafetyMode): string {
  switch (mode) {
    case SafetyMode.Annotate:
      return 'Safe to proceed';
    case SafetyMode.Gate:
      return 'Review safety guidelines before proceeding';
    case SafetyMode.Redirect:
      return 'Complete safety assessment to access this content';
  }
}
