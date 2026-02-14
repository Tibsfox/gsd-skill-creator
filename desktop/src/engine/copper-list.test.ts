import { describe, it, expect } from 'vitest';
import {
  type CopperEntry,
  type CopperProgram,
  COPPER_PRESETS,
  copperListToTexture,
} from './copper-list';

describe('CopperEntry type', () => {
  it('has required fields: startLine, endLine, paletteIndexA, paletteIndexB, blend', () => {
    const entry: CopperEntry = {
      startLine: 0,
      endLine: 255,
      paletteIndexA: 0,
      paletteIndexB: 5,
      blend: 0.5,
    };

    expect(entry).toHaveProperty('startLine');
    expect(entry).toHaveProperty('endLine');
    expect(entry).toHaveProperty('paletteIndexA');
    expect(entry).toHaveProperty('paletteIndexB');
    expect(entry).toHaveProperty('blend');
  });

  it('accepts valid entry with startLine=0, endLine=127, paletteIndexA=0, paletteIndexB=5, blend=0.5', () => {
    const entry: CopperEntry = {
      startLine: 0,
      endLine: 127,
      paletteIndexA: 0,
      paletteIndexB: 5,
      blend: 0.5,
    };

    expect(entry.startLine).toBe(0);
    expect(entry.endLine).toBe(127);
    expect(entry.paletteIndexA).toBe(0);
    expect(entry.paletteIndexB).toBe(5);
    expect(entry.blend).toBe(0.5);
  });
});

describe('CopperProgram type', () => {
  it('has name and entries fields', () => {
    const program: CopperProgram = {
      name: 'test',
      entries: [],
    };

    expect(program).toHaveProperty('name');
    expect(program).toHaveProperty('entries');
  });

  it('can contain multiple entries covering different scanline ranges', () => {
    const program: CopperProgram = {
      name: 'multi',
      entries: [
        { startLine: 0, endLine: 63, paletteIndexA: 0, paletteIndexB: 3, blend: 0 },
        { startLine: 64, endLine: 127, paletteIndexA: 4, paletteIndexB: 7, blend: 0 },
        { startLine: 128, endLine: 255, paletteIndexA: 8, paletteIndexB: 11, blend: 0 },
      ],
    };

    expect(program.entries).toHaveLength(3);
    expect(program.entries[0].endLine).toBe(63);
    expect(program.entries[2].startLine).toBe(128);
  });
});

describe('COPPER_PRESETS', () => {
  it('has at least 3 presets: gradient, raster-bars, flat', () => {
    expect(COPPER_PRESETS).toHaveProperty('gradient');
    expect(COPPER_PRESETS).toHaveProperty('raster-bars');
    expect(COPPER_PRESETS).toHaveProperty('flat');
  });

  it('gradient preset has entries spanning full 256 virtual scanlines (0-255)', () => {
    const gradient = COPPER_PRESETS['gradient'];
    const covered = new Set<number>();
    for (const entry of gradient.entries) {
      for (let line = entry.startLine; line <= entry.endLine; line++) {
        covered.add(line);
      }
    }
    // Every scanline 0-255 must be covered
    for (let line = 0; line <= 255; line++) {
      expect(covered.has(line)).toBe(true);
    }
  });

  it('raster-bars preset has multiple distinct entries creating visible horizontal bands', () => {
    const bars = COPPER_PRESETS['raster-bars'];
    // Must have more than 1 entry (background + at least one bar)
    expect(bars.entries.length).toBeGreaterThan(1);
    // At least one entry should have different paletteIndexA/B from index 0
    const hasColoredBar = bars.entries.some(
      (e) => e.paletteIndexA !== 0 || e.paletteIndexB !== 0,
    );
    expect(hasColoredBar).toBe(true);
  });

  it('flat preset has a single entry covering all scanlines with blend=0', () => {
    const flat = COPPER_PRESETS['flat'];
    expect(flat.entries).toHaveLength(1);
    expect(flat.entries[0].startLine).toBe(0);
    expect(flat.entries[0].endLine).toBe(255);
    expect(flat.entries[0].blend).toBe(0);
  });

  it('each preset entries have no gaps -- every scanline 0-255 is covered', () => {
    for (const [name, program] of Object.entries(COPPER_PRESETS)) {
      const covered = new Set<number>();
      for (const entry of program.entries) {
        for (let line = entry.startLine; line <= entry.endLine; line++) {
          covered.add(line);
        }
      }
      for (let line = 0; line <= 255; line++) {
        expect(covered.has(line), `preset '${name}' missing scanline ${line}`).toBe(true);
      }
    }
  });
});

