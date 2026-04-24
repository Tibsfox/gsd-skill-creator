/**
 * Wasserstein-Hebbian adapter-stack — shared types.
 *
 * All types are pure data. No methods; no class hierarchy. Callers pass
 * these shapes between the geometry helpers, plasticity-rule validators,
 * and audit-finding emitters.
 *
 * @module wasserstein-hebbian/types
 */

/**
 * A declared Hebbian plasticity rule. Shape the adapter structurally audits
 * for consistency with a Wasserstein-2 gradient-flow interpretation. This
 * is **not** an executable update function — it is a parameter record.
 */
export interface PlasticityRule {
  /** Human-readable identifier for the rule. */
  ruleName: string;
  /** Learning rate η. Plausible Wasserstein-flow regime: (0, 1]. */
  learningRate: number;
  /**
   * Entropy-regularisation weight β in 𝓕[μ] = 𝔼_μ[ℓ] + β·H[μ].
   * Plausible regime: [0, 10]. Omitted (undefined) ⇒ β = 0.
   */
  regularization?: number;
}

/**
 * A minimal 1-D Gaussian parametric approximation of a probability
 * distribution over a scalar weight. The adapter uses this finite
 * approximation for closed-form W₂² computation; it is deliberately
 * narrower than the infinite-dimensional 𝒫₂(ℝᵈ) object in the source.
 */
export interface GaussianDistribution {
  /** Mean μ. */
  mean: number;
  /** Standard deviation σ ≥ 0. */
  sigma: number;
}

/**
 * Structured audit finding produced by the adapter. Pure data — no
 * references to CAPCOM gate state, no write-path side effects.
 */
export interface WassersteinAuditFinding {
  /** Stable identifier for this finding (timestamp + content hash). */
  findingId: string;
  /**
   * Audit verdict:
   *   - `consistent`    — rule lives inside the plausible-flow region
   *   - `inconsistent`  — one or more parameters outside the region
   *   - `unaudited`     — rule shape invalid or flag off (fail-closed)
   */
  type: 'consistent' | 'inconsistent' | 'unaudited';
  /** The rule that was audited (copied in; not mutated). */
  rule: PlasticityRule;
  /** Zero-or-more human-readable reasons supporting the verdict. */
  reasons: string[];
  /** ISO-8601 timestamp of finding creation. */
  timestamp: string;
}
