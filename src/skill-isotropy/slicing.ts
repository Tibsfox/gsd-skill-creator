/**
 * Cramér-Wold slicing primitives — random unit directions + per-direction projection.
 *
 * @module skill-isotropy/slicing
 */

/** Minimal deterministic PRNG (mulberry32). Used only when a seed is set. */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard-normal sample using a uniform source. */
function sampleStandardNormal(rand: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Sample M random unit directions on S^{K-1} (uniform by construction: draw
 * K standard-normal coordinates, normalize). Deterministic when `seed` is set.
 */
export function sampleUnitDirections(
  numDirections: number,
  dim: number,
  seed?: number,
): Array<ReadonlyArray<number>> {
  if (numDirections < 1) throw new Error('numDirections must be >= 1');
  if (dim < 1) throw new Error('dim must be >= 1');
  const rand = seed === undefined ? Math.random : mulberry32(seed);
  const out: Array<ReadonlyArray<number>> = [];
  for (let i = 0; i < numDirections; i++) {
    const v = new Array<number>(dim);
    let sumSq = 0;
    for (let j = 0; j < dim; j++) {
      const x = sampleStandardNormal(rand);
      v[j] = x;
      sumSq += x * x;
    }
    const norm = Math.sqrt(sumSq);
    // Guard against a vanishingly-unlikely zero draw.
    const safeNorm = norm === 0 ? 1 : norm;
    for (let j = 0; j < dim; j++) v[j] = v[j] / safeNorm;
    out.push(v);
  }
  return out;
}

/** Project every embedding onto a single unit direction; returns the 1-D projection list. */
export function projectOntoDirection(
  embeddings: ReadonlyArray<ReadonlyArray<number>>,
  direction: ReadonlyArray<number>,
): number[] {
  const out = new Array<number>(embeddings.length);
  const k = direction.length;
  for (let n = 0; n < embeddings.length; n++) {
    const v = embeddings[n];
    if (v.length !== k) {
      throw new Error(
        `embedding index ${n} has dim ${v.length}; direction dim is ${k}`,
      );
    }
    let acc = 0;
    for (let j = 0; j < k; j++) acc += v[j] * direction[j];
    out[n] = acc;
  }
  return out;
}
