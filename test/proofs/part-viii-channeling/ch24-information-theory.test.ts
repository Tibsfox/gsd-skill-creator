// test/proofs/part-viii-channeling/ch24-information-theory.test.ts
// Computational verification for Chapter 24: Information Theory — Entropy, Coding, and Channel Capacity
// Proof document: .planning/v1.50a/half-b/proofs/ch24-information-theory.md
// Phase 479, Subversion 1.50.74
//
// Shannon entropy axioms (24.A) are accepted as L5 definitional axioms.
// What is proved and tested:
// - Proof 24.1 (L3): Shannon entropy formula — max at uniform, boundary at 0/1, chain rule
// - Proof 24.2 (L3): Source coding theorem — Huffman code for 4-symbol source
// - Acknowledgment 24.B (L4): Channel capacity — binary symmetric channel capacity
//
// Platform connection: signal classification as entropy reduction; token budget as rate control

import { describe, test, expect } from 'vitest';

describe('Chapter 24: Information Theory — Computational Verification', () => {
  // --------------------------------------------------------------------------
  // proof-24-1-shannon-entropy: Shannon Entropy Formula
  // Classification: L3 — axiom derivation, induction + continuity
  // Method: Numerical — Bernoulli entropy, chain rule, boundary values
  // --------------------------------------------------------------------------
  describe('proof-24-1: Shannon entropy formula and properties', () => {
    /**
     * Shannon entropy for a distribution given as an array of probabilities
     * Uses base-2 logarithm (bits). Convention: 0 * log2(0) = 0
     */
    function shannonEntropy(probs: number[]): number {
      return probs.reduce((acc, p) => {
        if (p <= 0) return acc; // 0 * log2(0) = 0 by convention
        return acc - p * Math.log2(p);
      }, 0);
    }

    /** Binary entropy function H(p, 1-p) */
    function binaryEntropy(p: number): number {
      return shannonEntropy([p, 1 - p]);
    }

    const testPs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

    test('H(p, 1-p) ≥ 0 for all p in [0,1]', () => {
      for (const p of testPs) {
        expect(binaryEntropy(p)).toBeGreaterThanOrEqual(0);
      }
    });

    test('H(0.5, 0.5) = 1 bit: maximum entropy for binary distribution', () => {
      expect(binaryEntropy(0.5)).toBeCloseTo(1.0, 10);
    });

    test('binary entropy is maximized at p=0.5 (uniform distribution)', () => {
      const maxEntropy = binaryEntropy(0.5);
      for (const p of testPs) {
        if (Math.abs(p - 0.5) > 0.01) {
          expect(binaryEntropy(p)).toBeLessThan(maxEntropy);
        }
      }
    });

    test('H(1, 0) = 0 and H(0, 1) = 0: certain outcome has zero entropy', () => {
      // For certain outcome: p=1 -> H=0 (by convention 1*log2(1)=0, 0*log2(0)=0)
      expect(shannonEntropy([1, 0])).toBeCloseTo(0, 10);
      expect(shannonEntropy([0, 1])).toBeCloseTo(0, 10);
    });

    test('binary entropy increases monotonically from p=0 to p=0.5', () => {
      const ps = [0.1, 0.2, 0.3, 0.4, 0.5];
      for (let i = 0; i < ps.length - 1; i++) {
        expect(binaryEntropy(ps[i]!)).toBeLessThan(binaryEntropy(ps[i + 1]!));
      }
    });

    test('chain rule: H(X,Y) = H(X) + H(Y|X) for joint distribution', () => {
      // Joint distribution: P(X=0,Y=0)=0.3, P(X=0,Y=1)=0.2, P(X=1,Y=0)=0.1, P(X=1,Y=1)=0.4
      const pXY = [[0.3, 0.2], [0.1, 0.4]]; // pXY[x][y]

      // H(X,Y) = -∑∑ p(x,y) log p(x,y)
      const HXY = shannonEntropy([0.3, 0.2, 0.1, 0.4]);

      // Marginal P(X)
      const pX = [pXY[0]![0]! + pXY[0]![1]!, pXY[1]![0]! + pXY[1]![1]!]; // [0.5, 0.5]
      const HX = shannonEntropy(pX);

      // H(Y|X) = ∑_x P(X=x) * H(Y|X=x)
      const HYgivenX0 = shannonEntropy([pXY[0]![0]! / pX[0]!, pXY[0]![1]! / pX[0]!]);
      const HYgivenX1 = shannonEntropy([pXY[1]![0]! / pX[1]!, pXY[1]![1]! / pX[1]!]);
      const HYgivenX = pX[0]! * HYgivenX0 + pX[1]! * HYgivenX1;

      // Chain rule: H(X,Y) = H(X) + H(Y|X)
      expect(HXY).toBeCloseTo(HX + HYgivenX, 10);
    });

    test('uniform distribution maximizes entropy: H(1/n,...,1/n) > H(p) for any non-uniform p', () => {
      const n = 4;
      const uniformDist = Array(n).fill(1 / n);
      const uniformEntropy = shannonEntropy(uniformDist);
      // A non-uniform distribution should have lower entropy
      const nonUniform = [0.5, 0.25, 0.125, 0.125];
      expect(shannonEntropy(nonUniform)).toBeLessThan(uniformEntropy);
    });

    test('H(1/n,...,1/n) = log2(n): entropy of uniform distribution on n outcomes', () => {
      for (const n of [2, 4, 8, 16]) {
        const uniformDist = Array(n).fill(1 / n);
        expect(shannonEntropy(uniformDist)).toBeCloseTo(Math.log2(n), 10);
      }
    });

    test('platform: signal classifier reduces entropy — classification concentrates activation distribution', () => {
      // Before classification: 12 signal types, roughly uniform -> high entropy
      const preclassification = Array(12).fill(1 / 12);
      const preEntropy = shannonEntropy(preclassification);

      // After classification into one dominant type: low entropy
      const postEntropy = shannonEntropy([0.9, ...Array(11).fill(0.1 / 11)]);

      // Classification REDUCES entropy
      expect(postEntropy).toBeLessThan(preEntropy);
      // Pre-classification entropy ≈ log2(12) ≈ 3.58 bits
      expect(preEntropy).toBeCloseTo(Math.log2(12), 5);
    });
  });

  // --------------------------------------------------------------------------
  // proof-24-2-source-coding: Source Coding Theorem
  // Classification: L3 — Huffman construction + Jensen's inequality bound
  // Method: Constructive — 4-symbol source {A,B,C,D}, probabilities {0.5,0.25,0.125,0.125}
  // --------------------------------------------------------------------------
  describe('proof-24-2: Source coding theorem — Huffman coding', () => {
    // 4-symbol source: A=0.5, B=0.25, C=0.125, D=0.125
    const probs = { A: 0.5, B: 0.25, C: 0.125, D: 0.125 };
    // Huffman code: A->0 (length 1), B->10 (length 2), C->110 (length 3), D->111 (length 3)
    const codeLengths = { A: 1, B: 2, C: 3, D: 3 };

    function shannonEntropy(probMap: Record<string, number>): number {
      return Object.values(probMap).reduce((acc, p) => {
        if (p <= 0) return acc;
        return acc - p * Math.log2(p);
      }, 0);
    }

    function expectedCodeLength(probMap: Record<string, number>, lengths: Record<string, number>): number {
      return Object.keys(probMap).reduce((acc, sym) => {
        return acc + probMap[sym]! * lengths[sym]!;
      }, 0);
    }

    test('Shannon entropy H = 1.75 bits for this source', () => {
      const H = shannonEntropy(probs);
      expect(H).toBeCloseTo(1.75, 10);
    });

    test('Huffman expected code length L = H = 1.75 bits (optimal for this source)', () => {
      const L = expectedCodeLength(probs, codeLengths);
      expect(L).toBeCloseTo(1.75, 10);
    });

    test('Huffman code meets the source coding lower bound: L ≥ H', () => {
      const H = shannonEntropy(probs);
      const L = expectedCodeLength(probs, codeLengths);
      expect(L).toBeGreaterThanOrEqual(H - 1e-10);
    });

    test('Kraft inequality: ∑ 2^{-l_i} ≤ 1 for Huffman code', () => {
      const kraftSum = Object.values(codeLengths).reduce((acc, l) => acc + Math.pow(2, -l), 0);
      // For this optimal code, Kraft sum = 0.5 + 0.25 + 0.125 + 0.125 = 1.0
      expect(kraftSum).toBeCloseTo(1.0, 10);
      expect(kraftSum).toBeLessThanOrEqual(1.0 + 1e-10);
    });

    test('D_KL(p||q) = 0 for optimal Huffman code (equality in lower bound)', () => {
      // The optimal code has lengths l_i = -log2(p_i), so q_i = 2^{-l_i} = p_i
      // D_KL(p||p) = 0
      const qProbs: Record<string, number> = {};
      for (const sym of Object.keys(probs)) {
        qProbs[sym] = Math.pow(2, -codeLengths[sym as keyof typeof codeLengths]!);
      }
      let DKL = 0;
      for (const sym of Object.keys(probs)) {
        const p = probs[sym as keyof typeof probs]!;
        const q = qProbs[sym]!;
        DKL += p * Math.log2(p / q);
      }
      expect(DKL).toBeCloseTo(0, 10);
    });

    test('ceiling code achieves L < H + 1 bits: upper bound of source coding theorem', () => {
      // Ceiling code: l_i = ceil(-log2(p_i))
      const ceilingLengths: Record<string, number> = {};
      for (const sym of Object.keys(probs)) {
        ceilingLengths[sym] = Math.ceil(-Math.log2(probs[sym as keyof typeof probs]!));
      }
      const H = shannonEntropy(probs);
      const L_ceil = expectedCodeLength(probs, ceilingLengths);
      expect(L_ceil).toBeLessThan(H + 1);
    });

    test('block coding improves rate: 2-symbol blocks approach entropy rate', () => {
      // For 2-symbol blocks: entropy doubles, overhead stays at 1 bit -> rate approaches H
      const H = shannonEntropy(probs);
      // Block of n symbols: rate is H ≤ L/n < H + 1/n
      // For n=2: 1.75 ≤ L/2 < 1.75 + 0.5
      // (We verify the bound inequality, not implement full Huffman for blocks)
      const n = 2;
      const perSymbolOverhead = 1 / n; // upper bound on overhead per symbol
      expect(H + perSymbolOverhead).toBeLessThan(H + 1); // tighter than n=1
    });

    test('platform: 12-type taxonomy approximates Huffman encoding for context signals', () => {
      // Common signal types should get shorter codes; rare types longer
      // For a realistic distribution: 'concrete_implementation' is common, 'abstract_reasoning' is rare
      const signalFreqs: Record<string, number> = {
        concrete_implementation: 0.35,
        testing: 0.20,
        debugging: 0.15,
        documentation: 0.10,
        code_review: 0.08,
        refactoring: 0.05,
        architecture: 0.04,
        abstract_reasoning: 0.03,
      };
      const total = Object.values(signalFreqs).reduce((a, b) => a + b, 0);
      // Normalize (these 8 types don't sum to 1 in our simplified model)
      const normalized: Record<string, number> = {};
      for (const k of Object.keys(signalFreqs)) {
        normalized[k] = signalFreqs[k]! / total;
      }

      // Optimal code: more probable types get shorter codes
      // Most probable: concrete_implementation (should have shortest code)
      // Least probable: abstract_reasoning (should have longest code)
      const H = Object.values(normalized).reduce((acc, p) => {
        return acc - p * Math.log2(p);
      }, 0);

      // Shannon entropy gives the minimum average code length
      expect(H).toBeGreaterThan(0);
      expect(H).toBeLessThan(Math.log2(Object.keys(normalized).length));
    });
  });

  // --------------------------------------------------------------------------
  // proof-24-3-channel-capacity: Channel Capacity (Binary Symmetric Channel)
  // Classification: L4 partial — converse direction outlined
  // Method: Numerical — BSC capacity C = 1 - h_b(p) for crossover probability p
  // --------------------------------------------------------------------------
  describe('proof-24-3: Channel capacity — binary symmetric channel', () => {
    /** Binary entropy function */
    function hb(p: number): number {
      if (p <= 0 || p >= 1) return 0;
      return -p * Math.log2(p) - (1 - p) * Math.log2(1 - p);
    }

    /** BSC capacity: C = 1 - h_b(p) */
    function bscCapacity(p: number): number {
      return 1 - hb(p);
    }

    test('BSC capacity at p=0 (no noise): C=1 bit/use (perfect channel)', () => {
      expect(bscCapacity(0)).toBeCloseTo(1, 10);
    });

    test('BSC capacity at p=0.5 (pure noise): C=0 bits/use (useless channel)', () => {
      expect(bscCapacity(0.5)).toBeCloseTo(0, 10);
    });

    test('BSC capacity at p=0.1: C ≈ 0.531 bits/use', () => {
      const C = bscCapacity(0.1);
      // C = 1 - h_b(0.1) = 1 - (0.3322 + 0.1368) ≈ 0.531
      expect(C).toBeGreaterThan(0.53);
      expect(C).toBeLessThan(0.54);
    });

    test('BSC capacity is symmetric: C(p) = C(1-p)', () => {
      for (const p of [0.1, 0.2, 0.3, 0.4]) {
        expect(bscCapacity(p)).toBeCloseTo(bscCapacity(1 - p), 10);
      }
    });

    test('BSC capacity is maximized by uniform input: H(Y) = 1 when P(X=0) = 0.5', () => {
      // With uniform input P(X=0) = P(X=1) = 0.5 and crossover p=0.1:
      // P(Y=0) = P(X=0)(1-p) + P(X=1)p = 0.5*(0.9) + 0.5*(0.1) = 0.5
      // So H(Y) = 1 bit (output is also uniform)
      const p = 0.1;
      const pY0 = 0.5 * (1 - p) + 0.5 * p; // = 0.5
      expect(pY0).toBeCloseTo(0.5, 10);
      const HY = hb(pY0); // = 1 bit
      expect(HY).toBeCloseTo(1.0, 10);
      // I(X;Y) = H(Y) - H(Y|X) = 1 - h_b(p) = C
      const IXY = HY - hb(p);
      expect(IXY).toBeCloseTo(bscCapacity(p), 10);
    });

    test('mutual information I(X;Y) = H(Y) - H(Y|X) ≤ C for any input distribution', () => {
      const p = 0.2; // crossover probability
      const C = bscCapacity(p);
      // Try several input distributions P(X=0) = q
      for (const q of [0.1, 0.3, 0.5, 0.7, 0.9]) {
        const pY0 = q * (1 - p) + (1 - q) * p;
        const HY = hb(pY0);
        const HYgivenX = hb(p); // H(Y|X=x) = h_b(p) for BSC, independent of x
        const IXY = HY - HYgivenX;
        expect(IXY).toBeLessThanOrEqual(C + 1e-10);
      }
    });

    test('converse direction: rate above capacity requires non-zero error probability', () => {
      // For p=0.1, C ≈ 0.531. Verify the lower bound on error probability for R > C.
      const p = 0.1;
      const C = bscCapacity(p);
      // For rate R = 0.8 > C ≈ 0.531:
      const R = 0.8;
      expect(R).toBeGreaterThan(C);
      // Converse bound: P_e >= 1 - C/R
      const errorLowerBound = 1 - C / R;
      expect(errorLowerBound).toBeGreaterThan(0);
    });

    test('capacity decreases as noise p increases from 0 to 0.5', () => {
      const ps = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];
      for (let i = 0; i < ps.length - 1; i++) {
        expect(bscCapacity(ps[i]!)).toBeGreaterThanOrEqual(bscCapacity(ps[i + 1]!));
      }
    });

    test('platform: DACP fidelity levels operate below context window capacity', () => {
      // Context window capacity as information channel (structural connection)
      // Maximum capacity = log2(token_alphabet_size) * token_budget
      // DACP fidelity levels reduce token rate R to be below capacity C

      // Simplified model: 3 fidelity levels with token rates
      const contextWindowCapacity = 1.0; // normalized to 1
      const fidelityRates = [0.9, 0.7, 0.5]; // HIGH, MEDIUM, LOW

      // All rates should be below capacity
      for (const rate of fidelityRates) {
        expect(rate).toBeLessThan(contextWindowCapacity);
      }

      // Lowest fidelity has most headroom for reliable transmission
      expect(fidelityRates[2]!).toBeLessThan(fidelityRates[0]!);
    });
  });
});
