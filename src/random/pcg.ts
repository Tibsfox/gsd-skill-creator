/**
 * PCG (Permuted Congruential Generator) — native TypeScript implementation.
 *
 * Implements PCG-XSH-RR-64/32 (64-bit state, 32-bit output), the recommended
 * general-purpose variant from the PCG family. Based on the reference C
 * implementation by Melissa O'Neill (pcg-random.org).
 *
 * # Why PCG
 *
 * PCG provides the best balance of:
 *   - Statistical quality (passes TestU01 BigCrush)
 *   - Speed (single multiply + add + xorshift + rotate per output)
 *   - Small state (128 bits: 64-bit state + 64-bit increment)
 *   - Multiple streams (2^63 independent sequences via increment)
 *   - Reproducibility (same seed + stream = same sequence)
 *   - Predictability resistance (harder than LCG/xorshift)
 *
 * # Usage
 *
 *   const rng = new Pcg32(42n);              // Seed with 42
 *   const rng = new Pcg32(42n, 54n);         // Seed 42, stream 54
 *   const val = rng.next();                   // u32 in [0, 2^32)
 *   const bounded = rng.bounded(6);           // [0, 6) — unbiased
 *   const float = rng.float();                // [0.0, 1.0)
 *   const item = rng.choice(array);           // Random element
 *   rng.shuffle(array);                       // Fisher-Yates in-place
 *
 * # Reference
 *
 *   O'Neill, M.E. (2014). "PCG: A Family of Simple Fast Space-Efficient
 *   Statistically Good Algorithms for Random Number Generation."
 *   Harvey Mudd College, HMC-CS-2014-0905.
 *   https://www.pcg-random.org/pdf/hmc-cs-2014-0905.pdf
 *
 * @module random/pcg
 */

// ─── Constants ──────────────────────────────────────────────────────────────

/** LCG multiplier for 64-bit state (Knuth's constant). */
const MULTIPLIER = 6364136223846793005n;

/** Default increment (must be odd). */
const DEFAULT_INCREMENT = 1442695040888963407n;

/** Mask for 64-bit operations (BigInt has no natural overflow). */
const MASK64 = (1n << 64n) - 1n;

/** Mask for 32-bit operations. */
const MASK32 = 0xFFFFFFFFn;

// ─── Pcg32 ──────────────────────────────────────────────────────────────────

/**
 * PCG-XSH-RR-64/32: 64-bit state, 32-bit output.
 *
 * The workhorse variant — recommended for general use. Produces high-quality
 * 32-bit random numbers with a period of 2^64 and 2^63 possible streams.
 */
export class Pcg32 {
  private state: bigint;
  private readonly inc: bigint;

  /**
   * Create a new PCG32 generator.
   *
   * @param seed - Initial state seed (any 64-bit value)
   * @param stream - Stream selector (any 64-bit value; different streams
   *   produce completely non-overlapping sequences)
   */
  constructor(seed: bigint = 0n, stream: bigint = DEFAULT_INCREMENT) {
    // Increment must be odd — the OR ensures this.
    this.inc = ((stream << 1n) | 1n) & MASK64;
    // Two-step seeding per reference implementation.
    this.state = 0n;
    this.step();
    this.state = (this.state + seed) & MASK64;
    this.step();
  }

  /** Advance the LCG state by one step. */
  private step(): void {
    this.state = (this.state * MULTIPLIER + this.inc) & MASK64;
  }

  // ─── Core output ────────────────────────────────────────────────────

  /**
   * Generate the next 32-bit unsigned integer.
   * Applies XSH-RR (xorshift high, rotate right) output permutation.
   */
  next(): number {
    const oldState = this.state;
    this.step();

    // XSH-RR output function:
    //   xorshifted = ((oldState >> 18) ^ oldState) >> 27
    //   rot = oldState >> 59
    //   return (xorshifted >> rot) | (xorshifted << ((-rot) & 31))
    const xorshifted = Number(((oldState >> 18n) ^ oldState) >> 27n & MASK32);
    const rot = Number(oldState >> 59n);
    return ((xorshifted >>> rot) | (xorshifted << ((-rot) & 31))) >>> 0;
  }

  // ─── Derived generators ─────────────────────────────────────────────

