/**
 * CRAFT-role × tier mapper tests (Phase 767).
 *
 * @module activation-steering/__tests__/craft-role-mapper
 */

import { describe, expect, it } from 'vitest';
import {
  buildTarget,
  enumerateAllTargets,
} from '../craft-role-mapper.js';
import { CRAFT_ROLES, MODEL_TIERS } from '../types.js';

describe('buildTarget', () => {
  it('produces a target with the requested dimensionality', () => {
    const t = buildTarget('Architect', 'Sonnet', 16);
    expect(t.vector.length).toBe(16);
    expect(t.role).toBe('Architect');
    expect(t.tier).toBe('Sonnet');
    expect(t.label).toBe('architect@sonnet');
  });

  it('vector values are bounded in [-1, 1]', () => {
    const t = buildTarget('Forger', 'Haiku', 32);
    for (const v of t.vector) {
      expect(v).toBeGreaterThanOrEqual(-1);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic — same inputs produce the same vector', () => {
    const a = buildTarget('Researcher', 'Opus', 8);
    const b = buildTarget('Researcher', 'Opus', 8);
    expect(a.vector).toEqual(b.vector);
  });

  it('throws on non-positive dim', () => {
    expect(() => buildTarget('Coordinator', 'Opus', 0)).toThrow();
    expect(() => buildTarget('Coordinator', 'Opus', -1)).toThrow();
    expect(() => buildTarget('Coordinator', 'Opus', 1.5)).toThrow();
  });

  it('Haiku targets have larger amplitude than Opus targets (per spec)', () => {
    // Tier amplitude: Opus=0.6, Sonnet=0.8, Haiku=1.0
    // The spike value is amp * 1.0; check it's strictly larger for Haiku.
    const opus = buildTarget('Coordinator', 'Opus', 8);
    const haiku = buildTarget('Coordinator', 'Haiku', 8);
    // Coordinator offset = 0, so v[0] = amp * 1.0 (the spike).
    expect(haiku.vector[0]!).toBeGreaterThan(opus.vector[0]!);
  });
});

describe('enumerateAllTargets', () => {
  it('covers all 5 × 3 = 15 (role, tier) combinations', () => {
    const targets = enumerateAllTargets(8);
    expect(targets.length).toBe(15);
    const seen = new Set<string>();
    for (const t of targets) {
      seen.add(`${t.role}|${t.tier}`);
    }
    expect(seen.size).toBe(15);
    for (const role of CRAFT_ROLES) {
      for (const tier of MODEL_TIERS) {
        expect(seen.has(`${role}|${tier}`)).toBe(true);
      }
    }
  });

  it('every enumerated target has a non-empty label', () => {
    const targets = enumerateAllTargets(4);
    for (const t of targets) {
      expect(t.label && t.label.length).toBeGreaterThan(0);
    }
  });

  it('different roles produce different vectors at fixed tier', () => {
    const a = buildTarget('Coordinator', 'Sonnet', 16);
    const b = buildTarget('Forger', 'Sonnet', 16);
    expect(a.vector).not.toEqual(b.vector);
  });
});
