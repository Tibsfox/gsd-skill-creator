/**
 * MD-3 — Langevin Noise Injector.
 *
 * Pure Gaussian noise injection for SGLD-style stochastic updates of M7's
 * online generative-model parameters. Implements Welling & Teh 2011 SGLD:
 * the parameter update is perturbed with a zero-mean Gaussian sample whose
 * variance equals the schedule scale, producing asymptotic sampling from
 * the posterior while behaving as gradient descent in the short run.
 *
 * Hand-rolled Box-Muller transform — no external numerical deps.
 *
 * Composition order is critical: this primitive injects noise on the raw
 * (pre-projection, pre-commit) parameter vector. The MB-2 simplex
 * projection runs *after* this step so post-noise parameters land back on
 * the simplex (CF-M7-02 preserved).
 *
 * Source proposal:
 *   .planning/research/living-sensoria-refinement/proposals/MD-3-langevin-noise.md
 *
 * @module langevin/noise-injector
 */

/**
 * Pure Gaussian noise injection on a parameter vector.
 *
 * For each entry `p[i]` in the input vector, returns
 *
 *     p'[i] = p[i] + scale · ξ_i,    ξ_i ~ N(0, 1)
 *
 * so the additive noise has mean 0 and variance `scale²`. The function is
 * fully pure (no in-place mutation, no I/O); the only stateful dependency
 * is the injected `rng` callable.
 *
 * @param params - Parameter vector to perturb (read-only).
 * @param scale - Standard deviation of the additive Gaussian noise. When
 *   `scale <= 0` the input is returned as a fresh copy with no perturbation
 *   (safety valve matching CF-MD3-01 / SC-MD3-01 byte-identity intent).
 * @param rng - Uniform `[0, 1)` PRNG. For determinism in tests, pass a
 *   seeded Mulberry32 instance (see `src/graph/leiden.ts`).
 * @returns A new vector of equal length with Gaussian noise added.
 */
export function injectLangevinNoise(
  params: readonly number[],
  scale: number,
  rng: () => number,
): number[] {
  const n = params.length;
  const out = new Array<number>(n);

  // Safety valve: scale <= 0 reduces to identity (fresh copy).
  if (!(scale > 0) || !Number.isFinite(scale)) {
    for (let i = 0; i < n; i++) out[i] = params[i]!;
    return out;
  }

  for (let i = 0; i < n; i++) {
    const xi = gaussianSample(rng);
    out[i] = params[i]! + scale * xi;
  }
  return out;
}

/**
 * Box-Muller transform for a single standard-normal sample.
 *
 * Uses two uniform `[0, 1)` draws and returns the cosine branch; the sine
 * branch is discarded for code simplicity (minor efficiency cost accepted
 * per MD-3 implementation constraints).
 *
 * `u1` is clamped to a tiny floor to prevent `log(0) → -∞` blowup when the
 * RNG produces an exact zero.
 *
 * @internal
 */
export function gaussianSample(rng: () => number): number {
  const u1 = Math.max(rng(), 1e-300);
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Mulberry32 PRNG (deterministic, seedable). Mirrors the implementation in
 * `src/graph/leiden.ts`; duplicated here so the langevin module has no
 * cross-module dependency on the graph package.
 *
 * Seed wraps to a uint32; identical seeds produce identical streams.
 */
export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
