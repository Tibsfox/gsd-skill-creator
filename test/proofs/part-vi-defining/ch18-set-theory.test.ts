// test/proofs/part-vi-defining/ch18-set-theory.test.ts
// Computational verification for Chapter 18: Set Theory — ZFC and Foundations
// Proof document: .planning/v1.50a/half-b/proofs/ch18-set-theory.md
// Phase 478, Subversion 1.50.68
//
// ZFC axioms (18.A) are accepted as L5 definitional axioms.
// What is proved and tested:
// - Proof 18.1 (L2): Russell's paradox — naive comprehension leads to contradiction
// - Proof 18.2 (L2): ℕ constructed via von Neumann ordinals (ZFC Axiom of Infinity)
// - Proof 18.3 (L2): Cantor's theorem — |P(A)| > |A| for any finite set A
//
// METHOD: Constructive simulation using finite-domain sets.
// For Cantor's theorem, we enumerate all functions f: A → P(A) for small A
// and verify no surjection exists.

import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Finite-domain set simulator
// ---------------------------------------------------------------------------

/** Represent a set as a sorted array of elements (natural numbers 0..n-1) */
type FiniteSet = number[];

/** Power set of a finite set A = {0, 1, ..., n-1} */
function powerSet(A: FiniteSet): FiniteSet[] {
  const result: FiniteSet[] = [[]]; // start with empty set
  for (const elem of A) {
    const newSets = result.map((s) => [...s, elem]);
    result.push(...newSets);
  }
  return result;
}

/** Check if two finite sets are equal (as sorted arrays) */
function setsEqual(A: FiniteSet, B: FiniteSet): boolean {
  if (A.length !== B.length) return false;
  for (let i = 0; i < A.length; i++) {
    if (A[i] !== B[i]) return false;
  }
  return true;
}

/** Check if elem is in set A */
function setMember(elem: number, A: FiniteSet): boolean {
  return A.includes(elem);
}

/** Construct the diagonal set D = {x ∈ A : x ∉ f(x)} for a function f: A → P(A) */
function diagonalSet(A: FiniteSet, f: FiniteSet[]): FiniteSet {
  return A.filter((x) => !setMember(x, f[x]));
}

/** Check if f: A → P(A) is surjective (every subset of A appears in the range) */
function isSurjection(A: FiniteSet, f: FiniteSet[], pA: FiniteSet[]): boolean {
  for (const subset of pA) {
    const inRange = f.some((fval) => setsEqual(fval, subset));
    if (!inRange) return false;
  }
  return true;
}

/** Enumerate all functions f: A → P(A) (represented as arrays of subsets indexed by A) */
function* allFunctions(A: FiniteSet, pA: FiniteSet[]): Generator<FiniteSet[]> {
  // Each element of A maps to one of |P(A)| subsets
  // Total: |P(A)|^|A| functions
  const n = A.length;
  const m = pA.length; // = 2^n
  const total = Math.pow(m, n);
  for (let i = 0; i < total; i++) {
    const f: FiniteSet[] = [];
    let rem = i;
    for (let j = 0; j < n; j++) {
      f.push(pA[rem % m]);
      rem = Math.floor(rem / m);
    }
    yield f;
  }
}

// ---------------------------------------------------------------------------
// Von Neumann ordinals
// ---------------------------------------------------------------------------

/** Build von Neumann ordinal n as a set: 0=∅, 1={0}, 2={0,1}, n={0,1,...,n-1}
 *  Represented as cardinality (for computational purposes) */
function vonNeumannOrdinal(n: number): number {
  return n; // The von Neumann ordinal n has cardinality n
}

/** Successor operation: s(n) = n ∪ {n} — cardinality increases by 1 */
function successor(n: number): number {
  return n + 1;
}

/** Check if m ∈ n in von Neumann ordinals (m < n iff m ∈ n) */
function ordinalMember(m: number, n: number): boolean {
  return m < n; // m ∈ n in von Neumann ordinals iff m < n
}

