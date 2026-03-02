/**
 * Safety Warden
 *
 * Enforces safety modes per module and voltage range.
 * Three operating modes: Annotate (informational), Gate (acknowledgment),
 * Redirect (assessment required). Module assignments and voltage thresholds
 * derived from safety-rules.yaml (IEC 60449).
 *
 * All safety messages use positive framing — no negative/prohibitive language.
 * Professional context detection streamlines access for experienced users.
 *
 * SAFE-05 (EP): Positive framing for safety messages
 * Attack scenario: A safety message uses prohibitive language ("do not connect
 * to mains voltage") that triggers defensive reasoning, causing the user to
 * dismiss or work around the safety check rather than engage with it.
 * Consequence of absence: Safety messages produce avoidance behavior,
 * reducing actual safety compliance.
 *
 * SAFE-06 (EP): Professional context detection
 * Attack scenario: An experienced engineer is blocked by basic safety gates
 * designed for novices. Frustration causes them to misrepresent their context
 * or bypass the system entirely.
 * Consequence of absence: Expert users disengage from the safety system,
 * reducing compliance across the experienced-user population.
 *
 * SAFE-07 (EP): Safety assessment gate — see safety-assessments/assessments.ts
 * Assessment completion required before hazardous-voltage module access.
 *
 * SAFE-08 (EP): Voltage escalation to more restrictive mode
 * Attack scenario: A user accesses a low-risk module (e.g., annotate-mode)
 * while specifying a voltage that falls in a hazardous range. Without
 * escalation, the warden applies the module's default (lax) mode and
 * allows access that should require assessment.
 * Consequence of absence: Voltage-based hazard classification is ignored
 * when module mode is more permissive, allowing unsafe voltage work
 * without required safety gates.
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

/** Professional context signal detected in user input */
export interface ProfessionalSignal {
  type: 'equipment' | 'workplace' | 'compliance' | 'ratings';
  matched: string;
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
// Module topic names — human-readable names derived from module IDs
// ---------------------------------------------------------------------------

const MODULE_TOPICS: Record<string, string> = {
  '01-the-circuit': 'basic circuits',
  '02-passive-components': 'passive components',
  '03-the-signal': 'signal fundamentals',
  '04-diodes': 'diode circuits',
  '05-transistors': 'transistor circuits',
  '06-op-amps': 'operational amplifiers',
  '07-power-supplies': 'power supply design',
  '07a-logic-gates': 'logic gates',
  '08-sequential-logic': 'sequential logic',
  '09-data-conversion': 'data conversion',
  '10-dsp': 'digital signal processing',
  '11-microcontrollers': 'microcontroller systems',
  '12-sensors-actuators': 'sensors and actuators',
  '13-plc': 'programmable logic controllers',
  '14-off-grid-power': 'off-grid power systems',
  '15-pcb-design': 'PCB design and assembly',
};

// ---------------------------------------------------------------------------
// Professional context signal patterns
// ---------------------------------------------------------------------------

const PROFESSIONAL_PATTERNS: Array<{
  type: ProfessionalSignal['type'];
  terms: string[];
}> = [
  {
    type: 'equipment',
    terms: [
      'oscilloscope',
      'bench power supply',
      'multimeter',
      'function generator',
      'logic analyzer',
      'soldering station',
    ],
  },
  {
    type: 'workplace',
    terms: ['lab', 'workshop', 'workbench', 'company', 'facility', 'production'],
  },
  {
    type: 'compliance',
    terms: ['NEC', 'IEC', 'UL', 'CE marking', 'OSHA', 'RoHS', 'ISO'],
  },
  {
    type: 'ratings',
    terms: [
      'rated for',
      'voltage rating',
      'current capacity',
      'power dissipation',
      'derating',
      'breakdown voltage',
    ],
  },
];

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
 * Detect professional context signals in user input text.
 * Scans for equipment, workplace, compliance, and ratings terminology.
 * Returns an empty array if no professional signals are found.
 */
export function detectProfessionalContext(input: string): ProfessionalSignal[] {
  const lower = input.toLowerCase();
  const signals: ProfessionalSignal[] = [];

  for (const pattern of PROFESSIONAL_PATTERNS) {
    for (const term of pattern.terms) {
      if (lower.includes(term.toLowerCase())) {
        signals.push({ type: pattern.type, matched: term });
      }
    }
  }

  return signals;
}

/**
 * Generate a positive-framed safety message for a given mode and module.
 * Messages guide and empower — they use positive language exclusively.
 *
 * @param mode - the safety mode (Annotate, Gate, or Redirect)
 * @param moduleId - the module identifier for topic-specific messaging
 * @param professional - whether professional context was detected
 */
export function generateSafetyMessage(
  mode: SafetyMode,
  moduleId: string,
  professional: boolean,
): string {
  const topic = MODULE_TOPICS[moduleId] ?? moduleId;

  let message: string;

  switch (mode) {
    case SafetyMode.Annotate:
      message = `Here's how to work with ${topic} safely. You're in a safe voltage range for hands-on exploration.`;
      break;
    case SafetyMode.Gate:
      message = `You can proceed with ${topic} safely by following these guidelines. Please review and acknowledge the key practices before continuing.`;
      break;
    case SafetyMode.Redirect:
      message = `This ${topic} content involves voltages that require verified safety knowledge. Complete a brief safety check to unlock this content — it ensures you have the foundation to work safely.`;
      break;
  }

  if (professional) {
    message += ` Your professional background is noted — the safety check covers ${topic}-specific practices.`;
  }

  return message;
}

/**
 * Combined safety check: module mode + optional voltage classification.
 * Uses the MORE restrictive mode when voltage suggests a higher severity
 * than the module default. Optionally detects professional context from
 * user input text.
 */
export function checkSafety(
  moduleId: string,
  voltage?: number,
  userContext?: string,
): SafetyCheckResult {
  const moduleMode = getModuleMode(moduleId);
  let effectiveMode = moduleMode;
  let assessmentRequired = moduleMode === SafetyMode.Redirect;
  let voltageRange: VoltageRange | undefined;

  if (voltage !== undefined) {
    voltageRange = classifyVoltage(voltage);
    // SAFE-08 (EP): Escalate to more restrictive mode when voltage classification
    // exceeds module mode. See module JSDoc for threat model.
    // Escalate to the more restrictive mode
    if (MODE_SEVERITY[voltageRange.mode] > MODE_SEVERITY[effectiveMode]) {
      effectiveMode = voltageRange.mode;
    }
    assessmentRequired = voltageRange.requiresAssessment;
  }

  const professional = userContext
    ? detectProfessionalContext(userContext).length >= 2
    : false;

  const allowed = effectiveMode !== SafetyMode.Redirect;
  const message = generateSafetyMessage(effectiveMode, moduleId, professional);

  return {
    allowed,
    mode: effectiveMode,
    message,
    voltageRange,
    assessmentRequired,
  };
}
