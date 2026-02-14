/**
 * Tests for UserStyle types, Zod schema, YAML serialization, and localStorage persistence.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  UserStyleSchema,
  DEFAULT_USER_STYLE,
  serializeUserStyle,
  deserializeUserStyle,
  loadUserStyle,
  saveUserStyle,
} from './user-style.js';
import type { UserStyle } from './user-style.js';

describe('UserStyle', () => {
  describe('DEFAULT_USER_STYLE', () => {
    it('has 32 palette colors', () => {
      expect(DEFAULT_USER_STYLE.palette.colors).toHaveLength(32);
    });

    it('has crt.enabled true', () => {
      expect(DEFAULT_USER_STYLE.crt.enabled).toBe(true);
    });

    it('has mode dark', () => {
      expect(DEFAULT_USER_STYLE.mode).toBe('dark');
    });

    it('has calibrated false', () => {
      expect(DEFAULT_USER_STYLE.calibrated).toBe(false);
    });

    it('has boot.skip false and boot.background gradient', () => {
      expect(DEFAULT_USER_STYLE.boot.skip).toBe(false);
      expect(DEFAULT_USER_STYLE.boot.background).toBe('gradient');
    });

    it('has palette.preset amiga-3.1', () => {
      expect(DEFAULT_USER_STYLE.palette.preset).toBe('amiga-3.1');
    });

    it('has empty anchors array', () => {
      expect(DEFAULT_USER_STYLE.palette.anchors).toEqual([]);
    });
  });

  describe('UserStyleSchema', () => {
    it('parses empty object with full defaults', () => {
      const result = UserStyleSchema.parse({});
      expect(result.palette.colors).toHaveLength(32);
      expect(result.crt.enabled).toBe(true);
      expect(result.mode).toBe('dark');
      expect(result.boot.skip).toBe(false);
      expect(result.boot.background).toBe('gradient');
      expect(result.calibrated).toBe(false);
    });

    it('fills missing fields with defaults for partial input', () => {
      const result = UserStyleSchema.parse({ mode: 'light' });
      expect(result.mode).toBe('light');
      expect(result.palette.colors).toHaveLength(32);
      expect(result.crt.enabled).toBe(true);
      expect(result.calibrated).toBe(false);
    });

    it('preserves valid partial palette while defaulting rest', () => {
      const result = UserStyleSchema.parse({
        palette: { preset: 'c64' },
      });
      expect(result.palette.preset).toBe('c64');
      // Colors should still get default since not provided
      expect(result.palette.colors).toHaveLength(32);
    });

    it('rejects invalid palette.colors length and falls back to default', () => {
      // Invalid: only 3 colors instead of 32
      const result = UserStyleSchema.parse({
        palette: { colors: ['#FF0000', '#00FF00', '#0000FF'] },
      });
      // Should fall back to default 32 colors
      expect(result.palette.colors).toHaveLength(32);
    });
  });

  describe('serialization', () => {
    it('serializeUserStyle produces string with palette, crt, mode, boot sections', () => {
      const yaml = serializeUserStyle(DEFAULT_USER_STYLE);
      expect(yaml).toContain('palette:');
      expect(yaml).toContain('crt:');
      expect(yaml).toContain('mode:');
      expect(yaml).toContain('boot:');
    });

    it('roundtrips correctly through serialize/deserialize', () => {
      const original = DEFAULT_USER_STYLE;
      const yaml = serializeUserStyle(original);
      const restored = deserializeUserStyle(yaml);
      expect(restored).toEqual(original);
    });

    it('roundtrips custom values correctly', () => {
      const custom: UserStyle = {
        palette: {
          preset: 'c64',
          colors: DEFAULT_USER_STYLE.palette.colors,
          anchors: ['#FF0000', '#00FF00'],
        },
        crt: {
          enabled: false,
          scanlineIntensity: 0.3,
          barrelDistortion: 0.1,
          phosphorGlow: 0.2,
          chromaticAberration: 1.0,
          vignette: 0.8,
        },
        mode: 'light',
        boot: { skip: true, background: 'flat' },
        calibrated: true,
      };
      const yaml = serializeUserStyle(custom);
      const restored = deserializeUserStyle(yaml);
      expect(restored).toEqual(custom);
    });
  });

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('loadUserStyle returns DEFAULT_USER_STYLE when localStorage is empty', () => {
      const result = loadUserStyle();
      expect(result).toEqual(DEFAULT_USER_STYLE);
    });

    it('saveUserStyle then loadUserStyle roundtrips correctly', () => {
      const style: UserStyle = {
        ...DEFAULT_USER_STYLE,
        mode: 'light',
        calibrated: true,
      };
      saveUserStyle(style);
      const loaded = loadUserStyle();
      expect(loaded).toEqual(style);
    });

    it('loadUserStyle returns DEFAULT_USER_STYLE when localStorage contains garbage', () => {
      localStorage.setItem('gsd-os-user-style', 'not valid yaml at all {{{}}}');
      const result = loadUserStyle();
      expect(result).toEqual(DEFAULT_USER_STYLE);
    });
  });
});