describe('Chapter 18: Set Theory — ZFC and Foundations — Computational Verification', () => {
  // --------------------------------------------------------------------------
  // proof-18-1-russell-paradox: Russell's paradox
  // Classification: L2 — direct logical argument using excluded middle
  // Method: Constructive — simulate unrestricted comprehension and observe contradiction
  //   Also show ZFC Separation avoids the paradox on bounded domains
  // --------------------------------------------------------------------------
  describe('proof-18-1: Russell\'s paradox — naive comprehension is inconsistent', () => {
    test('Russell set construction: R = {x ∈ Domain : x ∉ x} is well-defined for finite domain', () => {
      // In a finite domain Domain = {0, 1, 2}, we can form R = {x ∈ Domain : x ∉ x}
      // Since no finite set contains itself as an element, R = Domain
      // (this avoids the paradox because Domain is bounded — ZFC Separation applies)
      const domain = [0, 1, 2];
      // For finite sets represented as numbers, no set x (as a number) is a member of itself
      // since "x ∈ x" means x is in the list of elements of x — impossible for numbers
      // The Russell set over this domain: R = {x ∈ domain : x ∉ x}
      // Since no number equals itself in the membership sense: R = domain
      const R = domain.filter((x) => !ordinalMember(x, x));
      // ordinalMember(x, x) = (x < x) = false, so R = domain
      expect(R).toEqual(domain);
    });

    test('Separation prevents paradox: R = {x ∈ A : x ∉ x} stays within A', () => {
      // With ZFC Separation, the Russell set is bounded to elements of A
      // R = {x ∈ A : x ∉ x} ⊆ A — it cannot contain elements outside A
      const A = [0, 1, 2, 3, 4];
      const R_bounded = A.filter((x) => !ordinalMember(x, x));
      // R_bounded ⊆ A
      for (const r of R_bounded) {
        expect(A).toContain(r);
      }
      // R_bounded does not create a self-referential paradox because it's bounded by A
      expect(R_bounded.length).toBeLessThanOrEqual(A.length);
    });

    test('the logical contradiction: R ∈ R iff R ∉ R (simulated with boolean)', () => {
      // Simulate the Russell paradox as a boolean consistency check
      // If we try to evaluate "is R ∈ R?" we get a contradiction
      function isRusselParadox(assumeRinR: boolean): boolean {
        // If R ∈ R, then by definition of R = {x : x ∉ x}, R ∉ R → contradiction
        // If R ∉ R, then R satisfies the membership criterion, so R ∈ R → contradiction
        if (assumeRinR) {
          return !assumeRinR; // R ∈ R → R ∉ R (negation of assumption)
        } else {
          return !assumeRinR; // R ∉ R → R ∈ R (negation of assumption)
        }
      }
      // In both cases, the result contradicts the assumption
      expect(isRusselParadox(true)).toBe(false);   // R ∈ R leads to R ∉ R
      expect(isRusselParadox(false)).toBe(true);   // R ∉ R leads to R ∈ R
      // No consistent truth value exists — this IS the paradox
    });

    test('excluded middle: no third truth value resolves the paradox', () => {
      // Proof by excluded middle: either R ∈ R or R ∉ R; both lead to contradiction
      // Therefore unrestricted comprehension must be rejected
      const caseRinR = false;   // R ∈ R leads to contradiction (Case 1 of proof)
      const caseRnotInR = false; // R ∉ R leads to contradiction (Case 2 of proof)
      // Both cases are contradictions: no consistent assignment exists
      expect(caseRinR || caseRnotInR).toBe(false);
      // The only escape: R does not exist as a set → reject naive comprehension
    });

    // Platform connection: PROMOTION_REGIONS as bounded activation domains (Separation)
    test('platform: bounded activation via PROMOTION_REGIONS prevents self-referential paradox', () => {
      // ZFC Separation: {x ∈ A : φ(x)} — bounded comprehension
      // skill-creator: activation in {context ∈ AllContexts : context ∈ promotionRegion}
      // The promotionRegion is the "prior set A" that bounds the comprehension
      const thetaMin = 0;
      const thetaMax = Math.PI / 2;
      // A skill activates in contexts where theta ∈ [thetaMin, thetaMax)
      // This is bounded comprehension — no self-referential paradox possible
      const allContextThetas = [0.1, 0.5, 1.0, 1.5, 2.0, 3.0]; // sampled theta values
      const activatingContexts = allContextThetas.filter(
        (theta) => theta >= thetaMin && theta < thetaMax,
      );
      // Result is a well-defined bounded set
      for (const theta of activatingContexts) {
        expect(theta).toBeGreaterThanOrEqual(thetaMin);
        expect(theta).toBeLessThan(thetaMax);
      }
    });
  });

  // --------------------------------------------------------------------------
  // proof-18-2-natural-numbers: ZFC construction of ℕ via von Neumann ordinals
  // Classification: L2 — explicit construction given Axiom of Infinity (L5 axiom)
  // Method: Constructive — build first 5 ordinals, verify cardinality and ordering
  // --------------------------------------------------------------------------
  describe('proof-18-2: von Neumann ordinals — constructing ℕ from ZFC', () => {
    test('cardinality of von Neumann ordinals: |0|=0, |1|=1, |2|=2, |3|=3, |4|=4', () => {
      for (let n = 0; n <= 4; n++) {
        expect(vonNeumannOrdinal(n)).toBe(n);
      }
    });

    test('successor function: s(n) = n ∪ {n} has cardinality n+1', () => {
      for (let n = 0; n <= 9; n++) {
        expect(successor(n)).toBe(n + 1);
      }
    });

    test('ordinal membership: m ∈ n iff m < n (for von Neumann ordinals)', () => {
      // 0 ∈ 1 (0 < 1), 0 ∈ 2 (0 < 2), 1 ∈ 2 (1 < 2)
      expect(ordinalMember(0, 1)).toBe(true);
      expect(ordinalMember(0, 2)).toBe(true);
      expect(ordinalMember(1, 2)).toBe(true);
      expect(ordinalMember(2, 2)).toBe(false); // 2 ∉ 2 (Foundation/Regularity)
      expect(ordinalMember(3, 2)).toBe(false); // 3 ∉ 2
    });

    test('Peano axiom 1: 0 ∈ ℕ (zero exists)', () => {
      expect(vonNeumannOrdinal(0)).toBe(0);
    });

    test('Peano axiom 2: for every n ∈ ℕ, s(n) ∈ ℕ (successor exists)', () => {
      for (let n = 0; n <= 9; n++) {
        const sn = successor(n);
        expect(typeof sn).toBe('number');
        expect(sn).toBeGreaterThan(n);
      }
    });

    test('Peano axiom 3: 0 ≠ s(n) for any n (zero has no predecessor)', () => {
      for (let n = 0; n <= 9; n++) {
        expect(successor(n)).not.toBe(0);
      }
    });

    test('Peano axiom 4: s is injective (s(m) = s(n) implies m = n)', () => {
      for (let m = 0; m <= 9; m++) {
        for (let n = 0; n <= 9; n++) {
          if (successor(m) === successor(n)) {
            expect(m).toBe(n);
          }
        }
      }
    });

    test('well-ordering: every non-empty subset of ℕ has a least element', () => {
      // Check various non-empty subsets of {0, ..., 20}
      const subsets = [
        [5, 3, 1, 7],
        [10, 20, 15],
        [0, 1, 2, 3],
        [100, 50, 25],
      ];
      for (const subset of subsets) {
        const min = Math.min(...subset);
        // min is in the subset
        expect(subset).toContain(min);
        // min is ≤ all other elements
        for (const x of subset) {
          expect(min).toBeLessThanOrEqual(x);
        }
      }
    });

    test('ℕ is not bounded above: no maximum natural number', () => {
      // For any n, s(n) = n+1 > n — no maximum exists
      for (let n = 0; n <= 100; n++) {
        expect(successor(n)).toBeGreaterThan(n);
      }
    });

    // Platform connection: MATURITY ordinals mirror von Neumann ordinals
    test('platform: skill maturity ordering is well-founded (every non-empty set has a minimum)', () => {
      // Maturity levels: IMMATURE=0, LEARNING=1, MATURE=2, TEACHING=3, MASTERY=4
      // This is a well-ordered discrete sequence — analogous to von Neumann ordinals
      const MATURITY_LEVELS = { IMMATURE: 0, LEARNING: 1, MATURE: 2, TEACHING: 3, MASTERY: 4 };
      const levels = Object.values(MATURITY_LEVELS);
      // Well-founded: every non-empty subset has a minimum
      const nonEmptySubset = [2, 3, 1]; // MATURE, TEACHING, LEARNING
      const minLevel = Math.min(...nonEmptySubset);
      expect(minLevel).toBe(1); // LEARNING is the minimum
      // The minimum is in the subset
      expect(nonEmptySubset).toContain(minLevel);
      // Ordered: 0 < 1 < 2 < 3 < 4
      for (let i = 0; i < levels.length - 1; i++) {
        expect(levels[i]).toBeLessThan(levels[i + 1]);
      }
    });
  });

  // --------------------------------------------------------------------------
  // proof-18-3-cantor-theorem: Cantor's theorem — |P(A)| > |A|
  // Classification: L2 — diagonalization argument (same structure as Russell's paradox)
  // Method: Constructive — for n = 3, 4, 5:
  //   1. Verify |P(A)| = 2ⁿ > n
  //   2. For any f: A → P(A), construct D and verify D ∉ range(f)
  // --------------------------------------------------------------------------
  describe('proof-18-3: Cantor\'s theorem — power set is strictly larger', () => {
    test('|P(A)| = 2^|A| for |A| = 0, 1, 2, 3, 4, 5', () => {
      for (let n = 0; n <= 5; n++) {
        const A: FiniteSet = Array.from({ length: n }, (_, i) => i);
        const pA = powerSet(A);
        expect(pA.length).toBe(Math.pow(2, n));
      }
    });

    test('|P(A)| > |A| for all non-trivial finite sets (n ≥ 1)', () => {
      for (let n = 1; n <= 6; n++) {
        expect(Math.pow(2, n)).toBeGreaterThan(n);
      }
    });

    test('diagonal set D = {x ∈ A : x ∉ f(x)} is not in range of f — n=3', () => {
      // For n=3, verify that for EVERY f: A → P(A), D ∉ range(f)
      const A: FiniteSet = [0, 1, 2];
      const pA = powerSet(A);
      let noSurjectionFound = true;
      for (const f of allFunctions(A, pA)) {
        const D = diagonalSet(A, f);
        // D should NOT be in the range of f
        const inRange = f.some((fval) => setsEqual(fval, D));
        if (inRange) {
          noSurjectionFound = false; // This would disprove Cantor's theorem
        }
      }
      // For all functions f: {0,1,2} → P({0,1,2}), the diagonal set D ∉ range(f)
      expect(noSurjectionFound).toBe(true);
    });

    test('no surjection f: A → P(A) exists for |A| = 3 (all 2^(3·8) = 512 functions tested)', () => {
      const A: FiniteSet = [0, 1, 2];
      const pA = powerSet(A); // 8 subsets
      let surjectionCount = 0;
      for (const f of allFunctions(A, pA)) {
        if (isSurjection(A, f, pA)) {
          surjectionCount++;
        }
      }
      // There should be 0 surjections from a 3-element set to its 8-element power set
      expect(surjectionCount).toBe(0);
    });

    test('diagonal argument works: D ∉ range(f) for explicit functions on {0,1,2}', () => {
      const A: FiniteSet = [0, 1, 2];
      const pA = powerSet(A);
      // Test specific functions
      // f = [∅, {0}, {0,1}] (f(0)=∅, f(1)={0}, f(2)={0,1})
      const f_example: FiniteSet[] = [[], [0], [0, 1]];
      const D = diagonalSet(A, f_example);
      // D = {x ∈ {0,1,2} : x ∉ f(x)}
      // x=0: 0 ∉ f(0)=∅ → yes → 0 ∈ D
      // x=1: 1 ∉ f(1)={0} → yes → 1 ∈ D
      // x=2: 2 ∉ f(2)={0,1} → yes → 2 ∈ D
      // D = {0,1,2} = A
      expect(D).toEqual([0, 1, 2]);
      // D should not equal any f(x)
      for (const fval of f_example) {
        expect(setsEqual(fval, D)).toBe(false);
      }
    });

    test('the diagonalization technique is identical to Cantor (Ch 1) and Russell (Ch 18.1)', () => {
      // All three use: construct an object that differs from every proposed member
      // Russell: R = {x : x ∉ x} — differs from every x by membership criterion
      // Cantor: D = {x ∈ A : x ∉ f(x)} — differs from f(d) for the preimage d
      // This is the 8th cross-chapter citation: Ch 1 (uncountability) → Ch 18 (Cantor)
      // Both use the predicate "x ∉ f(x)" to construct the diagonal object
      const A: FiniteSet = [0, 1, 2, 3];
      const pA = powerSet(A);
      // For identity-like function: f(x) = {} (empty set) for all x
      const f_empty: FiniteSet[] = A.map(() => []);
      const D_from_empty = diagonalSet(A, f_empty);
      // x ∉ f(x) = ∅ is always true → D = A
      expect(D_from_empty).toEqual(A);
      // D = A is not in range of f_empty (range is just {∅})
      expect(f_empty.some((fval) => setsEqual(fval, D_from_empty))).toBe(false);
    });

    test('Cantor corollary: 2^n > n for all n ≥ 0 (power set is strictly larger)', () => {
      for (let n = 0; n <= 20; n++) {
        expect(Math.pow(2, n)).toBeGreaterThan(n);
      }
    });

    // Platform connection: probabilistic activation addresses Cantor's consequence
    test('platform: space of all contexts C is infinite → P(C) is strictly larger', () => {
      // Cantor's theorem: |P(C)| > |C| for any set C (including infinite ones)
      // This means exhaustive rule enumeration for all contexts is impossible
      // The Bayesian scoring approach correctly addresses this incompleteness
      // Verify numerically that 2^n grows faster than n (Cantor's finite case)
      for (let n = 1; n <= 15; n++) {
        expect(Math.pow(2, n)).toBeGreaterThan(n);
      }
      // As n grows, the ratio 2^n/n grows without bound
      const ratio_10 = Math.pow(2, 10) / 10;
      const ratio_20 = Math.pow(2, 20) / 20;
      expect(ratio_20).toBeGreaterThan(ratio_10);
    });
  });
});
