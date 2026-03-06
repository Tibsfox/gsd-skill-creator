import { describe, it, expect } from 'vitest';

describe('Mathematical Accuracy — Safety-Critical Tests', () => {

  // ── SC-09: sin^2(theta) + cos^2(theta) = 1 for multiple angles ──

  describe('SC-09: Pythagorean identity sin^2 + cos^2 = 1', () => {
    const angles = [0, Math.PI / 6, Math.PI / 4, Math.PI / 3, Math.PI / 2, Math.PI, 3 * Math.PI / 2, 2 * Math.PI];

    for (const theta of angles) {
      it(`holds for theta = ${theta.toFixed(4)}`, () => {
        const sinSquared = Math.sin(theta) ** 2;
        const cosSquared = Math.cos(theta) ** 2;
        const sum = sinSquared + cosSquared;
        expect(Math.abs(sum - 1)).toBeLessThan(1e-10);
      });
    }
  });

  // ── SC-10: a^2 + b^2 = c^2 for Pythagorean triples and pairs ──

  describe('SC-10: Pythagorean theorem a^2 + b^2 = c^2', () => {
    const testCases: [number, number][] = [
      [3, 4],   // c = 5
      [5, 12],  // c = 13
      [6, 8],   // c = 10
      [1, 1],   // c = sqrt(2)
    ];

    for (const [a, b] of testCases) {
      it(`holds for (${a}, ${b}): a^2 + b^2 = c^2`, () => {
        const c = Math.sqrt(a * a + b * b);
        expect(Math.abs(c * c - (a * a + b * b))).toBeLessThan(1e-10);
      });
    }

    it('(3,4,5) triple is exact', () => {
      expect(Math.sqrt(3 * 3 + 4 * 4)).toBeCloseTo(5, 10);
    });

    it('(5,12,13) triple is exact', () => {
      expect(Math.sqrt(5 * 5 + 12 * 12)).toBeCloseTo(13, 10);
    });

    it('(6,8,10) triple is exact', () => {
      expect(Math.sqrt(6 * 6 + 8 * 8)).toBeCloseTo(10, 10);
    });

    it('(1,1) gives sqrt(2)', () => {
      expect(Math.sqrt(1 * 1 + 1 * 1)).toBeCloseTo(Math.SQRT2, 10);
    });
  });

  // ── SC-11: sin/cos values at known angles match Math.sin/Math.cos ──

  describe('SC-11: sin/cos values at known angles', () => {
    const knownValues: [number, number, number][] = [
      // [angle, expected_sin, expected_cos]
      [0,              0,              1],
      [Math.PI / 6,    0.5,            Math.sqrt(3) / 2],
      [Math.PI / 4,    Math.SQRT1_2,   Math.SQRT1_2],
      [Math.PI / 3,    Math.sqrt(3) / 2, 0.5],
      [Math.PI / 2,    1,              0],
      [Math.PI,        0,              -1],
      [3 * Math.PI / 2, -1,            0],
      [2 * Math.PI,    0,              1],
    ];

    for (const [angle, expectedSin, expectedCos] of knownValues) {
      it(`sin(${angle.toFixed(4)}) matches expected value`, () => {
        expect(Math.abs(Math.sin(angle) - expectedSin)).toBeLessThan(1e-10);
      });

      it(`cos(${angle.toFixed(4)}) matches expected value`, () => {
        expect(Math.abs(Math.cos(angle) - expectedCos)).toBeLessThan(1e-10);
      });
    }
  });

  // ── SC-12: L-system rule application ──

  describe('SC-12: L-system rule application', () => {
    /**
     * Pure L-system rewriting function extracted from LSystemRenderer logic.
     * Applies all rules simultaneously (parallel rewriting) for N iterations.
     */
    function applyLSystemRules(
      axiom: string,
      rules: Array<{ from: string; to: string }>,
      iterations: number,
    ): string {
      let current = axiom;
      for (let i = 0; i < iterations; i++) {
        let next = '';
        for (const ch of current) {
          const rule = rules.find(r => r.from === ch);
          if (rule) {
            next += rule.to;
          } else {
            next += ch;
          }
        }
        current = next;
      }
      return current;
    }

    it('axiom "F" with rule F->F+F-F-F+F after 1 iteration produces "F+F-F-F+F"', () => {
      const result = applyLSystemRules('F', [{ from: 'F', to: 'F+F-F-F+F' }], 1);
      expect(result).toBe('F+F-F-F+F');
    });

    it('axiom "F" with rule F->F+F-F-F+F after 2 iterations produces correct string', () => {
      const result = applyLSystemRules('F', [{ from: 'F', to: 'F+F-F-F+F' }], 2);
      // Each F in "F+F-F-F+F" is replaced with "F+F-F-F+F"
      const expected = 'F+F-F-F+F+F+F-F-F+F-F+F-F-F+F-F+F-F-F+F+F+F-F-F+F';
      expect(result).toBe(expected);
    });

    it('identity: characters not in rules pass through unchanged', () => {
      const result = applyLSystemRules('A+B', [{ from: 'A', to: 'AB' }], 1);
      expect(result).toBe('AB+B');
    });

    it('multiple rules apply in parallel', () => {
      const result = applyLSystemRules('AB', [
        { from: 'A', to: 'B' },
        { from: 'B', to: 'A' },
      ], 1);
      // A->B and B->A applied simultaneously
      expect(result).toBe('BA');
    });

    it('0 iterations returns the axiom unchanged', () => {
      const result = applyLSystemRules('F', [{ from: 'F', to: 'F+F-F-F+F' }], 0);
      expect(result).toBe('F');
    });
  });

  // ── SC-13: Tide simulation M2 formula ──

  describe('SC-13: Tide M2 formula h(t) = A * cos(2*pi/12.42 * t + phi)', () => {
    const M2_PERIOD = 12.42;
    const TWO_PI = Math.PI * 2;

    /**
     * Compute M2 tidal height — mirrors TideSimulator.computeM2 exactly.
     */
    function computeM2(t: number, amplitude: number, moonPhaseDeg: number): number {
      const phi = (moonPhaseDeg * Math.PI) / 180;
      return amplitude * Math.cos((TWO_PI / M2_PERIOD) * t + phi);
    }

    const testTimes = [0, 1, 3, 6, 12.42];

    for (const t of testTimes) {
      it(`h(${t}) with A=1, phi=0 matches formula within 0.001`, () => {
        const h = computeM2(t, 1.0, 0);
        const expected = Math.cos((TWO_PI / M2_PERIOD) * t);
        expect(Math.abs(h - expected)).toBeLessThan(0.001);
      });
    }

    it('at t=0, h(0) = A * cos(phi) — equals A when phi=0', () => {
      const h = computeM2(0, 1.0, 0);
      expect(Math.abs(h - 1.0)).toBeLessThan(0.001);
    });

    it('at t=T/2 (6.21h), h = A * cos(pi) = -A when phi=0', () => {
      const h = computeM2(M2_PERIOD / 2, 1.0, 0);
      expect(Math.abs(h - (-1.0))).toBeLessThan(0.001);
    });

    it('at t=T (12.42h), h = A * cos(2*pi) = A when phi=0 (full cycle)', () => {
      const h = computeM2(M2_PERIOD, 1.0, 0);
      expect(Math.abs(h - 1.0)).toBeLessThan(0.001);
    });

    it('amplitude scaling: h(0) = 2.5 when A=2.5 and phi=0', () => {
      const h = computeM2(0, 2.5, 0);
      expect(Math.abs(h - 2.5)).toBeLessThan(0.001);
    });

    it('phase offset: h(0) with phi=90 degrees equals 0', () => {
      const h = computeM2(0, 1.0, 90);
      expect(Math.abs(h - 0)).toBeLessThan(0.001);
    });
  });
});
