/**
 * Experience Compression — integration tests.
 *
 * Tests the full public API (index.ts) with real settings-file fixture:
 *   - Feature-flag off (missing config file) → passthrough / disabled
 *   - Feature-flag on (temp config with enabled:true) → real compression
 *   - classifyLevel is always available regardless of flag
 *   - compress (top-level wrapper) respects feature flag
 *   - bridgeLevels respects feature flag end-to-end
 *   - Settings reader (readExperienceCompressionConfig) defaults to false
 */

import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  compress,
  classifyLevel,
  isExperienceCompressionEnabled,
  readExperienceCompressionConfig,
  bridgeLevels,
  decompress,
  compressAtLevel,
} from '../index.js';
import type { ExperienceContent } from '../types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const tmpFiles: string[] = [];

function writeTmpConfig(content: unknown): string {
  const p = path.join(os.tmpdir(), `ec-integ-${Date.now()}-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, JSON.stringify(content));
  tmpFiles.push(p);
  return p;
}

afterEach(() => {
  for (const f of tmpFiles.splice(0)) {
    try { fs.unlinkSync(f); } catch { /* ignore */ }
  }
});

function enabledConfig() {
  return {
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'experience-compression': { enabled: true },
      },
    },
  };
}

function disabledConfig() {
  return {
    'gsd-skill-creator': {
      'upstream-intelligence': {
        'experience-compression': { enabled: false },
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Settings reader
// ---------------------------------------------------------------------------

describe('integration — settings reader', () => {
  it('returns enabled:false for nonexistent config file', () => {
    const cfg = readExperienceCompressionConfig('/no/such/path/xyz.json');
    expect(cfg.enabled).toBe(false);
  });

  it('returns enabled:false for disabled config', () => {
    const p = writeTmpConfig(disabledConfig());
    const cfg = readExperienceCompressionConfig(p);
    expect(cfg.enabled).toBe(false);
  });

  it('returns enabled:true for enabled config', () => {
    const p = writeTmpConfig(enabledConfig());
    const cfg = readExperienceCompressionConfig(p);
    expect(cfg.enabled).toBe(true);
  });

  it('isExperienceCompressionEnabled returns false for missing path', () => {
    expect(isExperienceCompressionEnabled('/no/such/path.json')).toBe(false);
  });

  it('isExperienceCompressionEnabled returns true for enabled config', () => {
    const p = writeTmpConfig(enabledConfig());
    expect(isExperienceCompressionEnabled(p)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Default-off (feature flag false) — byte-identical passthrough
// ---------------------------------------------------------------------------

describe('integration — default-off byte-identical', () => {
  const payload = { rule: 'bounded-learning', constraint: 0.20 };
  const content: ExperienceContent = { id: 'integ-dis-1', payload, byteSize: 200 };

  it('compress with missing config → disabled:true, ratio 1.0, payload unchanged', () => {
    const record = compress(content, 'episodic', '/no/such/path.json');
    expect(record.disabled).toBe(true);
    expect(record.ratio).toBe(1.0);
    expect(record.compressedPayload).toEqual(payload);
  });

  it('compress with disabled config → disabled:true for all three levels', () => {
    const p = writeTmpConfig(disabledConfig());
    for (const level of ['episodic', 'procedural', 'declarative'] as const) {
      const record = compress(content, level, p);
      expect(record.disabled).toBe(true);
      expect(record.ratio).toBe(1.0);
    }
  });
});

// ---------------------------------------------------------------------------
// Feature-flag on — real compression
// ---------------------------------------------------------------------------

describe('integration — enabled path', () => {
  it('classifyLevel works without any config file', () => {
    const content: ExperienceContent = {
      id: 'cls-1',
      payload: { rule: 'test' },
      byteSize: 20,
      variabilityScore: 0.05,
      abstractionDepth: 4,
    };
    const result = classifyLevel(content);
    expect(result.level).toBe('declarative');
  });

  it('compress with enabled config returns real compression for declarative', () => {
    const p = writeTmpConfig(enabledConfig());
    // Use a long rationale so the raw payload is large enough for 1000×+ ratio.
    // The declarative compressor emits a single type-schema string regardless of
    // N or string lengths, so 500 entries × ~280-char content → ~140 KB → 1000×+.
    const longRationale =
      'Empirically validated by SkillLearnBench (arXiv:2604.20087 §6 Table 3): ' +
      'allowing more than three consecutive self-feedback rounds without external ' +
      'correction produces statistically significant quality degradation in 14/20 tasks. ' +
      'GSD constitution enforces the 20% content-change cap and 7-day cooldown.';
    const entries = Array.from({ length: 500 }, () => ({
      rule: 'bounded-learning', constraint: 0.20, evidence: '2604.20087',
      rationale: longRationale,
    }));
    const raw = JSON.stringify(entries);
    const content: ExperienceContent = { id: 'integ-en-dec', payload: entries, byteSize: raw.length };
    const record = compress(content, 'declarative', p);
    expect(record.disabled).toBeUndefined();
    expect(record.ratio).toBeGreaterThanOrEqual(1000);
  });

  it('bridgeLevels with enabled config produces diagonal records', () => {
    const p = writeTmpConfig(enabledConfig());
    const content: ExperienceContent = {
      id: 'integ-bridge-1',
      payload: [
        { event: 'tick', seq: 1, ts: 1714000001 },
        { event: 'tick', seq: 2, ts: 1714000002 },
        { event: 'tick', seq: 3, ts: 1714000003 },
      ],
      byteSize: 200,
      variabilityScore: 0.65, // episodic
    };
    // bridgeLevels reads config via isExperienceCompressionEnabled from the module
    // We pass isEnabled directly here to ensure the flag is respected
    const result = bridgeLevels(content, isExperienceCompressionEnabled(p));
    expect(result.canonicalLevel).toBe('episodic');
    expect(result.diagonalLevels.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Round-trip via index API
// ---------------------------------------------------------------------------

describe('integration — round-trip via public API', () => {
  it('compress → decompress via compressAtLevel preserves sourceId', () => {
    const content: ExperienceContent = {
      id: 'integ-rt-1',
      payload: { rule: 'test', v: 42 },
      byteSize: 100,
    };
    const record = compressAtLevel(content, 'episodic', true);
    const restored = decompress(record);
    expect(restored.id).toBe('integ-rt-1');
  });
});
