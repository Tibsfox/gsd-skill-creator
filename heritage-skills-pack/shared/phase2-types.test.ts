/**
 * Tests for Phase 2 type extensions in the Heritage Skills Educational Pack.
 *
 * Verifies:
 * 1. BadgePath enum completeness (9 paths)
 * 2. BadgeTier enum completeness (4 tiers in ascending mastery order)
 * 3. WatershedType enum completeness (3 values)
 * 4. TraditionV2 union includes SALISH_SEA
 * 5. Phase2RoomNumber extension (rooms 15-18)
 * 6. Phase 1 types remain unbroken
 * 7. HeritageBadge interface shape
 * 8. MarineSafetyDomain interface shape
 *
 * @module heritage-skills-pack/shared/phase2-types.test
 */

import { describe, it, expect } from 'vitest';
import {
  BadgePath,
  BadgeTier,
  WatershedType,
  SALISH_SEA_TRADITION,
  Phase2RoomNumber,
  HeritageBadge,
  MarineSafetyDomain,
} from './phase2-types.js';
import type { TraditionV2 } from './phase2-types.js';
import { Tradition, RoomNumber } from './types.js';

// ─── BadgePath Enum Completeness ──────────────────────────────────────────────

describe('BadgePath enum completeness', () => {
  it('has exactly 9 string values', () => {
    const stringValues = Object.values(BadgePath).filter((v) => typeof v === 'string');
    expect(stringValues).toHaveLength(9);
  });

  it('contains all required paths', () => {
    const values = Object.values(BadgePath);
    expect(values).toContain('shelter');
    expect(values).toContain('food');
    expect(values).toContain('fiber');
    expect(values).toContain('watercraft');
    expect(values).toContain('plant');
    expect(values).toContain('tool');
    expect(values).toContain('music');
    expect(values).toContain('neighbors');
    expect(values).toContain('heritage');
  });

  it('NEIGHBORS has value neighbors', () => {
    expect(BadgePath.NEIGHBORS).toBe('neighbors');
  });
});

// ─── BadgeTier Enum Completeness ──────────────────────────────────────────────

describe('BadgeTier enum completeness', () => {
  it('has exactly 4 string values', () => {
    const stringValues = Object.values(BadgeTier).filter((v) => typeof v === 'string');
    expect(stringValues).toHaveLength(4);
  });

  it('tiers are in ascending mastery order', () => {
    const values = Object.values(BadgeTier).filter((v) => typeof v === 'string');
    expect(values).toEqual(['explorer', 'apprentice', 'journeyman', 'keeper']);
  });
});

// ─── WatershedType Enum Completeness ─────────────────────────────────────────

describe('WatershedType enum completeness', () => {
  it('has exactly 3 string values', () => {
    const stringValues = Object.values(WatershedType).filter((v) => typeof v === 'string');
    expect(stringValues).toHaveLength(3);
  });

  it('contains saltwater, river-mountain, unknown', () => {
    const values = Object.values(WatershedType);
    expect(values).toContain('saltwater');
    expect(values).toContain('river-mountain');
    expect(values).toContain('unknown');
  });
});

// ─── TraditionV2 Union Includes SALISH_SEA ────────────────────────────────────

describe('TraditionV2 union includes SALISH_SEA', () => {
  it('SALISH_SEA_TRADITION constant equals salish-sea', () => {
    expect(SALISH_SEA_TRADITION).toBe('salish-sea');
  });

  it('SALISH_SEA_TRADITION is assignable to TraditionV2', () => {
    // Type-level test: if this compiles, the union is correct.
    const t: TraditionV2 = SALISH_SEA_TRADITION;
    expect(t).toBe('salish-sea');
  });
});

// ─── Phase2RoomNumber Extension ───────────────────────────────────────────────

describe('Phase2RoomNumber extension', () => {
  it('defines rooms 15-18', () => {
    expect(Phase2RoomNumber.CEDAR_CULTURE).toBe(15);
    expect(Phase2RoomNumber.SALMON_WORLD).toBe(16);
    expect(Phase2RoomNumber.SALISH_WEAVING).toBe(17);
    expect(Phase2RoomNumber.VILLAGE_WORLD).toBe(18);
  });

  it('has exactly 4 entries', () => {
    expect(Object.keys(Phase2RoomNumber)).toHaveLength(4);
  });
});

// ─── Phase 1 Types Remain Unbroken ────────────────────────────────────────────

describe('Phase 1 types remain unbroken', () => {
  it('Tradition enum still has exactly 4 values', () => {
    const stringValues = Object.values(Tradition).filter((v) => typeof v === 'string');
    expect(stringValues).toHaveLength(4);
  });

  it('RoomNumber enum still has exactly 14 numeric values', () => {
    const numericValues = Object.values(RoomNumber).filter((v) => typeof v === 'number');
    expect(numericValues).toHaveLength(14);
  });

  it('Tradition does not contain salish-sea', () => {
    const values = Object.values(Tradition);
    expect(values).not.toContain('salish-sea');
  });
});

// ─── HeritageBadge Interface Shape ───────────────────────────────────────────

describe('HeritageBadge interface shape', () => {
  it('constructs a valid HeritageBadge object', () => {
    const badge: HeritageBadge = {
      id: 'test-badge-01',
      path: BadgePath.SHELTER,
      title: 'First Shelter',
      icon: 'shelter-explorer',
      traditions: [Tradition.FIRST_NATIONS],
      tier: BadgeTier.EXPLORER,
      prerequisites: [],
      roomId: RoomNumber.BUILDING,
      components: [],
    };
    expect(badge.id).toBe('test-badge-01');
    expect(badge.neighborsThread).toBeUndefined();
  });
});

// ─── MarineSafetyDomain Interface Shape ──────────────────────────────────────

describe('MarineSafetyDomain interface shape', () => {
  it('constructs an empty MarineSafetyDomain', () => {
    const domain: MarineSafetyDomain = {
      coldWater: [],
      tidal: [],
      vessel: [],
      navigation: [],
    };
    expect(domain.coldWater).toHaveLength(0);
  });
});
