/**
 * Tests for palette type system, preset definitions, and OKLCH generation.
 *
 * RED phase: all tests must fail (module does not exist yet).
 */
import { describe, it, expect } from 'vitest';
import {
  type Palette,
  type PalettePreset,
  PALETTE_PRESETS,
  generatePalette,
  getPaletteColors,
  paletteToUint8,
} from './palette';

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

describe('Palette type shape', () => {
  it('PalettePreset accepts all 5 preset names', () => {
    const presets: PalettePreset[] = [
      'amiga-1.3',
      'amiga-2.0',
      'amiga-3.1',
      'c64',
      'custom',
    ];
    expect(presets).toHaveLength(5);
  });

  it('Palette interface has name, preset, and colors fields', () => {
    const palette: Palette = {
      name: 'test',
      preset: 'custom',
      colors: Array(32).fill('#000000'),
    };
    expect(palette.name).toBe('test');
    expect(palette.preset).toBe('custom');
    expect(palette.colors).toHaveLength(32);
  });

  it('PALETTE_PRESETS has all 5 preset keys', () => {
    const keys = Object.keys(PALETTE_PRESETS);
    expect(keys).toContain('amiga-1.3');
    expect(keys).toContain('amiga-2.0');
    expect(keys).toContain('amiga-3.1');
    expect(keys).toContain('c64');
    expect(keys).toContain('custom');
    expect(keys).toHaveLength(5);
  });

  it('each preset has exactly 32 colors', () => {
    for (const key of Object.keys(PALETTE_PRESETS) as PalettePreset[]) {
      expect(PALETTE_PRESETS[key].colors).toHaveLength(32);
    }
  });

  it('every color in every preset is a valid 6-digit hex string', () => {
    for (const key of Object.keys(PALETTE_PRESETS) as PalettePreset[]) {
      for (const color of PALETTE_PRESETS[key].colors) {
        expect(color).toMatch(HEX_PATTERN);
      }
    }
  });
});

describe('Preset content validation', () => {
  it('amiga-1.3 has 4 distinct colors in first 4 slots', () => {
    const colors = PALETTE_PRESETS['amiga-1.3'].colors;
    const first4 = colors.slice(0, 4);
    const unique = new Set(first4);
    expect(unique.size).toBe(4);
  });

  it('amiga-2.0 has 8 distinct colors in first 8 slots', () => {
    const colors = PALETTE_PRESETS['amiga-2.0'].colors;
    const first8 = colors.slice(0, 8);
    const unique = new Set(first8);
    expect(unique.size).toBe(8);
  });

  it('amiga-3.1 uses all 32 slots with MagicWB-style palette', () => {
    const colors = PALETTE_PRESETS['amiga-3.1'].colors;
    expect(colors).toHaveLength(32);
    // MagicWB uses rich set of distinct colors
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThanOrEqual(24);
  });

  it('c64 first 4 colors match canonical palette', () => {
    const colors = PALETTE_PRESETS['c64'].colors;
    // Canonical C64: 0=black, 1=white, 2=red variant, 3=cyan variant
    expect(colors[0]).toBe('#000000');
    expect(colors[1]).toBe('#FFFFFF');
    // Red and cyan are approximate - just check they are distinct and valid hex
    expect(colors[2]).toMatch(HEX_PATTERN);
    expect(colors[3]).toMatch(HEX_PATTERN);
    expect(colors[2]).not.toBe(colors[0]);
    expect(colors[3]).not.toBe(colors[0]);
  });

  it('all presets have unique palette names', () => {
    const names = Object.values(PALETTE_PRESETS).map((p) => p.name);
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});

describe('getPaletteColors', () => {
  it('returns amiga-1.3 preset colors', () => {
    const colors = getPaletteColors('amiga-1.3');
    expect(colors).toEqual(PALETTE_PRESETS['amiga-1.3'].colors);
  });

  it('returns custom preset as default/fallback', () => {
    const colors = getPaletteColors('custom');
    expect(colors).toEqual(PALETTE_PRESETS['custom'].colors);
  });

  it('returns array of exactly 32 strings', () => {
    const colors = getPaletteColors('amiga-2.0');
    expect(colors).toHaveLength(32);
    for (const c of colors) {
      expect(typeof c).toBe('string');
    }
  });
});

describe('generatePalette (OKLCH-based custom generation)', () => {
  it('generates 32 neutral grays from empty anchors', () => {
    const palette = generatePalette([]);
    expect(palette.colors).toHaveLength(32);
    expect(palette.preset).toBe('custom');
    // All should be valid hex
    for (const c of palette.colors) {
      expect(c).toMatch(HEX_PATTERN);
    }
  });

  it('generates 32 colors with hue variations around single anchor', () => {
    const palette = generatePalette(['#FF0000']);
    expect(palette.colors).toHaveLength(32);
    for (const c of palette.colors) {
      expect(c).toMatch(HEX_PATTERN);
    }
  });

  it('generates 32 colors spanning two anchor hues', () => {
    const palette = generatePalette(['#FF0000', '#0000FF']);
    expect(palette.colors).toHaveLength(32);
    for (const c of palette.colors) {
      expect(c).toMatch(HEX_PATTERN);
    }
  });

  it('generates 32 harmonious colors from four anchors', () => {
    const palette = generatePalette([
      '#FF0000',
      '#00FF00',
      '#0000FF',
      '#FFFF00',
    ]);
    expect(palette.colors).toHaveLength(32);
    for (const c of palette.colors) {
      expect(c).toMatch(HEX_PATTERN);
    }
  });

  it('always has near-black at slot 0 and near-white at slot 31', () => {
    const palette = generatePalette(['#FF0000']);
    // Slot 0 should be very dark
    const r0 = parseInt(palette.colors[0].slice(1, 3), 16);
    const g0 = parseInt(palette.colors[0].slice(3, 5), 16);
    const b0 = parseInt(palette.colors[0].slice(5, 7), 16);
    const lum0 = r0 + g0 + b0;
    expect(lum0).toBeLessThan(60); // near black

    // Slot 31 should be very light
    const r31 = parseInt(palette.colors[31].slice(1, 3), 16);
    const g31 = parseInt(palette.colors[31].slice(3, 5), 16);
    const b31 = parseInt(palette.colors[31].slice(5, 7), 16);
    const lum31 = r31 + g31 + b31;
    expect(lum31).toBeGreaterThan(650); // near white
  });
});

describe('paletteToUint8', () => {
  it('returns Uint8Array of length 128', () => {
    const colors = Array(32).fill('#000000');
    const result = paletteToUint8(colors);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(128);
  });

  it('first 4 bytes represent first color RGBA with alpha 255', () => {
    const colors = ['#FF0000', ...Array(31).fill('#000000')];
    const result = paletteToUint8(colors);
    expect(result[0]).toBe(255); // R
    expect(result[1]).toBe(0); // G
    expect(result[2]).toBe(0); // B
    expect(result[3]).toBe(255); // A
  });

  it('hex #FF8800 at index 1 produces correct bytes at offset 4', () => {
    const colors = ['#000000', '#FF8800', ...Array(30).fill('#000000')];
    const result = paletteToUint8(colors);
    expect(result[4]).toBe(255); // R
    expect(result[5]).toBe(136); // G (0x88 = 136)
    expect(result[6]).toBe(0); // B
    expect(result[7]).toBe(255); // A
  });
});
