import { describe, it, expect } from 'vitest';
import { MusePlaneEngine } from './muse-plane-engine.js';
import type { MusePlanePosition, CartesianPosition } from './muse-plane-types.js';
import type { MuseId } from './muse-schema-validator.js';

const engine = new MusePlaneEngine();

// System muse positions (from YAML definitions)
const MUSE_POSITIONS: Map<MuseId, MusePlanePosition> = new Map([
  ['foxy', { angle: 1.2566, magnitude: 0.8 }],    // 72°
  ['lex', { angle: 0.0873, magnitude: 0.9 }],      // 5°
  ['hemlock', { angle: 0.0, magnitude: 0.95 }],     // 0°
  ['sam', { angle: 0.6981, magnitude: 0.6 }],       // 40°
  ['cedar', { angle: 0.0, magnitude: 0.0 }],        // origin
  ['willow', { angle: 0.7854, magnitude: 1.0 }],    // 45°
]);

describe('MusePlaneEngine', () => {
  describe('toCartesian/toPolar round-trip', () => {
    it('converts and round-trips within epsilon < 1e-10', () => {
      const original: MusePlanePosition = { angle: 1.2566, magnitude: 0.8 };
      const cartesian = engine.toCartesian(original);
      const roundTrip = engine.toPolar(cartesian);
      expect(Math.abs(roundTrip.angle - original.angle)).toBeLessThan(1e-10);
      expect(Math.abs(roundTrip.magnitude - original.magnitude)).toBeLessThan(1e-10);
    });
  });

  describe('activation score range', () => {
    it('produces scores in [0, 1] for all muses with various contexts', () => {
      const contexts: CartesianPosition[] = [
        { real: 0.5, imaginary: 0.5 },
        { real: -0.3, imaginary: 0.8 },
        { real: 0.9, imaginary: 0.1 },
        { real: 0.0, imaginary: 0.0 },
        { real: -0.5, imaginary: -0.5 },
      ];
      for (const [, pos] of MUSE_POSITIONS) {
        for (const ctx of contexts) {
          const score = engine.activationScore(pos, ctx);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        }
      }
    });
  });

  describe('Cedar always >= 0.5', () => {
    it('scores >= 0.5 for any context position', () => {
      const cedar = MUSE_POSITIONS.get('cedar')!;
      const contexts: CartesianPosition[] = [
        { real: 0.5, imaginary: 0.5 },
        { real: -0.3, imaginary: 0.8 },
        { real: 0.9, imaginary: 0.1 },
        { real: 0.0, imaginary: 0.0 },
        { real: -0.5, imaginary: -0.5 },
        { real: 1.0, imaginary: 0.0 },
      ];
      for (const ctx of contexts) {
        expect(engine.activationScore(cedar, ctx)).toBeGreaterThanOrEqual(0.5);
      }
    });
  });

  describe('direct invocation', () => {
    it('returns exactly 1.0 with directInvocation flag', () => {
      const foxy = MUSE_POSITIONS.get('foxy')!;
      const ctx: CartesianPosition = { real: 0.0, imaginary: 0.0 };
      expect(engine.activationScore(foxy, ctx, { directInvocation: true })).toBe(1.0);
    });
  });

  describe('findComplementary', () => {
    it('finds Lex as complementary to Foxy (angular distance > 60°)', () => {
      const foxy = MUSE_POSITIONS.get('foxy')!;
      const complementary = engine.findComplementary(foxy, 'foxy', MUSE_POSITIONS);
      const ids = complementary.map(c => c.museId);
      expect(ids).toContain('lex');
    });
  });

  describe('rankForContext', () => {
    it('returns muses sorted by score descending', () => {
      const ctx: CartesianPosition = { real: 0.5, imaginary: 0.5 };
      const ranked = engine.rankForContext(MUSE_POSITIONS, ctx);
      expect(ranked.length).toBe(6);
      for (let i = 1; i < ranked.length; i++) {
        expect(ranked[i - 1].score).toBeGreaterThanOrEqual(ranked[i].score);
      }
    });
  });
});
