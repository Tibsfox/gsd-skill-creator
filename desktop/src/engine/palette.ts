/**
 * Palette type system, preset definitions, and OKLCH-based custom generation.
 *
 * Provides a 32-color palette data model with 5 retro-computing presets
 * (Amiga 1.3/2.0/3.1, C64, custom) and OKLCH color space generation
 * via culori. Pure TypeScript -- no WebGL dependencies.
 */
import { parse, converter, formatHex } from 'culori';

const toOklch = converter('oklch');
const toRgb = converter('rgb');

/** Supported palette preset identifiers. */
export type PalettePreset =
  | 'amiga-1.3'
  | 'amiga-2.0'
  | 'amiga-3.1'
  | 'c64'
  | 'custom';

/** A 32-color palette with metadata. */
export interface Palette {
  /** Human-readable palette name. */
  name: string;
  /** Preset identifier. */
  preset: PalettePreset;
  /** Exactly 32 hex color strings in '#RRGGBB' format. */
  colors: string[];
}

/**
 * Amiga Workbench 1.3 palette.
 * 4 core colors (blue/white/black/orange) extended to 32
 * with derived shades and complements.
 */
const AMIGA_13: Palette = {
  name: 'Amiga Workbench 1.3',
  preset: 'amiga-1.3',
  colors: [
    '#0055AA', '#FFFFFF', '#000000', '#FF8800', // Core 4
    '#003366', '#0077CC', '#3399DD', '#66BBEE', // Blue shades
    '#CCCCCC', '#AAAAAA', '#888888', '#666666', // Grays
    '#FF6600', '#CC5500', '#AA4400', '#883300', // Orange shades
    '#005588', '#006699', '#0088BB', '#00AADD', // Teal blues
    '#FFAA33', '#FFBB55', '#FFCC77', '#FFDD99', // Warm oranges
    '#224466', '#334477', '#445588', '#556699', // Dark blues
    '#FFEECC', '#FFEEBB', '#FFDDAA', '#222222', // Warm lights + near-black
  ],
};

/**
 * Amiga Workbench 2.0 palette.
 * Gray-based with colored accents, 8 core colors extended to 32.
 */
const AMIGA_20: Palette = {
  name: 'Amiga Workbench 2.0',
  preset: 'amiga-2.0',
  colors: [
    '#AAAAAA', '#000000', '#FFFFFF', '#6688BB', // Core 4
    '#0044AA', '#EE8800', '#008800', '#DD0000', // Accent 4
    '#999999', '#888888', '#777777', '#666666', // Mid grays
    '#555555', '#444444', '#333333', '#222222', // Dark grays
    '#BBBBBB', '#CCCCCC', '#DDDDDD', '#EEEEEE', // Light grays
    '#4466AA', '#5577BB', '#7799CC', '#88AADD', // Blue tints
    '#CC7700', '#DD8800', '#EE9900', '#FFAA11', // Orange tints
    '#006600', '#117711', '#228822', '#339933', // Green tints
  ],
};

/**
 * Amiga Workbench 3.1 MagicWB-style palette.
 * Full 32-color palette with UI chrome grays, accent colors,
 * and graduated shades for a rich desktop experience.
 */
const AMIGA_31: Palette = {
  name: 'Amiga Workbench 3.1 (MagicWB)',
  preset: 'amiga-3.1',
  colors: [
    '#959595', '#000000', '#FFFFFF', '#3B67A2', // UI base
    '#7B7B7B', '#AFAFAF', '#AA907C', '#FFA997', // Chrome + warm
    '#486888', '#5A7898', '#6C88A8', '#7E98B8', // Steel blues
    '#4A8C4A', '#5A9C5A', '#6AAC6A', '#7ABC7A', // Greens
    '#C87848', '#D88858', '#E89868', '#F8A878', // Coppers
    '#884488', '#985898', '#A868A8', '#B878B8', // Purples
    '#CC4444', '#DC5454', '#EC6464', '#FC7474', // Reds
    '#CCAA44', '#DCBA54', '#ECCC66', '#222222', // Golds + dark
  ],
};

/**
 * Commodore 64 palette.
 * First 16 slots are the canonical C64 palette.
 * Remaining 16 are darker/lighter variations.
 */
const C64: Palette = {
  name: 'Commodore 64',
  preset: 'c64',
  colors: [
    // Canonical 16
    '#000000', '#FFFFFF', '#880000', '#AAFFEE', // Black, White, Red, Cyan
    '#CC44CC', '#00CC55', '#0000AA', '#EEEE77', // Purple, Green, Blue, Yellow
    '#DD8855', '#664400', '#FF7777', '#333333', // Orange, Brown, LightRed, DarkGray
    '#777777', '#AAFF66', '#0088FF', '#BBBBBB', // MedGray, LightGreen, LightBlue, LightGray
    // 16 variations
    '#111111', '#DDDDDD', '#660000', '#88DDCC', // Darker/lighter variants
    '#AA33AA', '#00AA44', '#000088', '#CCCC55',
    '#BB6633', '#442200', '#DD5555', '#222222',
    '#555555', '#88DD44', '#0066DD', '#999999',
  ],
};

/**
 * Default custom palette.
 * Balanced neutral-to-warm tones as starting point for user customization.
 */
