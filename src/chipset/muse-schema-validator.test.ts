/**
 * Muse schema validation tests (TDD RED phase).
 *
 * Tests for validateMuseChipset, isMuseChipset, and getMuseOrientation.
 * Covers backward compat, valid muse validation, constraint rejection,
 * discriminator logic, and PlanePosition conversion.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { load } from 'js-yaml';
import { describe, it, expect } from 'vitest';
import {
  validateMuseChipset,
  isMuseChipset,
  getMuseOrientation,
} from '../chipset/muse-schema-validator.js';

// Resolve path relative to project root
const CHIPSET_YAML = resolve(__dirname, '../../data/chipset/chipset.yaml');

const VALID_MUSE = {
  name: 'test-muse',
  version: '1.0.0',
  museType: 'system' as const,
  orientation: { angle: 1.2566, magnitude: 0.8 },
  voice: { tone: 'warm', style: 'narrative' as const },
};

describe('muse schema validation', () => {
  it('backward compat: existing chipset.yaml passes isMuseChipset check without errors', () => {
    const raw = readFileSync(CHIPSET_YAML, 'utf-8');
    const chipset = load(raw) as Record<string, unknown>;
    // Standard chipset has no museType — must return false without throwing
    expect(() => isMuseChipset(chipset)).not.toThrow();
    expect(isMuseChipset(chipset)).toBe(false);
  });

  it('valid muse: validateMuseChipset returns valid for well-formed muse object', () => {
    const result = validateMuseChipset(VALID_MUSE);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects magnitude > 1.0', () => {
    const invalid = {
      ...VALID_MUSE,
      orientation: { angle: 1.0, magnitude: 1.5 },
    };
    const result = validateMuseChipset(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects angle > 2π', () => {
    const invalid = {
      ...VALID_MUSE,
      orientation: { angle: 7.0, magnitude: 0.5 },
    };
    const result = validateMuseChipset(invalid);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('isMuseChipset: returns true for object with museType, false for standard chipset', () => {
    expect(isMuseChipset(VALID_MUSE)).toBe(true);
    expect(isMuseChipset({ name: 'standard', version: '1.0.0' })).toBe(false);
  });

  it('getMuseOrientation: converts angle=1.2566,magnitude=0.8 to correct PlanePosition', () => {
    const pos = getMuseOrientation(VALID_MUSE);
    expect(pos).not.toBeNull();
    // cos(72°) * 0.8 ≈ 0.2472, sin(72°) * 0.8 ≈ 0.7608
    expect(pos!.real).toBeCloseTo(0.2472, 3);
    expect(pos!.imaginary).toBeCloseTo(0.7608, 3);
  });
});
