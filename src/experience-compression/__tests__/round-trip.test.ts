/**
 * Experience Compression — round-trip tests.
 *
 * compress + decompress round-trip preserves:
 *   - sourceId / id
 *   - originalByteSize / byteSize
 *   - level tag on the restored record
 *   - semantic non-null payload
 *
 * Covers all three levels × enabled + disabled paths.
 */

import { describe, it, expect } from 'vitest';
import { compress as compressAtLevel, decompress } from '../compressor.js';
import type { ExperienceContent } from '../types.js';

function makeContent(id: string, payload: unknown, byteSize: number): ExperienceContent {
  return { id, payload, byteSize };
}

// ---------------------------------------------------------------------------
// Episodic round-trip
// ---------------------------------------------------------------------------

describe('round-trip — episodic', () => {
  it('round-trip preserves id, byteSize, and level tag', () => {
    const entries = Array.from({ length: 20 }, (_, i) => ({
      ts: 1714000000 + i,
      event: 'tick',
      user: 'maple',
      detail: 'X'.repeat(80),
    }));
    const raw = JSON.stringify(entries);
    const content = makeContent('ep-rt-1', entries, raw.length);

    const record = compressAtLevel(content, 'episodic', true);
    const restored = decompress(record);

    expect(restored.id).toBe('ep-rt-1');
    expect(restored.byteSize).toBe(raw.length);
    expect(restored.tags).toContain('episodic');
    expect(restored.payload).not.toBeNull();
  });

  it('round-trip ratio is in target range 5–20× (or higher for aggressive dedup)', () => {
    const repeatedLong = Array.from({ length: 20 }, () => ({
      k: 'session-tick',
      v: 'A'.repeat(100),
      t: 9999,
    }));
    const raw = JSON.stringify(repeatedLong);
    const content = makeContent('ep-rt-ratio', repeatedLong, raw.length);
    const record = compressAtLevel(content, 'episodic', true);
    expect(record.ratio).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// Procedural round-trip
// ---------------------------------------------------------------------------

describe('round-trip — procedural', () => {
  it('round-trip preserves id and semantic non-null payload', () => {
    const entries = Array.from({ length: 200 }, () => ({
      skill: 'compress',
      params: { level: 'procedural', threshold: 0.5 },
      steps: ['a', 'b', 'c'],
    }));
    const raw = JSON.stringify(entries);
    const content = makeContent('proc-rt-1', entries, raw.length);

    const record = compressAtLevel(content, 'procedural', true);
    const restored = decompress(record);

    expect(restored.id).toBe('proc-rt-1');
    expect(restored.byteSize).toBe(raw.length);
    expect(restored.payload).not.toBeNull();
    expect(restored.tags).toContain('procedural');
  });

  it('round-trip ratio is in target range ≥ 50×', () => {
    const entries = Array.from({ length: 200 }, () => ({
      skill: 'compress',
      params: { level: 'procedural', threshold: 0.5, depth: 6 },
      meta: { author: 'maple', checksum: 'abc123', ts: '2026-04-24' },
    }));
    const raw = JSON.stringify(entries);
    const content = makeContent('proc-rt-ratio', entries, raw.length);
    const record = compressAtLevel(content, 'procedural', true);
    expect(record.ratio).toBeGreaterThanOrEqual(50);
  });
});

// ---------------------------------------------------------------------------
// Declarative round-trip
// ---------------------------------------------------------------------------

describe('round-trip — declarative', () => {
  it('round-trip preserves id and semantic non-null payload', () => {
    const entries = Array.from({ length: 500 }, () => ({
      rule: 'bounded-learning',
      constraint: 0.20,
      evidence: 'SkillLearnBench 2604.20087',
    }));
    const raw = JSON.stringify(entries);
    const content = makeContent('dec-rt-1', entries, raw.length);

    const record = compressAtLevel(content, 'declarative', true);
    const restored = decompress(record);

    expect(restored.id).toBe('dec-rt-1');
    expect(restored.byteSize).toBe(raw.length);
    expect(restored.payload).not.toBeNull();
    expect(restored.tags).toContain('declarative');
  });

  it('round-trip ratio is ≥ 1000× on large declarative fixture', () => {
    // 500 identical rule records with long rationale strings.
    // The declarative compressor reduces the entire array to a single
    // type-schema string ("DECL:schema=array[500]<...>;checksum=..."), so
    // the compressed output is ~120 chars regardless of N or string lengths.
    // With N=500 and a ~200-char rationale per entry the raw size is ~130 KB,
    // yielding ratio >> 1000×.
    const longRationale =
      'Empirically validated by SkillLearnBench (arXiv:2604.20087 §6 Table 3): ' +
      'allowing more than three consecutive self-feedback rounds without external ' +
      'correction produces statistically significant quality degradation in 14/20 tasks. ' +
      'GSD constitution enforces the 20% content-change cap and 7-day cooldown as ' +
      'the minimum constraints that arrest recursive drift under self-feedback.';
    const entries = Array.from({ length: 500 }, () => ({
      rule: 'bounded-learning',
      constraint: 0.20,
      cooldown: 7,
      evidence: 'SkillLearnBench 2604.20087',
      rationale: longRationale,
    }));
    const raw = JSON.stringify(entries);
    const content = makeContent('dec-rt-ratio', entries, raw.length);
    const record = compressAtLevel(content, 'declarative', true);
    expect(record.ratio).toBeGreaterThanOrEqual(1000);
  });
});

// ---------------------------------------------------------------------------
// Disabled round-trip (byte-identical)
// ---------------------------------------------------------------------------

describe('round-trip — disabled path (byte-identical)', () => {
  it('disabled compress → decompress returns original payload unchanged', () => {
    const payload = { rule: 'test', constraint: 42, tags: ['a', 'b'] };
    const content: ExperienceContent = { id: 'dis-rt-1', payload, byteSize: 100 };

    const record = compressAtLevel(content, 'episodic', false);
    expect(record.disabled).toBe(true);

    const restored = decompress(record);
    expect(restored.id).toBe('dis-rt-1');
    expect(restored.payload).toEqual(payload);
    expect(restored.byteSize).toBe(100);
  });
});
