/**
 * FL Threat-Model Gate — type definitions.
 *
 * Structural pre-rollout gate that blocks unauthorized federated-training
 * paths until the data-free MIA threat model is explicitly addressed in
 * calling code's design document.
 *
 * Grounded in the Lee et al. trio (all submitted 21 April 2026):
 *   - arXiv:2604.19891  Data-Free MIA (SCLL-prior gradient-inversion attack)
 *   - arXiv:2604.19915  DECIFR (domain-aware targeted exfiltration)
 *   - arXiv:2604.20020  FL Hardware Assurance Survey (threat taxonomy + mitigations)
 *
 * Canonical architecture spec:
 *   .planning/missions/arxiv-eess-integration-apr17-23/work/templates/m4-mia-threat-model.tex
 *
 * Phase: 768 (T1d W5 FL Pre-Rollout Threat-Model Gate)
 * UIP: UIP-16
 * CAPCOM: gate-only — NO FL training implemented; no orchestration/CAPCOM/DACP touches.
 *
 * @module fl-threat-model/types
 */

// ============================================================================
// Design-doc shape (parsed YAML frontmatter)
// ============================================================================

/** Differential-privacy mitigation specification. */
export interface DifferentialPrivacySpec {
  enabled: boolean;
  /** "gaussian" | "laplacian" (or alias "laplace") — must be non-empty. */
  noise_mechanism: string;
  /** Privacy budget ε — must be a positive finite number. */
  epsilon: number | null;
  /** Privacy parameter δ (required for Gaussian mechanism) — must be a positive finite number. */
  delta: number | null;
  /** Must be explicitly set to true; false blocks. */
  accuracy_tradeoff_documented: boolean;
}

/** Gradient-clipping mitigation specification. */
export interface GradientClippingSpec {
  enabled: boolean;
  /** ℓ₂ clipping norm C — must be a positive finite number. */
  clipping_norm: number | null;
  /** Must be explicitly set to true; false blocks. */
  bias_characterised: boolean;
}

/** Secure-aggregation mitigation specification. */
export interface SecureAggregationSpec {
  enabled: boolean;
  /** Protocol name, e.g. "SecAgg", "SecAgg+", "LightSecAgg" — must be non-empty. */
  protocol: string;
  /** Must be explicitly set to true; false blocks. */
  communication_overhead_estimated: boolean;
}

/** Per-client data-cap mitigation specification. */
export interface PerClientDataCapSpec {
  enabled: boolean;
  /** Maximum training examples per client per round — must be a positive finite number. */
  cap_value: number | null;
  /** Non-empty rationale string — empty string blocks. */
  cap_rationale: string;
}

/** Four-item mandatory mitigation block. */
export interface MitigationsSpec {
  differential_privacy: DifferentialPrivacySpec;
  gradient_clipping: GradientClippingSpec;
  secure_aggregation: SecureAggregationSpec;
  per_client_data_cap: PerClientDataCapSpec;
}

/** DECIFR assessment block. */
export interface DecifirAssessmentSpec {
  /** Must be true; false blocks. */
  attack_class_enumerated: boolean;
  /** Must be true; false blocks. */
  secure_aggregation_as_primary_countermeasure: boolean;
}

/** DoltHub delineation block. */
export interface DoltHubDelineationSpec {
  /** Informational; must be true. */
  static_skill_sharing_permitted: boolean;
  /** Must be "BLOCKED" until gate passes. */
  federated_training_status: string;
  /** Must be true; false blocks. */
  unblock_conditions_documented: boolean;
}

/**
 * Top-level `fl_threat_model` YAML frontmatter block that calling code must
 * include in any federated training design document.
 *
 * All three Lee et al. arXiv IDs must appear in `mandatory_sources`.
 */
export interface FlThreatModelBlock {
  /** Must match "1.0.0" (or be present and non-empty). */
  version: string;
  /**
   * Must include all three cite keys:
   *   "eess26_2604.19891" | "eess26_2604.19915" | "eess26_2604.20020"
   *
   * Bare arXiv IDs ("arXiv:2604.19891", "2604.19891") are also accepted.
   */
  mandatory_sources: string[];
  mitigations: MitigationsSpec;
  decifr_assessment: DecifirAssessmentSpec;
  dolthub_delineation: DoltHubDelineationSpec;
}

/**
 * A design document as parsed from its YAML frontmatter.
 *
 * The gate validator operates on this structure; callers provide it either
 * directly (via `gatePreRollout`) or by path (via `validateDesignDoc`).
 */
export interface DesignDoc {
  /** Absolute or relative path the doc was loaded from; informational. */
  sourcePath?: string;
  /**
   * The `fl_threat_model` frontmatter block.
   * `undefined` means the block is absent → block-on condition 1 fires.
   */
  fl_threat_model?: FlThreatModelBlock;
}

// ============================================================================
// Block-on condition
// ============================================================================

/**
 * One of the 15 enumerated block-on conditions from m4-mia-threat-model.tex
 * § Pre-Rollout Gate Specification.
 *
 * Each condition has a stable numeric ID (1–15), a machine key, and a
 * human-readable description.
 */
export interface BlockOnCondition {
  /** Stable ordinal from the spec (1–15). */
  readonly id: number;
  /**
   * Machine-readable key matching the YAML path that is checked.
   * Format: snake_case path segments joined with dots.
   */
  readonly key: string;
  /** Short human-readable description of what is required. */
  readonly description: string;
}

// ============================================================================
// Mitigation
// ============================================================================

/**
 * One of the four mandatory mitigations in the matrix.
 *
 * Each mitigation has a name, a source arXiv citation, and a check function
 * that validates the corresponding spec block is non-trivial.
 */
export interface Mitigation {
  /** Human-readable name. */
  readonly name: string;
  /** Primary arXiv citation. */
  readonly arXivId: string;
  /** What it prevents (one-line). */
  readonly prevents: string;
}

// ============================================================================
// Gate verdict
// ============================================================================

/**
 * Verdict returned by the pre-rollout gate.
 *
 * Three terminal states:
 *   - `'pass'`          — all 15 block-on conditions are false; FL may proceed.
 *   - `'block'`         — one or more block-on conditions fired; FL is blocked.
 *   - `'gate-disabled'` — the opt-in flag is off; gate is not evaluated.
 *
 * The `gate-disabled` state preserves byte-identical behaviour with the
 * Phase 767 tip baseline (G14 CAPCOM composition gate requirement).
 */
export type GateVerdictState = 'pass' | 'block' | 'gate-disabled';

export interface GateVerdict {
  /** Terminal verdict state. */
  readonly verdict: GateVerdictState;
  /**
   * List of block-on condition keys that fired.
   * Empty when `verdict === 'pass'` or `verdict === 'gate-disabled'`.
   */
  readonly blocks: readonly string[];
  /**
   * Human-readable messages corresponding to each block.
   * Parallel array to `blocks`.
   */
  readonly messages: readonly string[];
  /** ISO-8601 timestamp at gate entry. */
  readonly timestamp: string;
  /** Path of the design doc evaluated (if known). */
  readonly sourcePath?: string;
}
