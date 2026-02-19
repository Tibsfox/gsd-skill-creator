/**
 * Tests for heuristic scanner analyzing parsed HunkFile and BootBlock structures.
 *
 * Uses synthetic fixtures matching Zod schemas from types.ts.
 * Tests cover: hunk analysis (4 rules), boot block analysis (3+ rules),
 * verdict derivation, clean files, and compound flag scenarios.
 */

import { describe, it, expect } from 'vitest';
import type { HunkFile, HunkBlock, BootBlock, HeuristicFlag } from './types.js';
import { HUNK_HEADER } from './types.js';
import { analyzeHunkFile, analyzeBootBlock, deriveHeuristicVerdict } from './heuristic-scanner.js';

// ============================================================================
// Test helpers
// ============================================================================

/** Build a minimal valid HunkFile with overrides. */
function makeHunkFile(overrides: Partial<HunkFile> = {}): HunkFile {
  return {
    magic: HUNK_HEADER,
    numHunks: 1,
    firstHunk: 0,
    lastHunk: 0,
    hunkSizes: [1024],
    hunkMemoryFlags: ['any'],
    hunks: [
      {
        type: 'HUNK_CODE',
        memoryFlag: 'any',
        dataOffset: 32,
        dataLength: 4096,
      },
      {
        type: 'HUNK_END',
        memoryFlag: 'any',
        dataOffset: 4128,
        dataLength: 0,
      },
    ],
    ...overrides,
  };
}

/** Build a minimal valid BootBlock with overrides. */
function makeBootBlock(overrides: Partial<BootBlock> = {}): BootBlock {
  return {
    dosType: 'OFS',
    isValid: true,
    checksum: 0,
    rootBlock: 880,
    bootcodePresent: false,
    bootcodeOffset: 12,
    bootcodeLength: 0,
    suspectFlags: [],
    ...overrides,
  };
}

/** Build a HunkBlock with overrides. */
function makeHunkBlock(overrides: Partial<HunkBlock> = {}): HunkBlock {
  return {
    type: 'HUNK_CODE',
    memoryFlag: 'any',
    dataOffset: 32,
    dataLength: 4096,
    ...overrides,
  };
}

/** Create a raw Uint8Array with specific bytes at an offset. */
function makeRawWithBytes(size: number, entries: Array<{ offset: number; bytes: number[] }>): Uint8Array {
  const raw = new Uint8Array(size);
  for (const entry of entries) {
    for (let i = 0; i < entry.bytes.length; i++) {
      raw[entry.offset + i] = entry.bytes[i];
    }
  }
  return raw;
}

// ============================================================================
// analyzeHunkFile tests
// ============================================================================

