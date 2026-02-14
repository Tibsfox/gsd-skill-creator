/**
 * Copper list data model, preset programs, and GPU texture encoding.
 *
 * Inspired by the Amiga copper coprocessor, a copper list manipulates
 * background colors per-scanline. Each entry specifies a scanline range
 * and two palette indices with interpolation, producing gradient
 * backgrounds and raster bar effects.
 *
 * The copper list is encoded as an Nx1 RGBA texture where each texel
 * stores per-scanline parameters for the fragment shader:
 *   R = palette index A (0-31)
 *   G = palette index B (0-31)
 *   B = blend factor (0-255 maps to 0.0-1.0)
 *   A = 255 (always opaque)
 */

/** A single copper list entry spanning a range of virtual scanlines. */
export interface CopperEntry {
  /** First virtual scanline (0-255). */
  startLine: number;
  /** Last virtual scanline (0-255), inclusive. */
  endLine: number;
  /** First palette index (0-31). */
  paletteIndexA: number;
  /** Second palette index (0-31). */
  paletteIndexB: number;
  /** Interpolation factor (0.0 = all A, 1.0 = all B). */
  blend: number;
}

/** A named collection of copper entries forming a background program. */
export interface CopperProgram {
  /** Human-readable program name. */
  name: string;
  /** Ordered list of copper entries (later entries override earlier for overlapping scanlines). */
  entries: CopperEntry[];
}

/**
 * Built-in copper list presets.
 *
 * - 'gradient': smooth vertical gradient across full 256 scanlines
 * - 'raster-bars': multiple colored horizontal bands on black background
 * - 'flat': single solid background color (no interpolation)
 */
export const COPPER_PRESETS: Record<string, CopperProgram> = {
  gradient: {
    name: 'gradient',
    entries: [
      { startLine: 0, endLine: 255, paletteIndexA: 1, paletteIndexB: 20, blend: 0 },
    ],
  },
  'raster-bars': {
    name: 'raster-bars',
    entries: [
      // Background: black
      { startLine: 0, endLine: 255, paletteIndexA: 0, paletteIndexB: 0, blend: 0 },
      // Bar 1
      { startLine: 40, endLine: 60, paletteIndexA: 5, paletteIndexB: 8, blend: 0 },
      // Bar 2
      { startLine: 100, endLine: 120, paletteIndexA: 10, paletteIndexB: 13, blend: 0 },
      // Bar 3
      { startLine: 160, endLine: 180, paletteIndexA: 15, paletteIndexB: 18, blend: 0 },
      // Bar 4
      { startLine: 220, endLine: 240, paletteIndexA: 21, paletteIndexB: 24, blend: 0 },
    ],
  },
  flat: {
    name: 'flat',
    entries: [
      { startLine: 0, endLine: 255, paletteIndexA: 0, paletteIndexB: 0, blend: 0 },
    ],
  },
};

/**
 * Encode a copper program into a GPU-ready RGBA byte array.
 *
 * Each scanline gets one RGBA texel:
 *   R = palette index A
 *   G = palette index B
 *   B = interpolation factor (0-255), pre-baked from scanline position within entry range
 *   A = 255
 *
 * When paletteIndexA === paletteIndexB, the B channel is 0 (no interpolation needed).
 * Later entries overwrite earlier ones for overlapping scanlines (last-writer wins).
 *
 * @param program - Copper program to encode
 * @param height - Number of virtual scanlines (default 256)
 * @returns Uint8Array of height * 4 bytes
 */
export function copperListToTexture(program: CopperProgram, height: number = 256): Uint8Array {
  const data = new Uint8Array(height * 4);

  // Initialize all scanlines to [0, 0, 0, 255] (black background)
  for (let i = 0; i < height; i++) {
    const offset = i * 4;
    data[offset] = 0;     // R
    data[offset + 1] = 0; // G
    data[offset + 2] = 0; // B
    data[offset + 3] = 255; // A
  }

  // Process entries in order (later entries override earlier for same scanlines)
  for (const entry of program.entries) {
    const { startLine, endLine, paletteIndexA, paletteIndexB } = entry;
    const range = Math.max(1, endLine - startLine);

    for (let line = startLine; line <= endLine && line < height; line++) {
      const offset = line * 4;
      data[offset] = paletteIndexA;     // R = palette index A
      data[offset + 1] = paletteIndexB; // G = palette index B

      // B = interpolation factor, pre-baked from position within range
      if (paletteIndexA === paletteIndexB) {
        data[offset + 2] = 0; // No interpolation needed when same index
      } else {
        const t = (line - startLine) / range;
        data[offset + 2] = Math.round(t * 255);
      }

      data[offset + 3] = 255; // A = always opaque
    }
  }

  return data;
}