const CUSTOM: Palette = {
  name: 'Custom Default',
  preset: 'custom',
  colors: [
    '#1A1A2E', '#16213E', '#0F3460', '#E94560', // Dark bases + accent
    '#533483', '#2C3333', '#395B64', '#A5C9CA',
    '#E7F6F2', '#FFDDD2', '#FFB4A2', '#E5989B',
    '#B5838D', '#6D6875', '#3C3744', '#2B2D42',
    '#8D99AE', '#EDF2F4', '#EF233C', '#D90429',
    '#F8F9FA', '#DEE2E6', '#ADB5BD', '#6C757D',
    '#495057', '#343A40', '#212529', '#FFC300',
    '#DAA520', '#CD853F', '#D2691E', '#F5F5DC',
  ],
};

/** All 5 palette presets indexed by preset identifier. */
export const PALETTE_PRESETS: Record<PalettePreset, Palette> = {
  'amiga-1.3': AMIGA_13,
  'amiga-2.0': AMIGA_20,
  'amiga-3.1': AMIGA_31,
  'c64': C64,
  'custom': CUSTOM,
};

/**
 * Get the color array for a named preset.
 * @param preset - Preset identifier
 * @returns Array of 32 hex color strings
 */
export function getPaletteColors(preset: PalettePreset): string[] {
  return PALETTE_PRESETS[preset].colors;
}

/**
 * Normalize a hex string to uppercase '#RRGGBB' format.
 */
function normalizeHex(hex: string): string {
  return hex.toUpperCase();
}

/**
 * Generate a harmonious 32-color palette from anchor colors using OKLCH.
 *
 * @param anchors - 0-4 hex color strings to base the palette on
 * @returns Palette with preset 'custom' and 32 generated colors
 *
 * Strategy:
 * - 0 anchors: neutral grays spanning lightness 0.05-0.95
 * - 1+ anchors: distribute hues around OKLCH wheel, generate
 *   lightness/chroma variations for each hue
 * - Slot 0 always near-black, slot 31 always near-white
 * - Colors sorted by hue then lightness for visual coherence
 */
export function generatePalette(anchors: string[]): Palette {
  const colors: string[] = [];

  if (anchors.length === 0) {
    // Generate 32 neutral grays
    for (let i = 0; i < 32; i++) {
      const lightness = 0.05 + (i / 31) * 0.9; // 0.05 to 0.95
      const rgb = toRgb({ mode: 'oklch', l: lightness, c: 0, h: 0 });
      colors.push(normalizeHex(formatHex(rgb)));
    }
  } else {
    // Convert anchors to OKLCH
    const oklchAnchors = anchors.map((hex) => {
      const parsed = parse(hex);
      return toOklch(parsed!);
    });

    // Collect generated colors (excluding slots 0 and 31)
    const generated: Array<{ l: number; c: number; h: number }> = [];

    for (const anchor of oklchAnchors) {
      const baseHue = anchor.h ?? 0;
      const baseChroma = anchor.c ?? 0.15;
      const colorsPerAnchor = Math.floor(30 / anchors.length);

      for (let i = 0; i < colorsPerAnchor; i++) {
        // Vary lightness from 0.15 to 0.85
        const lightness = 0.15 + (i / (colorsPerAnchor - 1)) * 0.7;
        // Vary hue slightly around the anchor
        const hueOffset = ((i % 5) - 2) * 8;
        const hue = (baseHue + hueOffset + 360) % 360;
        // Vary chroma
        const chromaFactor = 0.5 + (i % 3) * 0.25;
        const chroma = Math.min(baseChroma * chromaFactor, 0.35);

        generated.push({ l: lightness, c: chroma, h: hue });
      }
    }

    // Sort by hue then lightness for visual coherence
    generated.sort((a, b) => {
      const hueDiff = a.h - b.h;
      if (Math.abs(hueDiff) > 5) return hueDiff;
      return a.l - b.l;
    });

    // Take exactly 30 colors (trim or pad)
    while (generated.length > 30) generated.pop();
    while (generated.length < 30) {
      // Pad with neutral grays
      const l = 0.2 + (generated.length / 30) * 0.6;
      generated.push({ l, c: 0, h: 0 });
    }

    // Slot 0: near-black
    const nearBlack = toRgb({ mode: 'oklch', l: 0.05, c: 0, h: 0 });
    colors.push(normalizeHex(formatHex(nearBlack)));

    // Slots 1-30: generated colors
    for (const g of generated) {
      const rgb = toRgb({ mode: 'oklch', l: g.l, c: g.c, h: g.h });
      colors.push(normalizeHex(formatHex(rgb)));
    }

    // Slot 31: near-white
    const nearWhite = toRgb({ mode: 'oklch', l: 0.95, c: 0, h: 0 });
    colors.push(normalizeHex(formatHex(nearWhite)));
  }

  return {
    name: 'Generated Custom',
    preset: 'custom',
    colors,
  };
}

/**
 * Convert 32 hex color strings to a GPU-ready RGBA byte array.
 *
 * @param colors - Array of 32 '#RRGGBB' hex strings
 * @returns Uint8Array of 128 bytes (32 colors x 4 channels RGBA)
 */
export function paletteToUint8(colors: string[]): Uint8Array {
  const data = new Uint8Array(colors.length * 4);

  for (let i = 0; i < colors.length; i++) {
    const hex = colors[i];
    const offset = i * 4;
    data[offset] = parseInt(hex.slice(1, 3), 16); // R
    data[offset + 1] = parseInt(hex.slice(3, 5), 16); // G
    data[offset + 2] = parseInt(hex.slice(5, 7), 16); // B
    data[offset + 3] = 255; // A
  }

  return data;
}
