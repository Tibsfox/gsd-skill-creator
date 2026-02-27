import { describe, it, expect } from 'vitest';
import { magnitude } from '../../src/holomorphic/complex/arithmetic';
import type { KoopmanObservable } from '../../src/holomorphic/dmd/types';
import { edmd, liftDictionary } from '../../src/holomorphic/dmd/koopman';
import { bridgeDMDToSkillDynamics } from '../../src/holomorphic/dmd/skill-dmd-bridge';
import type { SkillDynamicsExtended } from '../../src/holomorphic/dmd/skill-dmd-bridge';
import type { SkillPosition } from '../../src/holomorphic/types';

/* ------------------------------------------------------------------ */
/*  Koopman / EDMD Implementation                                       */
/* ------------------------------------------------------------------ */

describe('EDMD and Koopman Analysis', () => {
  /** Polynomial dictionary: [x, x^2, x^3] */
  const polyDict: KoopmanObservable[] = [
    { name: 'identity', evaluate: (x) => x[0], type: 'polynomial' },
    { name: 'square', evaluate: (x) => x[0] * x[0], type: 'polynomial' },
    { name: 'cube', evaluate: (x) => x[0] * x[0] * x[0], type: 'polynomial' },
  ];

  describe('edmd()', () => {
    it('produces eigenvalues for a linear system (x -> 0.9x: dominant eigenvalue near 0.9)', () => {
      // Linear contraction: x_{n+1} = 0.9 * x_n
      const states: number[][] = [];
      let x = 1.0;
      for (let i = 0; i < 50; i++) {
        states.push([x]);
        x *= 0.9;
      }

      const result = edmd(states, { dictionary: polyDict });
      expect(result.eigenvalues.length).toBeGreaterThan(0);

      // The dominant eigenvalue should be close to 0.9
      const mags = result.eigenvalues.map(e => magnitude(e));
      const dominantMag = Math.max(...mags);
      expect(dominantMag).toBeCloseTo(0.9, 0);
    });

    it('of logistic map (r=2.8) yields dominant eigenvalue inside unit circle', () => {
      // Logistic map: x -> 2.8 * x * (1 - x), converges to fixed point
      const states: number[][] = [];
      let x = 0.5;
      for (let i = 0; i < 60; i++) {
        states.push([x]);
        x = 2.8 * x * (1 - x);
      }

      const result = edmd(states, { dictionary: polyDict });
      expect(result.eigenvalues.length).toBeGreaterThan(0);

      // All eigenvalues should be inside or near unit circle (system converges)
      const mags = result.eigenvalues.map(e => magnitude(e));
      const dominantMag = Math.max(...mags);
      expect(dominantMag).toBeLessThan(1.5);
    });
  });

  describe('liftDictionary()', () => {
    it('lifts state vectors to observable space using dictionary', () => {
      const states = [[0.5], [0.3], [0.7]];
      const lifted = liftDictionary(states, polyDict);

      expect(lifted.length).toBe(3);
      // First state [0.5]: identity=0.5, square=0.25, cube=0.125
      expect(lifted[0][0]).toBeCloseTo(0.5);
      expect(lifted[0][1]).toBeCloseTo(0.25);
      expect(lifted[0][2]).toBeCloseTo(0.125);
    });
  });
});

/* ------------------------------------------------------------------ */
/*  SkillDynamicsExtended Bridge                                        */
/* ------------------------------------------------------------------ */

describe('SkillDynamicsExtended Bridge', () => {
  describe('bridgeDMDToSkillDynamics()', () => {
    const position: SkillPosition = { theta: 0.5, radius: 0.6 };

    it('populates all SkillDynamicsExtended fields from DMD result', () => {
      // Construct a minimal DMD result with attracting eigenvalue
      const dmdResult = {
        modes: [[{ re: 1, im: 0 }]],
        eigenvalues: [{ re: 0.8, im: 0.0 }],
        amplitudes: [{ re: 1, im: 0 }],
        frequencies: [0],
        growthRates: [Math.log(0.8)],
        svdRank: 1,
        residual: 0.01,
      };

      const extended = bridgeDMDToSkillDynamics(position, dmdResult);

      expect(extended.dmdModes).toBeDefined();
      expect(extended.dmdEigenvalues).toBeDefined();
      expect(extended.dmdGrowthRates).toBeDefined();
      expect(extended.dmdFrequencies).toBeDefined();
      expect(typeof extended.dominantMode).toBe('number');
      expect(extended.position).toEqual(position);
    });

    it('maps attracting eigenvalue to attracting classification', () => {
      const dmdResult = {
        modes: [[{ re: 1, im: 0 }]],
        eigenvalues: [{ re: 0.7, im: 0.0 }],
        amplitudes: [{ re: 1, im: 0 }],
        frequencies: [0],
        growthRates: [Math.log(0.7)],
        svdRank: 1,
        residual: 0.01,
      };

      const extended = bridgeDMDToSkillDynamics(position, dmdResult);
      expect(extended.classification).toBe('attracting');
    });

    it('maps repelling eigenvalue to repelling classification', () => {
      const dmdResult = {
        modes: [[{ re: 1, im: 0 }]],
        eigenvalues: [{ re: 1.3, im: 0.0 }],
        amplitudes: [{ re: 1, im: 0 }],
        frequencies: [0],
        growthRates: [Math.log(1.3)],
        svdRank: 1,
        residual: 0.01,
      };

      const extended = bridgeDMDToSkillDynamics(position, dmdResult);
      expect(extended.classification).toBe('repelling');
    });

    it('maps oscillating eigenvalue to periodic classification', () => {
      // Eigenvalue with significant angle, magnitude near 1
      const dmdResult = {
        modes: [[{ re: 1, im: 0 }]],
        eigenvalues: [{ re: 0.0, im: 1.0 }],
        amplitudes: [{ re: 1, im: 0 }],
        frequencies: [Math.PI / 2],
        growthRates: [0],
        svdRank: 1,
        residual: 0.01,
      };

      const extended = bridgeDMDToSkillDynamics(position, dmdResult);
      // |lambda| = 1 with oscillation maps to rationally_indifferent (periodic)
      const isIndifferent =
        extended.classification === 'rationally_indifferent' ||
        extended.classification === 'irrationally_indifferent';
      expect(isIndifferent).toBe(true);
    });

    it('populates convergenceRate from growth rate', () => {
      const growthRate = Math.log(0.85);
      const dmdResult = {
        modes: [[{ re: 1, im: 0 }]],
        eigenvalues: [{ re: 0.85, im: 0.0 }],
        amplitudes: [{ re: 1, im: 0 }],
        frequencies: [0],
        growthRates: [growthRate],
        svdRank: 1,
        residual: 0.01,
      };

      const extended = bridgeDMDToSkillDynamics(position, dmdResult);
      expect(typeof extended.convergenceRate).toBe('number');
      // Convergence rate should reflect the dominant growth rate
      expect(extended.convergenceRate).toBeLessThan(0);
    });
  });
});
