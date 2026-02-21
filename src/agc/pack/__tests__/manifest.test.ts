/**
 * Tests for AGC pack manifest.
 *
 * Covers: pack manifest structure, standalone flag, block/widget listing,
 * skill listing, and install detection.
 *
 * @module agc/pack/__tests__/manifest
 */

import { describe, it, expect } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  AGC_PACK_MANIFEST,
  isPackInstalled,
  getPackBlocks,
  getPackWidgets,
} from '../manifest.js';

// ============================================================================
// Pack manifest
// ============================================================================

describe('AGC_PACK_MANIFEST', () => {
  it('has name "agc-educational"', () => {
    expect(AGC_PACK_MANIFEST.name).toBe('agc-educational');
  });

  it('has standalone: true', () => {
    expect(AGC_PACK_MANIFEST.standalone).toBe(true);
  });

  it('has version string matching semver pattern', () => {
    expect(AGC_PACK_MANIFEST.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it('blocks is an array', () => {
    expect(Array.isArray(AGC_PACK_MANIFEST.blocks)).toBe(true);
  });

  it('widgets is an array', () => {
    expect(Array.isArray(AGC_PACK_MANIFEST.widgets)).toBe(true);
  });

  it('skills lists the 5 skill names', () => {
    expect(AGC_PACK_MANIFEST.skills).toHaveLength(5);
    expect(AGC_PACK_MANIFEST.skills).toContain('agc-architecture-reference');
    expect(AGC_PACK_MANIFEST.skills).toContain('agc-executive-guide');
    expect(AGC_PACK_MANIFEST.skills).toContain('agc-assembler');
    expect(AGC_PACK_MANIFEST.skills).toContain('agc-debugger');
    expect(AGC_PACK_MANIFEST.skills).toContain('agc-dsky-commands');
  });
});

// ============================================================================
// Pack lifecycle queries
// ============================================================================

describe('Pack lifecycle', () => {
  it('isPackInstalled returns true when agc-educational.yaml exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agc-test-'));
    writeFileSync(join(dir, 'agc-educational.yaml'), 'chipset: test');
    try {
      expect(isPackInstalled(dir)).toBe(true);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('isPackInstalled returns false when no agc-educational.yaml exists', () => {
    const dir = mkdtempSync(join(tmpdir(), 'agc-test-'));
    try {
      expect(isPackInstalled(dir)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('getPackBlocks returns the block definitions array', () => {
    const blocks = getPackBlocks();
    expect(Array.isArray(blocks)).toBe(true);
  });

  it('getPackWidgets returns the widget definitions array', () => {
    const widgets = getPackWidgets();
    expect(Array.isArray(widgets)).toBe(true);
  });
});
