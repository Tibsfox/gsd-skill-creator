/**
 * MD-6 Representation Audit — Effective Rank (SVD-free spectral entropy proxy).
 *
 * ## Motivation
 *
 * Huh et al. (2023) "The Low-Rank Simplicity Bias in Deep Networks" (TMLR,
 * arXiv:2103.10427) and Roy & Vetterli (2007) "The effective rank: A measure
 * of effective dimensionality" (EUSIPCO) define effective rank via singular
 * values:
 *
 *   r_eff = (Σ σ_i)² / Σ σ_i²      (participation ratio)
 *
 * For a rank-1 matrix: r_eff = 1.
 * For an isotropic full-rank n×n matrix: r_eff = n.
 * Normalised ratio r_eff / rank_nominal ∈ (0, 1].
 *
 * ## SVD-free proxy (this implementation)
 *
 * Computing full SVD requires O(min(m,n)·m·n) work and a Jacobi/LAPACK
 * dependency.  Per the implementation constraints (zero external deps,
 * SVD-free), we approximate the singular-value distribution via **column
 * norms** of the embedding matrix.
 *
 * For an m×n embedding matrix A where each column j represents one entity:
 *   proxy_j = ||A_j||₂   (column L2-norm = proxy for the j-th singular value
 *                          contribution under random matrix theory when rows are
 *                          statistically exchangeable session observations)
 *
 * This yields a proxy participation ratio:
 *
 *   r_eff_proxy = (Σ proxy_j)² / Σ proxy_j²
 *
 * **Documented caveats:** column-norm proxies conflate singular-value
 * magnitude with column alignment; the proxy is exact for diagonal matrices
 * and underestimates effective rank when columns are highly correlated but
 * individually normed.  It is conservative (flags collapse more readily than
 * the full SVD) which is the safe direction for a diagnostic.
 *
 * Reference: Theorem 2 in Huh 2023 §2 gives the participation-ratio formula.
 *
 * @module representation-audit/effective-rank
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface EffectiveRankResult {
  /** Proxy effective rank (participation ratio over column norms). */
  readonly effectiveRank: number;
  /**
   * Nominal rank = min(rows, cols).  Full-rank would have effectiveRank/rankNominal → 1.
   */
  readonly rankNominal: number;
  /**
   * Normalised ratio effectiveRank / rankNominal ∈ (0, 1].
   * 1 = isotropic full-rank; near 0 = many observations map to low-dim subspace.
   */
  readonly ratio: number;
  /** Number of rows (sessions / observations). */
  readonly rows: number;
  /** Number of columns (entities / features). */
  readonly cols: number;
  /** Per-column proxy values (column L2 norms). Exposed for diagnostics. */
  readonly columnProxies: readonly number[];
}

// ─── Core computation ────────────────────────────────────────────────────────

/**
 * Compute the SVD-free effective-rank proxy for an embedding matrix.
 *
 * @param matrix Row-major embedding matrix.  `matrix[i]` is the i-th row
 *   (session / observation); `matrix[i][j]` is entity j's activation in
 *   session i.  All rows must have equal length; the matrix must be non-empty.
 *
 * @returns EffectiveRankResult.  If the matrix is degenerate (0 rows, 0 cols,
 *   all-zero), `effectiveRank` = 0 and `ratio` = 0.
 */
export function effectiveRank(matrix: readonly (readonly number[])[]): EffectiveRankResult {
  const rows = matrix.length;
  const cols = rows > 0 ? (matrix[0]?.length ?? 0) : 0;

  if (rows === 0 || cols === 0) {
    return {
      effectiveRank: 0,
      rankNominal: 0,
      ratio: 0,
      rows,
      cols,
      columnProxies: [],
    };
  }

  // Compute column L2 norms (the proxy values).
  const proxies = new Array<number>(cols).fill(0);
  for (let i = 0; i < rows; i++) {
    const row = matrix[i]!;
    for (let j = 0; j < cols; j++) {
      const v = row[j] ?? 0;
      proxies[j] += v * v;
    }
  }
  // Finalise: take sqrt of each sum-of-squares → L2 norm per column.
  for (let j = 0; j < cols; j++) {
    proxies[j] = Math.sqrt(proxies[j]!);
  }

  // Participation ratio: (Σ proxy)² / Σ proxy²
  let sumProxy = 0;
  let sumProxySq = 0;
  for (const p of proxies) {
    sumProxy += p;
    sumProxySq += p * p;
  }

  const rEff = sumProxySq === 0 ? 0 : (sumProxy * sumProxy) / sumProxySq;
  const rankNominal = Math.min(rows, cols);
  const ratio = rankNominal === 0 ? 0 : rEff / rankNominal;

  return {
    effectiveRank: rEff,
    rankNominal,
    ratio,
    rows,
    cols,
    columnProxies: proxies,
  };
}

// ─── Convenience helpers ─────────────────────────────────────────────────────

/**
 * Build an embedding matrix from a store-like structure where each entity
 * has a fixed-length embedding vector, and sessions are represented as sets
 * of activated entities.
 *
 * For each session i and each entity j, `matrix[i][j]` = the activation
 * weight (default 1.0) when entity j appeared in session i, 0.0 otherwise.
 *
 * @param vocabulary   Ordered list of entity ids (columns).
 * @param sessions     Each entry is a set of entity ids activated in that session.
 * @param getWeight    Optional: weight function (entityId, sessionIdx) → number.
 *                     Defaults to 1.0 for any activated entity.
 */
export function buildActivationMatrix(
  vocabulary: readonly string[],
  sessions: readonly (readonly string[])[],
  getWeight?: (entityId: string, sessionIndex: number) => number,
): number[][] {
  const idxOf = new Map<string, number>();
  vocabulary.forEach((id, i) => idxOf.set(id, i));

  return sessions.map((entities, si) => {
    const row = new Array<number>(vocabulary.length).fill(0);
    for (const eid of entities) {
      const j = idxOf.get(eid);
      if (j === undefined) continue;
      row[j] = getWeight ? getWeight(eid, si) : 1;
    }
    return row;
  });
}