describe('analyzeHunkFile', () => {
  it('flags small first code hunk (< 256 bytes)', () => {
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({ type: 'HUNK_CODE', dataOffset: 32, dataLength: 64 }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 96, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(256);

    const flags = analyzeHunkFile(hunkFile, raw);
    const smallHunkFlag = flags.find((f) => f.rule === 'small-first-hunk');
    expect(smallHunkFlag).toBeDefined();
    expect(smallHunkFlag!.severity).toBe('warning');
    expect(smallHunkFlag!.description).toMatch(/small.*first.*hunk/i);
  });

  it('does not flag normal-sized first code hunk', () => {
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({ type: 'HUNK_CODE', dataOffset: 32, dataLength: 4096 }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 4128, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(8192);

    const flags = analyzeHunkFile(hunkFile, raw);
    expect(flags.find((f) => f.rule === 'small-first-hunk')).toBeUndefined();
  });

  it('flags anomalous hunk ordering (HUNK_DATA before HUNK_CODE)', () => {
    const hunkFile = makeHunkFile({
      numHunks: 2,
      hunks: [
        makeHunkBlock({ type: 'HUNK_DATA', dataOffset: 32, dataLength: 512 }),
        makeHunkBlock({ type: 'HUNK_CODE', dataOffset: 544, dataLength: 1024 }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 1568, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(2048);

    const flags = analyzeHunkFile(hunkFile, raw);
    const orderFlag = flags.find((f) => f.rule === 'anomalous-hunk-ordering');
    expect(orderFlag).toBeDefined();
    expect(orderFlag!.severity).toBe('info');
  });

  it('flags excessive relocations (ratio > 2.0)', () => {
    // 256 byte code hunk with 500+ relocation offsets: ratio = 500 / (256/4) = 7.8
    const offsets = Array.from({ length: 500 }, (_, i) => i * 4);
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({
          type: 'HUNK_CODE',
          dataOffset: 32,
          dataLength: 256,
          relocations: [{ targetHunk: 0, offsets }],
        }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 288, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(512);

    const flags = analyzeHunkFile(hunkFile, raw);
    const relocFlag = flags.find((f) => f.rule === 'excessive-relocations');
    expect(relocFlag).toBeDefined();
    expect(relocFlag!.severity).toBe('warning');
  });

  it('does not flag normal relocations', () => {
    // 4096 byte code hunk with 10 relocation offsets: ratio = 10 / (4096/4) = 0.0098
    const offsets = Array.from({ length: 10 }, (_, i) => i * 4);
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({
          type: 'HUNK_CODE',
          dataOffset: 32,
          dataLength: 4096,
          relocations: [{ targetHunk: 0, offsets }],
        }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 4128, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(8192);

    const flags = analyzeHunkFile(hunkFile, raw);
    expect(flags.find((f) => f.rule === 'excessive-relocations')).toBeUndefined();
  });

  it('flags suspicious entry point (JMP opcode 0x4EF9)', () => {
    const dataOffset = 32;
    // JMP (xxx).L = 0x4EF9 followed by 4-byte address
    const raw = makeRawWithBytes(8192, [
      { offset: dataOffset, bytes: [0x4e, 0xf9, 0x00, 0x0f, 0x00, 0x00] },
    ]);
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({ type: 'HUNK_CODE', dataOffset, dataLength: 4096 }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 4128, dataLength: 0 }),
      ],
    });

    const flags = analyzeHunkFile(hunkFile, raw);
    const jmpFlag = flags.find((f) => f.rule === 'suspicious-entry-point');
    expect(jmpFlag).toBeDefined();
    expect(jmpFlag!.severity).toBe('warning');
  });

  it('returns empty array for clean executable', () => {
    // Normal executable: CODE (4096 bytes) + DATA + RELOC32 + END
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({ type: 'HUNK_CODE', dataOffset: 32, dataLength: 4096 }),
        makeHunkBlock({ type: 'HUNK_DATA', dataOffset: 4128, dataLength: 1024 }),
        {
          type: 'HUNK_RELOC32',
          memoryFlag: 'any',
          dataOffset: 5152,
          dataLength: 24,
          relocations: [{ targetHunk: 1, offsets: [100, 200] }],
        },
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 5176, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(8192);

    const flags = analyzeHunkFile(hunkFile, raw);
    expect(flags).toEqual([]);
  });

  it('returns multiple flags when both small first hunk and excessive relocations', () => {
    const offsets = Array.from({ length: 300 }, (_, i) => i * 4);
    const hunkFile = makeHunkFile({
      hunks: [
        makeHunkBlock({
          type: 'HUNK_CODE',
          dataOffset: 32,
          dataLength: 64, // small
          relocations: [{ targetHunk: 0, offsets }], // excessive: 300 / (64/4) = 18.75
        }),
        makeHunkBlock({ type: 'HUNK_END', dataOffset: 96, dataLength: 0 }),
      ],
    });
    const raw = new Uint8Array(256);

    const flags = analyzeHunkFile(hunkFile, raw);
    expect(flags.find((f) => f.rule === 'small-first-hunk')).toBeDefined();
    expect(flags.find((f) => f.rule === 'excessive-relocations')).toBeDefined();
    expect(flags.length).toBeGreaterThanOrEqual(2);
  });
});

// ============================================================================
// analyzeBootBlock tests
// ============================================================================

describe('analyzeBootBlock', () => {
  it('returns critical flag for boot virus pattern (trackdisk + vector_modification)', () => {
    const bb = makeBootBlock({
      bootcodePresent: true,
      bootcodeLength: 100,
      suspectFlags: ['trackdisk_access', 'vector_modification', 'custom_bootcode'],
    });

    const flags = analyzeBootBlock(bb);
    const virusFlag = flags.find((f) => f.rule === 'boot-virus-pattern');
    expect(virusFlag).toBeDefined();
    expect(virusFlag!.severity).toBe('critical');
  });

  it('returns warning for suspicious bootcode (custom_bootcode + exec_library_call, invalid checksum)', () => {
    const bb = makeBootBlock({
      isValid: false,
      bootcodePresent: true,
      bootcodeLength: 100,
      suspectFlags: ['custom_bootcode', 'exec_library_call'],
    });

    const flags = analyzeBootBlock(bb);
    const suspiciousFlag = flags.find((f) => f.rule === 'suspicious-bootcode');
    expect(suspiciousFlag).toBeDefined();
    expect(suspiciousFlag!.severity).toBe('warning');
  });

  it('returns warning for resident install bootcode', () => {
    const bb = makeBootBlock({
      bootcodePresent: true,
      bootcodeLength: 100,
      suspectFlags: ['custom_bootcode', 'resident_install'],
    });

    const flags = analyzeBootBlock(bb);
    const residentFlag = flags.find((f) => f.rule === 'resident-install-bootcode');
    expect(residentFlag).toBeDefined();
    expect(residentFlag!.severity).toBe('warning');
  });

  it('does not flag standard boot block with only custom_bootcode', () => {
    const bb = makeBootBlock({
      isValid: false,
      bootcodePresent: true,
      bootcodeLength: 100,
      suspectFlags: ['custom_bootcode'],
    });

    const flags = analyzeBootBlock(bb);
    // Should return empty or only info-level flags
    const actionableFlags = flags.filter((f) => f.severity !== 'info');
    expect(actionableFlags).toEqual([]);
  });

  it('returns empty array for empty boot block', () => {
    const bb = makeBootBlock({
      bootcodePresent: false,
      bootcodeLength: 0,
      suspectFlags: [],
    });

    const flags = analyzeBootBlock(bb);
    expect(flags).toEqual([]);
  });

  it('returns critical flag for full virus combo (all 5 suspectFlags)', () => {
    const bb = makeBootBlock({
      isValid: false,
      bootcodePresent: true,
      bootcodeLength: 500,
      suspectFlags: [
        'trackdisk_access',
        'custom_bootcode',
        'vector_modification',
        'resident_install',
        'exec_library_call',
      ],
    });

    const flags = analyzeBootBlock(bb);
    // Must have at least one critical flag
    const criticalFlags = flags.filter((f) => f.severity === 'critical');
    expect(criticalFlags.length).toBeGreaterThanOrEqual(1);
  });

  it('does not flag valid checksum with only custom_bootcode', () => {
    const bb = makeBootBlock({
      isValid: true,
      bootcodePresent: true,
      bootcodeLength: 100,
      suspectFlags: ['custom_bootcode'],
    });

    const flags = analyzeBootBlock(bb);
    // No suspicious flags -- valid checksum + only custom bootcode = legitimate bootloader
    expect(flags).toEqual([]);
  });

  it('returns info flag for trackdisk without vector modification', () => {
    const bb = makeBootBlock({
      bootcodePresent: true,
      bootcodeLength: 200,
      suspectFlags: ['custom_bootcode', 'trackdisk_access'],
    });

    const flags = analyzeBootBlock(bb);
    const infoFlag = flags.find((f) => f.rule === 'trackdisk-without-vector');
    expect(infoFlag).toBeDefined();
    expect(infoFlag!.severity).toBe('info');
  });
});

// ============================================================================
// deriveHeuristicVerdict tests
// ============================================================================

describe('deriveHeuristicVerdict', () => {
  it('returns clean for empty flags', () => {
    expect(deriveHeuristicVerdict([])).toBe('clean');
  });

  it('returns clean for only info severity flags', () => {
    const flags: HeuristicFlag[] = [
      { rule: 'anomalous-hunk-ordering', severity: 'info', description: 'test' },
    ];
    expect(deriveHeuristicVerdict(flags)).toBe('clean');
  });

  it('returns suspicious for at least one warning flag', () => {
    const flags: HeuristicFlag[] = [
      { rule: 'small-first-hunk', severity: 'warning', description: 'test' },
    ];
    expect(deriveHeuristicVerdict(flags)).toBe('suspicious');
  });

  it('returns infected for at least one critical flag', () => {
    const flags: HeuristicFlag[] = [
      { rule: 'boot-virus-pattern', severity: 'critical', description: 'test' },
    ];
    expect(deriveHeuristicVerdict(flags)).toBe('infected');
  });

  it('returns infected for mixed warning + critical (worst-case wins)', () => {
    const flags: HeuristicFlag[] = [
      { rule: 'small-first-hunk', severity: 'warning', description: 'test' },
      { rule: 'boot-virus-pattern', severity: 'critical', description: 'test' },
    ];
    expect(deriveHeuristicVerdict(flags)).toBe('infected');
  });
});
