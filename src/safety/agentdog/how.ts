/**
 * HB-02 AgentDoG — `How` axis.
 *
 * Records the vulnerability vector + escalation pattern for a Safety
 * Warden BLOCK decision. The `How` axis answers: "what was the attack
 * shape and how did it try to escalate?"
 *
 * Source: arXiv:2601.18491 (AgentDoG).
 *
 * @module safety/agentdog/how
 */

/**
 * Vulnerability vector — closed enum of named attack shapes.
 *
 * `unknown` is the safe fallback for novel BLOCKs that don't pattern-match
 * any known vector; the 4B sidecar can refine these once it's wired in.
 */
export type VulnerabilityVector =
  | 'prompt-injection'
  | 'metadata-poisoning'
  | 'function-hijacking'
  | 'capability-overreach'
  | 'data-exfiltration'
  | 'credential-leak'
  | 'unknown';

/**
 * Escalation pattern — how the attack attempted to escalate.
 */
export type EscalationPattern =
  | 'lateral'
  | 'vertical'
  | 'persistence'
  | 'cross-session'
  | 'cross-project'
  | 'none'
  | 'unknown';

/**
 * `How` axis.
 */
export interface HowAxis {
  readonly vulnerabilityVector: VulnerabilityVector;
  readonly escalationPattern: EscalationPattern;
}

const VECTOR_VALUES: ReadonlySet<VulnerabilityVector> = new Set<VulnerabilityVector>([
  'prompt-injection',
  'metadata-poisoning',
  'function-hijacking',
  'capability-overreach',
  'data-exfiltration',
  'credential-leak',
  'unknown',
]);

const ESCALATION_VALUES: ReadonlySet<EscalationPattern> = new Set<EscalationPattern>([
  'lateral',
  'vertical',
  'persistence',
  'cross-session',
  'cross-project',
  'none',
  'unknown',
]);

/**
 * Capture the `How` axis from BLOCK context. Unknown values fall back to
 * `unknown`; the schema is intentionally permissive at capture time so a
 * BLOCK is never lost — drift is then caught downstream by the schema-shape
 * validator.
 */
export function captureHowAxis(input: {
  vulnerabilityVector?: string;
  escalationPattern?: string;
}): HowAxis {
  const vec =
    typeof input.vulnerabilityVector === 'string' &&
    VECTOR_VALUES.has(input.vulnerabilityVector as VulnerabilityVector)
      ? (input.vulnerabilityVector as VulnerabilityVector)
      : 'unknown';
  const esc =
    typeof input.escalationPattern === 'string' &&
    ESCALATION_VALUES.has(input.escalationPattern as EscalationPattern)
      ? (input.escalationPattern as EscalationPattern)
      : 'unknown';
  return Object.freeze({ vulnerabilityVector: vec, escalationPattern: esc });
}

export const VULNERABILITY_VECTORS: ReadonlyArray<VulnerabilityVector> = Array.from(VECTOR_VALUES);
export const ESCALATION_PATTERNS: ReadonlyArray<EscalationPattern> = Array.from(ESCALATION_VALUES);
