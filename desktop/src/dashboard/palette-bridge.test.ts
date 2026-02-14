import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  PaletteConfig,
  DEFAULT_PALETTE,
  paletteToCssVars,
  applyPalette,
  removePalette,
} from './palette-bridge.js';

describe('palette-bridge', () => {
  describe('DEFAULT_PALETTE', () => {
    it('has all required PaletteConfig fields', () => {
      const keys: (keyof PaletteConfig)[] = [
        'bg', 'surface', 'surfaceRaised', 'border', 'borderMuted',
        'text', 'textMuted', 'accent', 'green', 'yellow', 'red', 'purple',
      ];
      for (const key of keys) {
        expect(DEFAULT_PALETTE).toHaveProperty(key);
      }
    });

    it('has valid CSS color strings for all fields', () => {
      const hexPattern = /^#[0-9a-fA-F]{6}$/;
      for (const [key, value] of Object.entries(DEFAULT_PALETTE)) {
        expect(value, `${key} should be a hex color`).toMatch(hexPattern);
      }
    });

    it('matches src/dashboard/styles.ts dark theme values', () => {
      expect(DEFAULT_PALETTE.bg).toBe('#0d1117');
      expect(DEFAULT_PALETTE.surface).toBe('#161b22');
      expect(DEFAULT_PALETTE.surfaceRaised).toBe('#1c2128');
      expect(DEFAULT_PALETTE.border).toBe('#30363d');
      expect(DEFAULT_PALETTE.borderMuted).toBe('#21262d');
      expect(DEFAULT_PALETTE.text).toBe('#e6edf3');
      expect(DEFAULT_PALETTE.textMuted).toBe('#8b949e');
      expect(DEFAULT_PALETTE.accent).toBe('#58a6ff');
      expect(DEFAULT_PALETTE.green).toBe('#3fb950');
      expect(DEFAULT_PALETTE.yellow).toBe('#d29922');
      expect(DEFAULT_PALETTE.red).toBe('#f85149');
      expect(DEFAULT_PALETTE.purple).toBe('#bc8cff');
    });
  });

  describe('paletteToCssVars', () => {
    it('converts PaletteConfig to Record with correct CSS variable names', () => {
      const vars = paletteToCssVars(DEFAULT_PALETTE);
      expect(vars['--bg']).toBe(DEFAULT_PALETTE.bg);
      expect(vars['--surface']).toBe(DEFAULT_PALETTE.surface);
      expect(vars['--surface-raised']).toBe(DEFAULT_PALETTE.surfaceRaised);
      expect(vars['--border']).toBe(DEFAULT_PALETTE.border);
      expect(vars['--border-muted']).toBe(DEFAULT_PALETTE.borderMuted);
      expect(vars['--text']).toBe(DEFAULT_PALETTE.text);
      expect(vars['--text-muted']).toBe(DEFAULT_PALETTE.textMuted);
      expect(vars['--accent']).toBe(DEFAULT_PALETTE.accent);
      expect(vars['--green']).toBe(DEFAULT_PALETTE.green);
      expect(vars['--yellow']).toBe(DEFAULT_PALETTE.yellow);
      expect(vars['--red']).toBe(DEFAULT_PALETTE.red);
      expect(vars['--purple']).toBe(DEFAULT_PALETTE.purple);
    });

    it('maps green to --signal-success alias', () => {
      const vars = paletteToCssVars(DEFAULT_PALETTE);
      expect(vars['--signal-success']).toBe(DEFAULT_PALETTE.green);
    });

    it('maps yellow to --signal-warning alias', () => {
      const vars = paletteToCssVars(DEFAULT_PALETTE);
      expect(vars['--signal-warning']).toBe(DEFAULT_PALETTE.yellow);
    });

    it('maps red to --signal-error alias', () => {
      const vars = paletteToCssVars(DEFAULT_PALETTE);
      expect(vars['--signal-error']).toBe(DEFAULT_PALETTE.red);
    });

    it('includes domain color overrides', () => {
      const vars = paletteToCssVars(DEFAULT_PALETTE);
      expect(vars['--color-frontend']).toBe(DEFAULT_PALETTE.accent);
      expect(vars['--color-backend']).toBe(DEFAULT_PALETTE.green);
    });

    it('contains at least 15 CSS variable entries', () => {
      const vars = paletteToCssVars(DEFAULT_PALETTE);
      expect(Object.keys(vars).length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('applyPalette', () => {
    let root: HTMLElement;

    beforeEach(() => {
      root = document.createElement('div');
      document.body.appendChild(root);
    });

    afterEach(() => {
      root.remove();
    });

    it('sets CSS variables on document.documentElement', () => {
      applyPalette(DEFAULT_PALETTE);
      const style = document.documentElement.style;
      expect(style.getPropertyValue('--bg')).toBe(DEFAULT_PALETTE.bg);
      expect(style.getPropertyValue('--surface')).toBe(DEFAULT_PALETTE.surface);
      expect(style.getPropertyValue('--accent')).toBe(DEFAULT_PALETTE.accent);
      // Clean up
      removePalette();
    });

    it('targets custom root element when provided', () => {
      applyPalette(DEFAULT_PALETTE, root);
      expect(root.style.getPropertyValue('--bg')).toBe(DEFAULT_PALETTE.bg);
      expect(root.style.getPropertyValue('--text')).toBe(DEFAULT_PALETTE.text);
    });
  });

  describe('removePalette', () => {
    let root: HTMLElement;

    beforeEach(() => {
      root = document.createElement('div');
      document.body.appendChild(root);
    });

    afterEach(() => {
      root.remove();
    });

    it('removes previously applied CSS variables', () => {
      applyPalette(DEFAULT_PALETTE, root);
      expect(root.style.getPropertyValue('--bg')).toBe(DEFAULT_PALETTE.bg);

      removePalette(root);
      expect(root.style.getPropertyValue('--bg')).toBe('');
      expect(root.style.getPropertyValue('--surface')).toBe('');
      expect(root.style.getPropertyValue('--accent')).toBe('');
    });

    it('removes variables from document.documentElement by default', () => {
      applyPalette(DEFAULT_PALETTE);
      expect(document.documentElement.style.getPropertyValue('--bg')).toBe(DEFAULT_PALETTE.bg);

      removePalette();
      expect(document.documentElement.style.getPropertyValue('--bg')).toBe('');
    });
  });
});
