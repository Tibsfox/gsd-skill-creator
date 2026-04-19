/**
 * MD-6 Representation Audit — settings.
 *
 * Feature flag: `gsd-skill-creator.embeddings.audit.enabled`.
 * Default OFF (SC-MD6-01): audit does not run unless the flag is explicitly
 * set to `true`. This prevents any M1/M8 behaviour changes in the default
 * installation.
 *
 * Threshold is configurable per E-2 (open question: calibration against
 * historical session data). Default 0.3 is the Huh 2023 §2 heuristic.
 *
 * @module representation-audit/settings
 */

// ─── Settings shape ──────────────────────────────────────────────────────────

export interface AuditSettings {
  /**
   * Master gate.  Default false (SC-MD6-01).
   *
   * When false, `collapseDetector` returns `{ status: 'disabled' }` and the
   * CLI prints "audit disabled".  No M1 reads, no M8 emissions.
   */
  enabled: boolean;

  /**
   * Effective-rank ratio threshold.  Flag CRITICAL when
   * `effectiveRank / rankNominal < effectiveRankThreshold`.
   * Default 0.3 (Huh 2023 §2 heuristic; E-2 calibration deferred).
   */
  effectiveRankThreshold: number;

  /**
   * Separability ratio threshold.  Flag CRITICAL when
   * `within / between >= separabilityRatioThreshold`
   * (i.e. within-community similarity approaches between-community similarity).
   * Default 0.8.
   */
  separabilityRatioThreshold: number;
}

export const DEFAULT_AUDIT_SETTINGS: AuditSettings = {
  enabled: false,
  effectiveRankThreshold: 0.3,
  separabilityRatioThreshold: 0.8,
};

/**
 * Merge caller-supplied partial settings with defaults.
 * Unknown keys are silently dropped.
 */
export function resolveSettings(
  overrides?: Partial<AuditSettings>,
): AuditSettings {
  return { ...DEFAULT_AUDIT_SETTINGS, ...overrides };
}
