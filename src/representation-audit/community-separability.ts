/**
 * MD-6 Representation Audit — Community Separability.
 *
 * Measures how well Leiden communities (ground-truth cluster labels) are
 * separated in the embedding space by comparing within-community vs
 * between-community cosine similarity.
 *
 * ## Metric
 *
 *   within  = mean cosine similarity between embeddings in the SAME community
 *   between = mean cosine similarity between embeddings in DIFFERENT communities
 *   ratio   = within / between
 *
 * A well-separated embedding has ratio << 1 (within-community pairs are much
 * more similar to each other than across communities).  As the embedding
 * collapses, all vectors converge toward the same region, within ≈ between,
 * and ratio → 1.0 — the "kernel-machine collapse" signal from Thread D §5 MD-6.
 *
 * ## Kernel-collapse interpretation
 *
 * When `ratio ≥ separabilityRatioThreshold` (default 0.8), communities are
 * no longer meaningfully separated in the embedding.  Many observations are
 * mapping to similar activations; the schema has collapsed the relevant
 * structural variation.
 *
 * @module representation-audit/community-separability
 */

// ─── Types ──────────────────────────────────────────────────────────────────

/** Map of community-id → list of entity ids belonging to that community. */
export type CommunityMap = ReadonlyMap<string, readonly string[]>;

/** Embedding lookup: entity-id → embedding vector. */
export type EmbeddingLookup = (entityId: string) => readonly number[] | null;

export interface SeparabilityResult {
  /** Mean cosine similarity of pairs within the same community. */
  readonly within: number;
  /** Mean cosine similarity of pairs across different communities. */
  readonly between: number;
  /**
   * Ratio within / between.
   * 0 → perfectly separated; 1 → fully collapsed; >1 → pathological (inverted).
   */
  readonly ratio: number;
  /** Number of within-community pairs sampled. */
  readonly withinPairs: number;
  /** Number of between-community pairs sampled. */
  readonly betweenPairs: number;
  /**
   * Number of entities skipped because no embedding was available.
   */
  readonly missingEmbeddings: number;
}

// ─── Cosine similarity helpers ───────────────────────────────────────────────

function cosine(a: readonly number[], b: readonly number[]): number {
  const len = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let k = 0; k < len; k++) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    dot += av * bv;
    na += av * av;
    nb += bv * bv;
  }
  if (na === 0 || nb === 0) return 0;
  const c = dot / Math.sqrt(na * nb);
  if (c > 1) return 1;
  if (c < -1) return -1;
  return c;
}

// ─── Core computation ────────────────────────────────────────────────────────

/**
 * Compute within-community vs between-community cosine-similarity ratio.
 *
 * For large communities the exhaustive O(N²) pairwise computation is
 * expensive.  When `maxSamplesPerBucket > 0`, within-bucket pairs are
 * sampled (reservoir sampling from the first `maxSamplesPerBucket` entities
 * in each community); between-bucket pairs sample one entity per community.
 * Set `maxSamplesPerBucket = 0` to disable sampling (exact computation).
 *
 * @param communities  Leiden community map (community-id → entity ids).
 * @param getEmbedding Embedding lookup function; returns null for unknown ids.
 * @param maxSamplesPerBucket  Max entities per community to include in pairwise
 *   computation.  Default 50.  Set 0 for exhaustive (exact).
 */
export function separability(
  communities: CommunityMap,
  getEmbedding: EmbeddingLookup,
  maxSamplesPerBucket = 50,
): SeparabilityResult {
  // Materialise communities that have embeddings.
  type CommVec = { communityId: string; vecs: readonly number[][] };
  const commVecs: CommVec[] = [];
  let missingEmbeddings = 0;

  for (const [cid, members] of communities) {
    const vecs: number[][] = [];
    for (const eid of members) {
      const emb = getEmbedding(eid);
      if (emb === null) {
        missingEmbeddings += 1;
        continue;
      }
      vecs.push(emb as number[]);
      if (maxSamplesPerBucket > 0 && vecs.length >= maxSamplesPerBucket) break;
    }
    if (vecs.length > 0) commVecs.push({ communityId: cid, vecs });
  }

  if (commVecs.length === 0) {
    return { within: 0, between: 0, ratio: 0, withinPairs: 0, betweenPairs: 0, missingEmbeddings };
  }

  // Within-community pairs.
  let withinSum = 0;
  let withinCount = 0;
  for (const { vecs } of commVecs) {
    for (let i = 0; i < vecs.length; i++) {
      for (let j = i + 1; j < vecs.length; j++) {
        withinSum += cosine(vecs[i]!, vecs[j]!);
        withinCount += 1;
      }
    }
  }

  // Between-community pairs: pick the first vector from each community and
  // compute pairwise across communities.
  let betweenSum = 0;
  let betweenCount = 0;
  for (let ci = 0; ci < commVecs.length; ci++) {
    for (let cj = ci + 1; cj < commVecs.length; cj++) {
      const vecsA = commVecs[ci]!.vecs;
      const vecsB = commVecs[cj]!.vecs;
      // Sample a bounded number of cross-community pairs.
      const maxA = Math.min(vecsA.length, maxSamplesPerBucket > 0 ? maxSamplesPerBucket : vecsA.length);
      const maxB = Math.min(vecsB.length, maxSamplesPerBucket > 0 ? maxSamplesPerBucket : vecsB.length);
      for (let ai = 0; ai < maxA; ai++) {
        for (let bi = 0; bi < maxB; bi++) {
          betweenSum += cosine(vecsA[ai]!, vecsB[bi]!);
          betweenCount += 1;
        }
      }
    }
  }

  const within = withinCount > 0 ? withinSum / withinCount : 0;
  const between = betweenCount > 0 ? betweenSum / betweenCount : 0;

  // ratio = within / between; guard against near-zero between.
  const ratio = Math.abs(between) < 1e-12 ? (within === 0 ? 0 : 1) : within / between;

  return {
    within,
    between,
    ratio,
    withinPairs: withinCount,
    betweenPairs: betweenCount,
    missingEmbeddings,
  };
}
