import { describe, it, expect } from 'vitest';
import { validateMuseChipset, isMuseChipset, getMuseOrientation } from './muse-schema-validator.js';

const validMuseConfig = {
  name: 'test-muse',
  version: '1.0.0',
  museType: 'system',
  orientation: { angle: 1.2566, magnitude: 0.8 },
  vocabulary: ['test', 'example'],
  voice: { tone: 'warm-creative', style: 'narrative', signature: 'test sig' },
  activationPatterns: ['test|example'],
};

const standardChipsetConfig = {
  name: 'standard-chipset',
  version: '1.0.0',
  skills: [],
  agents: [],
};

describe('muse-schema-validator', () => {
  describe('validateMuseChipset', () => {
    it('returns valid for well-formed muse config', () => {
      const result = validateMuseChipset(validMuseConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects orientation.magnitude > 1.0', () => {
      const config = { ...validMuseConfig, orientation: { angle: 1.0, magnitude: 1.5 } };
      const result = validateMuseChipset(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects orientation.angle > 2pi', () => {
      const config = { ...validMuseConfig, orientation: { angle: 7.0, magnitude: 0.5 } };
      const result = validateMuseChipset(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects missing voice.tone', () => {
      const config = { ...validMuseConfig, voice: { style: 'narrative' } };
      const result = validateMuseChipset(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('isMuseChipset', () => {
    it('returns true when museType field is set to system', () => {
      expect(isMuseChipset(validMuseConfig)).toBe(true);
    });

    it('returns false for standard chipset without museType', () => {
      expect(isMuseChipset(standardChipsetConfig)).toBe(false);
    });
  });

  describe('getMuseOrientation', () => {
    it('converts polar to Cartesian PlanePosition', () => {
      const pos = getMuseOrientation(validMuseConfig);
      expect(pos).not.toBeNull();
      // angle=1.2566 (72°), magnitude=0.8
      // real = 0.8 * cos(1.2566) ≈ 0.2472
      // imaginary = 0.8 * sin(1.2566) ≈ 0.7608
      expect(pos!.real).toBeCloseTo(0.2472, 3);
      expect(pos!.imaginary).toBeCloseTo(0.7608, 3);
    });

    it('returns null for non-muse chipset', () => {
      expect(getMuseOrientation(standardChipsetConfig)).toBeNull();
    });
  });
});
