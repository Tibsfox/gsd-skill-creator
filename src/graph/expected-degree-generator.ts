/**
 * M1 Semantic Memory Graph — linear-time random graph generator.
 *
 * Implements the Chung-Lu expected-degree model (arXiv:2604.21504) for
 * generating random graphs with prescribed expected degrees in Θ(n + m)
 * time, where n is the vertex count and m is the expected edge count.
 *
 * Algorithm (arXiv:2604.21504 §2):
 *   Given weight sequence w = [w₀, …, w_{n-1}] with W = Σwᵢ,
 *   each pair (i, j) appears as an edge independently with probability
 *     p_{ij} = wᵢ · wⱼ / W
 *   The linear-time implementation uses a Poisson thinning trick:
 *   instead of checking all O(n²) pairs, it samples edge counts from a
 *   Poisson distribution and uses alias-method sampling to pick endpoints
 *   in O(1) per edge — giving overall Θ(n + E[m]) time.
 *
 * Usage:
 *   const gen = new ExpectedDegreeGenerator([2, 3, 3, 1, 2]);
 *   const graph = gen.generate(seed);   // reproducible with optional seed
 *
 * JP-021, Wave 3, phase 841.
 *
 * @module graph/expected-degree-generator
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeneratedGraph {
  /** Number of vertices. */
  n: number;
  /** Adjacency list (undirected; each edge appears once). */
  edges: Array<[number, number]>;
  /** Expected degree for each vertex. */
  expectedDegrees: readonly number[];
}

// ─── Alias method sampler ─────────────────────────────────────────────────────

/**
 * Alias table for O(1) weighted sampling (Walker 1977).
 * Built in O(n); each sample call is O(1).
 */
class AliasTable {
  private readonly prob: Float64Array;
  private readonly alias: Int32Array;

  constructor(weights: readonly number[]) {
    const n = weights.length;
    const total = weights.reduce((a, b) => a + b, 0);
    this.prob = new Float64Array(n);
    this.alias = new Int32Array(n);

    // Normalise to n * p_i
    const scaled = weights.map((w) => (w / total) * n);
    const small: number[] = [];
    const large: number[] = [];

    for (let i = 0; i < n; i++) {
      if (scaled[i]! < 1) small.push(i);
      else large.push(i);
    }

    while (small.length > 0 && large.length > 0) {
      const s = small.pop()!;
      const l = large.pop()!;
      this.prob[s] = scaled[s]!;
      this.alias[s] = l;
      scaled[l] = scaled[l]! + scaled[s]! - 1;
      if (scaled[l]! < 1) small.push(l);
      else large.push(l);
    }
    for (const i of large) this.prob[i] = 1;
    for (const i of small) this.prob[i] = 1;
  }

  /** Sample one index proportional to the original weights. */
  sample(rng: () => number): number {
    const n = this.prob.length;
    const i = Math.floor(rng() * n);
    return rng() < this.prob[i]! ? i : this.alias[i]!;
  }
}

// ─── Seeded LCG RNG ──────────────────────────────────────────────────────────

/** Minimal 32-bit LCG for reproducible generation. Returns [0, 1). */
function makeLcg(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(s, 1664525) + 1013904223;
    s = s >>> 0;
    return s / 0x100000000;
  };
}

// ─── Generator ───────────────────────────────────────────────────────────────

/**
 * Random graph generator with prescribed expected degrees.
 *
 * The expected degree of vertex i equals `expectedDegrees[i]` in expectation
 * over repeated calls to `generate()`.
 */
export class ExpectedDegreeGenerator {
  private readonly weights: readonly number[];
  private readonly W: number;
  private readonly table: AliasTable;

  /**
   * @param expectedDegrees Non-negative weight sequence. Zero-weight vertices
   *   are included in n but never receive edges.
   */
  constructor(expectedDegrees: readonly number[]) {
    if (expectedDegrees.length === 0) {
      throw new RangeError('expectedDegrees must be non-empty');
    }
    for (const w of expectedDegrees) {
      if (w < 0) throw new RangeError('All expected degrees must be ≥ 0');
    }
    this.weights = expectedDegrees;
    this.W = expectedDegrees.reduce((a, b) => a + b, 0);
    // Build alias table only if there are positive weights
    this.table = new AliasTable(
      this.W === 0 ? expectedDegrees.map(() => 1) : expectedDegrees,
    );
  }

  /**
   * Generate a random graph in Θ(n + E[m]) time.
   *
   * @param seed Optional integer seed for reproducibility. If omitted,
   *   uses a random seed derived from Math.random().
   */
  generate(seed?: number): GeneratedGraph {
    const n = this.weights.length;
    const rng = makeLcg(seed ?? Math.floor(Math.random() * 0x7fffffff));

    if (this.W === 0) {
      return { n, edges: [], expectedDegrees: this.weights };
    }

    // Expected edge count E[m] = W / 2 (undirected)
    const expectedEdgeCount = this.W / 2;

    // Sample actual edge count from Poisson(E[m]) using Knuth's method.
    // For large λ, clamp to avoid unbounded loops (λ > 50 → Gaussian approx).
    const lambda = expectedEdgeCount;
    let m: number;
    if (lambda <= 50) {
      const L = Math.exp(-lambda);
      let k = 0;
      let p = 1;
      do { p *= rng(); k++; } while (p > L);
      m = k - 1;
    } else {
      // Box-Muller Gaussian approximation for large λ
      const u1 = Math.max(rng(), 1e-15);
      const u2 = rng();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      m = Math.max(0, Math.round(lambda + z * Math.sqrt(lambda)));
    }

    // Sample m endpoint pairs using alias table in O(m) time.
    const edges: Array<[number, number]> = [];
    for (let e = 0; e < m; e++) {
      const u = this.table.sample(rng);
      const v = this.table.sample(rng);
      if (u !== v) {
        edges.push([Math.min(u, v), Math.max(u, v)]);
      }
    }

    return { n, edges, expectedDegrees: this.weights };
  }

  /**
   * Return the probability that an edge (i, j) exists.
   * p_{ij} = wᵢ · wⱼ / W (clamped to 1).
   */
  edgeProbability(i: number, j: number): number {
    if (this.W === 0) return 0;
    return Math.min(1, (this.weights[i]! * this.weights[j]!) / this.W);
  }
}

/**
 * Convenience factory: generate a single graph from a weight sequence.
 */
export function generateExpectedDegreeGraph(
  expectedDegrees: readonly number[],
  seed?: number,
): GeneratedGraph {
  return new ExpectedDegreeGenerator(expectedDegrees).generate(seed);
}