  /**
   * Generate a uniformly distributed integer in [0, bound).
   * Uses rejection sampling to eliminate modulo bias.
   */
  bounded(bound: number): number {
    if (bound <= 0) throw new RangeError('bound must be positive');
    if (bound === 1) return 0;

    // Threshold below which we reject to avoid bias.
    // threshold = (2^32 - bound) % bound = (-bound) % bound
    const threshold = ((-bound >>> 0) % bound) >>> 0;

    // Rejection loop — expected iterations < 2.
    for (;;) {
      const r = this.next();
      if (r >= threshold) return r % bound;
    }
  }

  /**
   * Generate a float in [0.0, 1.0) with 32 bits of precision.
   */
  float(): number {
    return this.next() / 4294967296; // 2^32
  }

  /**
   * Generate a float in [min, max).
   */
  floatRange(min: number, max: number): number {
    return min + this.float() * (max - min);
  }

  /**
   * Generate an integer in [min, max] (inclusive both ends).
   */
  intRange(min: number, max: number): number {
    return min + this.bounded(max - min + 1);
  }

  /**
   * Generate a boolean with given probability of true.
   */
  bool(probability = 0.5): boolean {
    return this.float() < probability;
  }

  // ─── Array operations ───────────────────────────────────────────────

  /**
   * Choose a random element from an array.
   */
  choice<T>(array: readonly T[]): T {
    if (array.length === 0) throw new RangeError('cannot choose from empty array');
    return array[this.bounded(array.length)];
  }

  /**
   * Choose N random elements from an array (without replacement).
   * Returns a new array.
   */
  sample<T>(array: readonly T[], n: number): T[] {
    if (n > array.length) throw new RangeError('sample size exceeds array length');
    const copy = [...array];
    // Partial Fisher-Yates: only shuffle the first n elements.
    for (let i = 0; i < n; i++) {
      const j = i + this.bounded(copy.length - i);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, n);
  }

  /**
   * Fisher-Yates shuffle an array in place.
   */
  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = this.bounded(i + 1);
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Generate an array of N random u32 values.
   */
  fill(n: number): Uint32Array {
    const arr = new Uint32Array(n);
    for (let i = 0; i < n; i++) arr[i] = this.next();
    return arr;
  }

  // ─── State management ───────────────────────────────────────────────

  /**
   * Advance the generator by `delta` steps without generating output.
   * Uses the O(log n) advancement algorithm.
   */
  advance(delta: bigint): void {
    let curMult = MULTIPLIER;
    let curPlus = this.inc;
    let accMult = 1n;
    let accPlus = 0n;
    let d = delta & MASK64;

    while (d > 0n) {
      if (d & 1n) {
        accMult = (accMult * curMult) & MASK64;
        accPlus = (accPlus * curMult + curPlus) & MASK64;
      }
      curPlus = ((curMult + 1n) * curPlus) & MASK64;
      curMult = (curMult * curMult) & MASK64;
      d >>= 1n;
    }

    this.state = (accMult * this.state + accPlus) & MASK64;
  }

  /**
   * Serialize the generator state for later restoration.
   */
  save(): { state: string; inc: string } {
    return {
      state: this.state.toString(),
      inc: this.inc.toString(),
    };
  }

  /**
   * Restore generator state from a previous save.
   */
  static restore(saved: { state: string; inc: string }): Pcg32 {
    const rng = Object.create(Pcg32.prototype) as Pcg32;
    (rng as any).state = BigInt(saved.state);
    (rng as any).inc = BigInt(saved.inc);
    return rng;
  }

  /**
   * Create a generator seeded from the current timestamp + performance counter.
   * NOT cryptographically secure — use crypto.getRandomValues for security.
   */
  static fromEntropy(): Pcg32 {
    const now = BigInt(Date.now());
    const perf = BigInt(Math.floor(performance.now() * 1000000));
    return new Pcg32(now ^ perf, now);
  }
}

// ─── Utility functions ──────────────────────────────────────────────────────

/**
 * Create a seeded PCG32 generator from a string (deterministic hash).
 * Useful for reproducible sequences keyed by name.
 */
export function pcgFromString(seed: string, stream = 0n): Pcg32 {
  let hash = 5381n;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5n) + hash + BigInt(seed.charCodeAt(i))) & MASK64;
  }
  return new Pcg32(hash, stream);
}

/**
 * Generate a single random u32 from a seed without creating a persistent generator.
 * Useful for one-shot hashing applications.
 */
export function pcgOneshot(seed: bigint): number {
  const rng = new Pcg32(seed);
  return rng.next();
}