describe('copperListToTexture', () => {
  it('returns a Uint8Array', () => {
    const program: CopperProgram = {
      name: 'test',
      entries: [{ startLine: 0, endLine: 255, paletteIndexA: 0, paletteIndexB: 0, blend: 0 }],
    };
    const result = copperListToTexture(program, 256);
    expect(result).toBeInstanceOf(Uint8Array);
  });

  it('output length is height * 4 bytes (one RGBA per scanline)', () => {
    const program: CopperProgram = {
      name: 'test',
      entries: [{ startLine: 0, endLine: 255, paletteIndexA: 0, paletteIndexB: 0, blend: 0 }],
    };
    const result = copperListToTexture(program, 256);
    expect(result.length).toBe(256 * 4);
  });

  it('flat preset encodes R=paletteIndexA, G=paletteIndexB, B=blend*255, A=255', () => {
    const program: CopperProgram = {
      name: 'flat-test',
      entries: [{ startLine: 0, endLine: 255, paletteIndexA: 0, paletteIndexB: 0, blend: 0 }],
    };
    const result = copperListToTexture(program, 256);
    // First scanline: R=0, G=0, B=0 (indexA==indexB so blend is 0), A=255
    expect(result[0]).toBe(0);   // R = paletteIndexA
    expect(result[1]).toBe(0);   // G = paletteIndexB
    expect(result[2]).toBe(0);   // B = blend channel
    expect(result[3]).toBe(255); // A = always opaque
  });

  it('gradient entry interpolates blend from 0 to 255 across the scanline range', () => {
    const program: CopperProgram = {
      name: 'gradient-test',
      entries: [{ startLine: 0, endLine: 255, paletteIndexA: 1, paletteIndexB: 20, blend: 0 }],
    };
    const result = copperListToTexture(program, 256);

    // Line 0: R=1, G=20, B=0 (start of range)
    expect(result[0]).toBe(1);   // R = paletteIndexA
    expect(result[1]).toBe(20);  // G = paletteIndexB
    expect(result[2]).toBe(0);   // B = blend at start

    // Line 255: R=1, G=20, B=255 (end of range)
    const lastOffset = 255 * 4;
    expect(result[lastOffset]).toBe(1);     // R = paletteIndexA
    expect(result[lastOffset + 1]).toBe(20); // G = paletteIndexB
    expect(result[lastOffset + 2]).toBe(255); // B = blend at end
  });

  it('overlapping entries: later entries override earlier ones', () => {
    const program: CopperProgram = {
      name: 'overlap-test',
      entries: [
        { startLine: 0, endLine: 255, paletteIndexA: 1, paletteIndexB: 2, blend: 0 },
        { startLine: 100, endLine: 150, paletteIndexA: 10, paletteIndexB: 15, blend: 0 },
      ],
    };
    const result = copperListToTexture(program, 256);

    // Line 100 should have the second entry's values (last-writer wins)
    const offset100 = 100 * 4;
    expect(result[offset100]).toBe(10);     // R = paletteIndexA from entry 2
    expect(result[offset100 + 1]).toBe(15); // G = paletteIndexB from entry 2

    // Line 50 should still have the first entry's values
    const offset50 = 50 * 4;
    expect(result[offset50]).toBe(1);      // R = paletteIndexA from entry 1
    expect(result[offset50 + 1]).toBe(2);  // G = paletteIndexB from entry 1
  });
});
