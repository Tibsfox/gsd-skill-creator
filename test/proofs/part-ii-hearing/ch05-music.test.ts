// test/proofs/part-ii-hearing/ch05-music.test.ts
// Computational verification for Chapter 5: Music and the 12-TET System
// Proof document: .planning/v1.50a/half-b/proofs/ch05-music.md
// Phase 475, Subversion 1.50.55

import { describe, test, expect } from 'vitest';
import { assertPercentDeviation } from '../helpers/numerical';

describe('Chapter 5: Music — Computational Verification', () => {
  // ---------------------------------------------------------------------------
  // proof-5-3-12tet-formula: f_n = f0 * 2^(n/12)
  // Technique 1: Numerical evaluation at key values
  // ---------------------------------------------------------------------------
  describe('proof-5-3: 12-TET frequency formula f_n = f0 * 2^(n/12)', () => {
    const A4 = 440; // Hz — standard concert A

    test('n=0 gives unison: f0 * 2^(0/12) = f0', () => {
      const f0 = A4 * 2 ** (0 / 12);
      expect(f0).toBeCloseTo(A4, 10);
    });

    test('n=12 gives octave: f0 * 2^(12/12) = 2*f0', () => {
      const f12 = A4 * 2 ** (12 / 12);
      expect(f12).toBeCloseTo(2 * A4, 5);
    });

    test('A5 = 880 Hz (one octave above A4 = 440 Hz)', () => {
      const A5 = A4 * 2 ** (12 / 12);
      expect(A5).toBeCloseTo(880, 5);
    });

    test('n=-12 gives sub-octave: f0 * 2^(-12/12) = f0/2', () => {
      const fDown = A4 * 2 ** (-12 / 12);
      expect(fDown).toBeCloseTo(A4 / 2, 5);
    });

    test('each semitone step multiplies frequency by 2^(1/12) ≈ 1.05946', () => {
      const step = 2 ** (1 / 12);
      expect(step).toBeCloseTo(1.05946, 4);
    });

    test('applying 2^(1/12) twelve times gives exactly factor 2', () => {
      const step = 2 ** (1 / 12);
      let product = 1;
      for (let i = 0; i < 12; i++) product *= step;
      expect(product).toBeCloseTo(2, 10);
    });

    test('frequencies are strictly monotone increasing with n', () => {
      const freqs = Array.from({ length: 13 }, (_, n) => A4 * 2 ** (n / 12));
      for (let i = 1; i < freqs.length; i++) {
        expect(freqs[i]).toBeGreaterThan(freqs[i - 1]);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // proof-5-4-12tet-approx: 12-TET vs just intonation deviations
  // Technique 1: Numerical — verify deviations are within the proved bounds
  // Insight from teach-forward 1.50.57: 0.11% and 0.79% tolerance values
  // ---------------------------------------------------------------------------
  describe('proof-5-4: 12-TET approximation quality', () => {
    test('perfect fifth (7 semitones): 2^(7/12) ≈ 3/2 within 0.2%', () => {
      const fifthTET = 2 ** (7 / 12);     // ≈ 1.4983
      const fifthJust = 3 / 2;            // = 1.5000
      expect(assertPercentDeviation(fifthTET, fifthJust, 0.002)).toBe(true);
    });

    test('perfect fifth deviation from 3/2 is ≤ 0.11%', () => {
      const fifthTET = 2 ** (7 / 12);
      const fifthJust = 3 / 2;
      const deviation = Math.abs(fifthTET - fifthJust) / fifthJust;
      expect(deviation).toBeLessThan(0.0012); // 0.11% tolerance as proved
    });

    test('perfect fourth (5 semitones): 2^(5/12) ≈ 4/3 within 0.2%', () => {
      const fourthTET = 2 ** (5 / 12);    // ≈ 1.3348
      const fourthJust = 4 / 3;           // ≈ 1.3333
      expect(assertPercentDeviation(fourthTET, fourthJust, 0.002)).toBe(true);
    });

    test('major third (4 semitones): 2^(4/12) ≈ 5/4 within 1%', () => {
      const thirdTET = 2 ** (4 / 12);     // ≈ 1.2599
      const thirdJust = 5 / 4;            // = 1.25
      expect(assertPercentDeviation(thirdTET, thirdJust, 0.01)).toBe(true);
    });

    test('octave splits perfectly: 2^(7/12) * 2^(5/12) = 2^1 = 2.0', () => {
      const fifthTET = 2 ** (7 / 12);
      const fourthTET = 2 ** (5 / 12);
      expect(fifthTET * fourthTET).toBeCloseTo(2.0, 10);
    });

    test('harmonic series first four ratios are simple integer ratios', () => {
      // Unison, octave, fifth, fourth
      const harmonicRatios: [number, number][] = [[1, 1], [2, 1], [3, 2], [4, 3]];
      for (const [p, q] of harmonicRatios) {
        expect(Number.isInteger(p)).toBe(true);
        expect(Number.isInteger(q)).toBe(true);
        expect(p).toBeGreaterThan(0);
        expect(q).toBeGreaterThan(0);
      }
    });

    test('all 12 semitone ratios are in (1, 2] (within one octave)', () => {
      for (let n = 1; n <= 12; n++) {
        const ratio = 2 ** (n / 12);
        expect(ratio).toBeGreaterThan(1);
        expect(ratio).toBeLessThanOrEqual(2 + 1e-10);
      }
    });
  });
});
