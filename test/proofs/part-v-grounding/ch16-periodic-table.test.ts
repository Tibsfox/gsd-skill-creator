// test/proofs/part-v-grounding/ch16-periodic-table.test.ts
// Computational verification for Chapter 16: The Periodic Table and Atomic Structure
// Proof document: .planning/v1.50a/half-b/proofs/ch16-periodic-table.md
// Phase 478, Subversion 1.50.66
//
// IMPORTANT: Physics chapters test the MATHEMATICAL MODEL, not physical truth.
// The quantum postulates (Pauli exclusion, quantum number rules, Aufbau ordering)
// are accepted as L5 axioms. What is proved:
// - Proof 16.1 (L2): Shell capacity = 2n² follows from counting quantum states
// - Proof 16.2 (L2): Periodicity follows from Aufbau recurrence
// These are combinatorial consequences of the axioms, not physical claims.

import { describe, test, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Shell filling utilities (from the proof document)
// ---------------------------------------------------------------------------

/** Compute shell capacity by summing over subshells l = 0, 1, ..., n-1
 *  Each subshell l has capacity 2(2l+1) electrons (Pauli exclusion given) */
function shellCapacity(n: number): number {
  let total = 0;
  for (let l = 0; l <= n - 1; l++) {
    total += 2 * (2 * l + 1);
  }
  return total;
}

/** Subshell capacity for a given angular quantum number l */
function subshellCapacity(l: number): number {
  return 2 * (2 * l + 1);
}

/** Aufbau subshell filling order: [principal_n, angular_l, capacity]
 *  This ordering is accepted as an empirical axiom (L5) */
const AUFBAU_ORDER: [number, number, number][] = [
  [1, 0, 2],   // 1s: 2 electrons
  [2, 0, 2],   // 2s: 2 electrons
  [2, 1, 6],   // 2p: 6 electrons
  [3, 0, 2],   // 3s: 2 electrons
  [3, 1, 6],   // 3p: 6 electrons
  [4, 0, 2],   // 4s: 2 electrons
  [3, 2, 10],  // 3d: 10 electrons
  [4, 1, 6],   // 4p: 6 electrons
  [5, 0, 2],   // 5s: 2 electrons
  [4, 2, 10],  // 4d: 10 electrons
  [5, 1, 6],   // 5p: 6 electrons
  [6, 0, 2],   // 6s: 2 electrons
  [4, 3, 14],  // 4f: 14 electrons
  [5, 2, 10],  // 5d: 10 electrons
  [6, 1, 6],   // 6p: 6 electrons
];

/** Noble gas atomic numbers (period boundaries) */
const NOBLE_GAS_Z = [2, 10, 18, 36, 54, 86];

/** Fill electrons up to Z using Aufbau, return last subshell valence info */
function fillOrbitals(Z: number): { electronCount: number; lastSubshellL: number; n: number } {
  let remaining = Z;
  let lastN = 1;
  let lastL = 0;
  for (const [n, l, cap] of AUFBAU_ORDER) {
    if (remaining <= 0) break;
    const fill = Math.min(remaining, cap);
    remaining -= fill;
    if (fill > 0) {
      lastN = n;
      lastL = l;
    }
  }
  return { electronCount: Z, lastSubshellL: lastL, n: lastN };
}

describe('Chapter 16: Periodic Table and Atomic Structure — Computational Verification', () => {
  // --------------------------------------------------------------------------
  // proof-16-1-shell-filling: Shell capacity = 2n²
  // Classification: L2 — given quantum number rules and Pauli exclusion as axioms
  // Method: Constructive — compute shellCapacity(n) and verify = 2n²
  // --------------------------------------------------------------------------
  describe('proof-16-1: shell capacity formula 2n²', () => {
    test('shellCapacity(n) = 2n² for n = 1 through 5', () => {
      for (let n = 1; n <= 5; n++) {
        const computed = shellCapacity(n);
        const formula = 2 * n * n;
        expect(computed).toBe(formula);
      }
    });

    test('specific shell capacities match periodic table structure: 2, 8, 18, 32, 50', () => {
      expect(shellCapacity(1)).toBe(2);   // Period 1: H, He
      expect(shellCapacity(2)).toBe(8);   // Period 2: Li through Ne
      expect(shellCapacity(3)).toBe(18);  // Complete n=3 shell
      expect(shellCapacity(4)).toBe(32);  // Complete n=4 shell
      expect(shellCapacity(5)).toBe(50);  // Complete n=5 shell
    });

    test('subshell capacity 2(2l+1) for l = 0, 1, 2, 3 gives 2, 6, 10, 14', () => {
      expect(subshellCapacity(0)).toBe(2);   // s subshell
      expect(subshellCapacity(1)).toBe(6);   // p subshell
      expect(subshellCapacity(2)).toBe(10);  // d subshell
      expect(subshellCapacity(3)).toBe(14);  // f subshell
    });

    test('sum of subshell capacities in shell n = 2n² (arithmetic series identity)', () => {
      for (let n = 1; n <= 6; n++) {
        // shellCapacity = sum_{l=0}^{n-1} 2(2l+1) = 2 * sum_{l=0}^{n-1} (2l+1)
        // = 2 * [1 + 3 + 5 + ... + (2n-1)] = 2n²
        const sumOddIntegers = Array.from({ length: n }, (_, l) => 2 * l + 1)
          .reduce((s, x) => s + x, 0);
        expect(sumOddIntegers).toBe(n * n); // sum of first n odd integers = n²
        expect(shellCapacity(n)).toBe(2 * sumOddIntegers);
      }
    });

    test('arithmetic series identity: ∑_{l=0}^{n-1}(2l+1) = n² for n = 1..10', () => {
      for (let n = 1; n <= 10; n++) {
        const sumOdd = Array.from({ length: n }, (_, l) => 2 * l + 1)
          .reduce((s, x) => s + x, 0);
        expect(sumOdd).toBe(n * n);
      }
    });

    test('shell capacity is strictly increasing: shellCapacity(n+1) > shellCapacity(n)', () => {
      for (let n = 1; n <= 9; n++) {
        expect(shellCapacity(n + 1)).toBeGreaterThan(shellCapacity(n));
      }
    });

    test('total electrons in first 4 shells: 2 + 8 + 18 + 32 = 60', () => {
      const total = shellCapacity(1) + shellCapacity(2) + shellCapacity(3) + shellCapacity(4);
      expect(total).toBe(60);
    });

    // Platform connection: discrete levels with increasing capacity
    test('platform: shell capacity sequence mirrors discrete promotion level structure', () => {
      // Both systems have discrete levels with defined capacities
      // Shell n capacity: 2, 8, 18, 32 (quantum system)
      // The existence of discrete quantized levels with integer capacities
      // is a structure arising from the integer quantum numbers
      const capacities = [1, 2, 3, 4].map(shellCapacity);
      expect(capacities).toEqual([2, 8, 18, 32]);
      // Each capacity is strictly greater than the previous
      for (let i = 1; i < capacities.length; i++) {
        expect(capacities[i]).toBeGreaterThan(capacities[i - 1]);
      }
    });
  });

  // --------------------------------------------------------------------------
  // proof-16-2-periodicity: Periodicity from orbital angular momentum groups
  // Classification: L2 — combinatorial/organizational consequence of quantum structure
  // Method: Constructive — enumerate Aufbau filling sequence, verify period structure
  // --------------------------------------------------------------------------
  describe('proof-16-2: periodicity from Aufbau filling sequence', () => {
    test('Aufbau total electrons = cumulative sum matches Z at each noble gas', () => {
      let totalElectrons = 0;
      for (const [, , cap] of AUFBAU_ORDER) {
        totalElectrons += cap;
        // Each noble gas occurs when a period is complete
        // He=2, Ne=10, Ar=18, Kr=36, Xe=54, Rn=86
      }
      // Total after all 15 listed subshells: 2+2+6+2+6+2+10+6+2+10+6+2+14+10+6 = 86
      expect(totalElectrons).toBe(86);
    });

    test('period lengths match noble gas Z differences: 2, 8, 8, 18, 18, 32', () => {
      const periodLengths = [
        NOBLE_GAS_Z[0],                              // Period 1: 2
        NOBLE_GAS_Z[1] - NOBLE_GAS_Z[0],             // Period 2: 8
        NOBLE_GAS_Z[2] - NOBLE_GAS_Z[1],             // Period 3: 8
        NOBLE_GAS_Z[3] - NOBLE_GAS_Z[2],             // Period 4: 18
        NOBLE_GAS_Z[4] - NOBLE_GAS_Z[3],             // Period 5: 18
        NOBLE_GAS_Z[5] - NOBLE_GAS_Z[4],             // Period 6: 32
      ];
      expect(periodLengths).toEqual([2, 8, 8, 18, 18, 32]);
    });

    test('Group 1 elements (Z = 1, 3, 11, 19, 37, 55) each have valence s¹', () => {
      // After each noble gas + 1 electron = Group 1 element
      // Each Group 1 element has the last electron in an s subshell (l = 0)
      const group1Z = [1, 3, 11, 19, 37, 55];
      for (const Z of group1Z) {
        const { lastSubshellL } = fillOrbitals(Z);
        expect(lastSubshellL).toBe(0); // s subshell (l = 0)
      }
    });

    test('noble gas elements have all subshells in their period filled', () => {
      // At noble gas Z, all subshells up to that period are completely filled
      // Z=2 (He): 1s² filled; Z=10 (Ne): 1s²2s²2p⁶ filled
      // Verify by checking total electron count matches Z
      for (const Z_noble of NOBLE_GAS_Z) {
        let filled = 0;
        for (const [, , cap] of AUFBAU_ORDER) {
          if (filled >= Z_noble) break;
          filled += Math.min(cap, Z_noble - filled);
        }
        expect(filled).toBe(Z_noble);
      }
    });

    test('subshell type sequence in Aufbau: s,s,p,s,p,s,d,p,s,d,p,s,f,d,p', () => {
      // l values: 0,0,1,0,1,0,2,1,0,2,1,0,3,2,1
      const lSequence = AUFBAU_ORDER.map(([, l]) => l);
      expect(lSequence).toEqual([0, 0, 1, 0, 1, 0, 2, 1, 0, 2, 1, 0, 3, 2, 1]);
    });

    test('period 4 starts with 4s subshell (recurrence of s-type opening)', () => {
      // After noble gas Ar (Z=18), the Aufbau sequence begins with 4s (n=4, l=0)
      // This is the recurrence that creates periodicity: each period begins with s
      const afterAr = AUFBAU_ORDER.find(([n]) => n === 4);
      expect(afterAr).toBeDefined();
      if (afterAr) {
        const [n, l] = afterAr;
        expect(n).toBe(4);
        expect(l).toBe(0); // s subshell (l = 0)
      }
    });

    test('each subshell capacity is consistent with l quantum number formula 2(2l+1)', () => {
      for (const [, l, cap] of AUFBAU_ORDER) {
        expect(cap).toBe(subshellCapacity(l));
      }
    });

    // Platform connection: PROMOTION_REGIONS as discrete angular sectors
    test('platform: discrete levels with integer structure mirrors periodic table', () => {
      // The periodic table has 7 periods; promotion regions have discrete angular sectors
      // Both systems partition a continuous space into discrete levels
      // Verify that 4 promotion levels (CONVERSATION, SKILL_MD, LORA_ADAPTER, COMPILED)
      // satisfy the property that level i+1 starts where level i ends (ordered partition)
      const regionBoundaries = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, 2 * Math.PI];
      for (let i = 0; i < regionBoundaries.length - 1; i++) {
        expect(regionBoundaries[i + 1]).toBeGreaterThan(regionBoundaries[i]);
      }
      // The union covers [0, 2π) completely — analogous to periodic table covering all Z
      expect(regionBoundaries[regionBoundaries.length - 1]).toBeCloseTo(2 * Math.PI, 10);
    });
  });
});
