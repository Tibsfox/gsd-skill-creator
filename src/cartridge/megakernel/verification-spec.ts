/**
 * HB-07 — robust-kbench-style verification doctrine (typed spec).
 *
 * v1.49.574 Half B, T2 if-budget.
 *
 * Derivation: M4 §4 Sakana incident lesson `mk_sakana_aice_2025`; robust-kbench
 * `mk_robust_kbench_2025`; SC-VER discipline at substrate level.
 *
 * Substrate-only: a typed `VerificationSpec` declaring how a candidate kernel
 * (or any LLM-driven generation surface) must be verified before its claimed
 * performance is admitted. NO concrete verification harness — that's a future
 * engineering mission. The spec is the contract that downstream LLM-generation
 * surfaces declare against.
 *
 * The doctrine is captured prose-form in
 * `docs/cartridge/megakernel/verification-doctrine.md`. This module ships
 * the typed spec the doctrine references.
 *
 * The Sakana 3.13× → 1.49× post-correction case is the canonical illustration:
 * a verification harness that admits exploitable shortcuts produces
 * unsupported speedup claims at scale. The spec encodes the structural
 * features of a robust harness (varied inputs, methodology declared,
 * verifier kind named, replication count).
 *
 * @module cartridge/megakernel/verification-spec
 */

import { z } from 'zod';

import { isMegakernelSubstrateEnabled } from './settings.js';

// ============================================================================
// Verification methodology — same enum as `traces/megakernel-trace`'s
// ObservedPerformanceSchema.verificationMethod, repeated here so the spec
// is self-contained. Maintained in sync.
// ============================================================================

export const VerificationMethodSchema = z.enum([
  'fixed-input',
  'randomized-fuzz',
  'robust-kbench-style',
  'reference-comparison',
  'unverified',
]);
export type VerificationMethod = z.infer<typeof VerificationMethodSchema>;

// ============================================================================
// Verifier kind — what does the verifier compare against?
// ============================================================================

export const VerifierKindSchema = z.enum([
  /** Compare against a PyTorch / NumPy reference implementation. */
  'reference-impl',
  /** Compare against an LLM-judge that has the spec but not the candidate. */
  'llm-judge',
  /** Cross-input invariants (commutativity, associativity, etc.) */
  'invariant-set',
  /** Property-based fuzz testing. */
  'property-based',
]);
export type VerifierKind = z.infer<typeof VerifierKindSchema>;

// ============================================================================
// Verification spec — the contract.
// ============================================================================

export const VerificationSpecSchema = z.object({
  /** Methodology — fixed-input is explicitly flagged as exploitable. */
  method: VerificationMethodSchema,
  /** Kind of verifier. */
  verifier: VerifierKindSchema,
  /** Number of input replications used to compute the headline result. */
  replicationCount: z.number().int().min(1),
  /** Are inputs varied across replications? */
  variedInputs: z.boolean(),
  /** Numerical tolerance for correctness. */
  numericalTolerance: z.number().nonnegative().optional(),
  /** Optional reference implementation identifier. */
  referenceImpl: z.string().optional(),
  /** Caller-provided notes on the verification setup. */
  notes: z.string().optional(),
}).strict();
export type VerificationSpec = z.infer<typeof VerificationSpecSchema>;

// ============================================================================
// Audit findings — what the spec analyzer says about a candidate spec.
// ============================================================================

export const VerificationSpecSeveritySchema = z.enum(['INFO', 'WARN', 'BLOCK']);
export type VerificationSpecSeverity = z.infer<typeof VerificationSpecSeveritySchema>;

export interface VerificationSpecFinding {
  severity: VerificationSpecSeverity;
  rule: string;
  message: string;
}

export interface VerificationSpecAuditResult {
  ok: boolean;
  disabled: boolean;
  findings: ReadonlyArray<VerificationSpecFinding>;
}

const DISABLED_AUDIT: VerificationSpecAuditResult = Object.freeze({
  ok: true,
  disabled: true,
  findings: Object.freeze([]) as ReadonlyArray<VerificationSpecFinding>,
});

// ============================================================================
// Public API.
// ============================================================================

/**
 * Audit a `VerificationSpec` against the doctrine rules. Returns the
 * disabled-result when the substrate flag is off; otherwise:
 *
 *   - BLOCK if `method === 'unverified'` (refuse to admit performance claims)
 *   - BLOCK if `method === 'fixed-input'` AND `replicationCount === 1`
 *     AND `!variedInputs` (the Sakana failure shape)
 *   - WARN if `replicationCount < 8` (low statistical power)
 *   - WARN if `method === 'fixed-input'` regardless of replication
 *   - WARN if `verifier === 'llm-judge'` and `numericalTolerance === undefined`
 *     (LLM judges accept by default; tolerance discipline matters)
 *   - INFO otherwise
 */
export function auditVerificationSpec(
  input: unknown,
  settingsPath?: string,
): VerificationSpecAuditResult {
  if (!isMegakernelSubstrateEnabled('verification-doctrine', settingsPath)) {
    return DISABLED_AUDIT;
  }

  const findings: VerificationSpecFinding[] = [];
  const parsed = VerificationSpecSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      disabled: false,
      findings: [{
        severity: 'BLOCK',
        rule: 'spec-shape',
        message: parsed.error.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
      }],
    };
  }
  const spec = parsed.data;

  if (spec.method === 'unverified') {
    findings.push({
      severity: 'BLOCK',
      rule: 'no-unverified',
      message: 'spec.method=unverified — refuse to admit performance claims (SC-VER doctrine)',
    });
  }

  if (spec.method === 'fixed-input' && spec.replicationCount === 1 && !spec.variedInputs) {
    findings.push({
      severity: 'BLOCK',
      rule: 'sakana-shape',
      message: 'fixed-input + single replication + un-varied inputs is the Sakana incident failure shape',
    });
  } else if (spec.method === 'fixed-input') {
    findings.push({
      severity: 'WARN',
      rule: 'fixed-input-discouraged',
      message: 'fixed-input methodology is exploitable; prefer robust-kbench-style',
    });
  }

  if (spec.replicationCount < 8) {
    findings.push({
      severity: 'WARN',
      rule: 'low-replication',
      message: `replicationCount=${spec.replicationCount} has low statistical power (recommend ≥8)`,
    });
  }

  if (spec.verifier === 'llm-judge' && spec.numericalTolerance === undefined) {
    findings.push({
      severity: 'WARN',
      rule: 'llm-judge-without-tolerance',
      message: 'llm-judge verifier without numericalTolerance can over-accept; declare tolerance',
    });
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'INFO',
      rule: 'pass',
      message: 'spec passes all doctrine checks',
    });
  }

  const ok = !findings.some((f) => f.severity === 'BLOCK');
  return { ok, disabled: false, findings };
}

/** Schema version. */
export const VERIFICATION_SPEC_VERSION = '1.0.0' as const;
