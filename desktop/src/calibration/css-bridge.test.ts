/**
 * Tests for CSS custom property bridge from UserStyle to DOM.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { applyUserStyleCSS, removeUserStyleCSS } from './css-bridge.js';
import { DEFAULT_USER_STYLE } from './user-style.js';
import type { UserStyle } from './user-style.js';

/** Helper: read a CSS custom property from documentElement. */
function getCSSVar(name: string): string {
  return document.documentElement.style.getPropertyValue(name);
}

describe('CSS Bridge', () => {
  beforeEach(() => {
    // Clean slate: remove all inline styles
    document.documentElement.removeAttribute('style');
  });

  describe('applyUserStyleCSS', () => {
    it('sets --palette-0 through --palette-31 on documentElement', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      for (let i = 0; i < 32; i++) {
        expect(getCSSVar(`--palette-${i}`)).toBe(DEFAULT_USER_STYLE.palette.colors[i]);
      }
    });

    it('sets --bg-primary to palette[0] in dark mode', () => {
      const style: UserStyle = { ...DEFAULT_USER_STYLE, mode: 'dark' };
      applyUserStyleCSS(style);
      expect(getCSSVar('--bg-primary')).toBe(style.palette.colors[0]);
    });

    it('sets --bg-primary to palette[31] in light mode', () => {
      const style: UserStyle = { ...DEFAULT_USER_STYLE, mode: 'light' };
      applyUserStyleCSS(style);
      expect(getCSSVar('--bg-primary')).toBe(style.palette.colors[31]);
    });

    it('sets --fg-primary to palette[31] in dark mode', () => {
      const style: UserStyle = { ...DEFAULT_USER_STYLE, mode: 'dark' };
      applyUserStyleCSS(style);
      expect(getCSSVar('--fg-primary')).toBe(style.palette.colors[31]);
    });

    it('sets --fg-primary to palette[0] in light mode', () => {
      const style: UserStyle = { ...DEFAULT_USER_STYLE, mode: 'light' };
      applyUserStyleCSS(style);
      expect(getCSSVar('--fg-primary')).toBe(style.palette.colors[0]);
    });

    it('sets --accent-primary to palette[3]', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      expect(getCSSVar('--accent-primary')).toBe(DEFAULT_USER_STYLE.palette.colors[3]);
    });

    it('sets --accent-secondary to palette[7]', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      expect(getCSSVar('--accent-secondary')).toBe(DEFAULT_USER_STYLE.palette.colors[7]);
    });

    it('sets --crt-scanline-intensity to CRT value', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      expect(getCSSVar('--crt-scanline-intensity')).toBe(
        String(DEFAULT_USER_STYLE.crt.scanlineIntensity),
      );
    });

    it('sets --crt-phosphor-glow to CRT value', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      expect(getCSSVar('--crt-phosphor-glow')).toBe(
        String(DEFAULT_USER_STYLE.crt.phosphorGlow),
      );
    });

    it('sets --mode to dark or light', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      expect(getCSSVar('--mode')).toBe('dark');

      const light: UserStyle = { ...DEFAULT_USER_STYLE, mode: 'light' };
      applyUserStyleCSS(light);
      expect(getCSSVar('--mode')).toBe('light');
    });

    it('is idempotent -- calling twice updates values', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      expect(getCSSVar('--mode')).toBe('dark');

      const updated: UserStyle = { ...DEFAULT_USER_STYLE, mode: 'light' };
      applyUserStyleCSS(updated);
      expect(getCSSVar('--mode')).toBe('light');
    });
  });

  describe('removeUserStyleCSS', () => {
    it('clears all custom properties', () => {
      applyUserStyleCSS(DEFAULT_USER_STYLE);
      // Verify at least one property is set
      expect(getCSSVar('--palette-0')).not.toBe('');

      removeUserStyleCSS();

      // All palette vars cleared
      for (let i = 0; i < 32; i++) {
        expect(getCSSVar(`--palette-${i}`)).toBe('');
      }
      // Semantic vars cleared
      expect(getCSSVar('--bg-primary')).toBe('');
      expect(getCSSVar('--fg-primary')).toBe('');
      expect(getCSSVar('--accent-primary')).toBe('');
      expect(getCSSVar('--crt-scanline-intensity')).toBe('');
      expect(getCSSVar('--mode')).toBe('');
    });
  });
});
