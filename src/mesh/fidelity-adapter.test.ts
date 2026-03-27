/**
 * Tests for FidelityAdapter -- transport condition assessment and
 * compression level selection.
 *
 * TDD: tests written before implementation.
 */

import { describe, it, expect } from 'vitest';
import {
  assessTransportCondition,
  compressBundle,
  decompressBundle,
  LOCAL_LATENCY_THRESHOLD_MS,
  MESH_LATENCY_THRESHOLD_MS,
  TransportConditionSchema,
} from './fidelity-adapter.js';

// ─── Constants ───────────────────────────────────────────────────────────────

describe('constants', () => {
  it('exports LOCAL_LATENCY_THRESHOLD_MS = 50', () => {
    expect(LOCAL_LATENCY_THRESHOLD_MS).toBe(50);
  });

  it('exports MESH_LATENCY_THRESHOLD_MS = 500', () => {
    expect(MESH_LATENCY_THRESHOLD_MS).toBe(500);
  });

  it('TransportConditionSchema accepts local, mesh, remote', () => {
    expect(TransportConditionSchema.parse('local')).toBe('local');
    expect(TransportConditionSchema.parse('mesh')).toBe('mesh');
    expect(TransportConditionSchema.parse('remote')).toBe('remote');
  });

  it('TransportConditionSchema rejects unknown values', () => {
    expect(() => TransportConditionSchema.parse('fast')).toThrow();
  });
});

// ─── assessTransportCondition ─────────────────────────────────────────────────

describe('assessTransportCondition', () => {
  it('returns local when sourceNodeId === targetNodeId', () => {
    const condition = assessTransportCondition('node-a', 'node-a');
    expect(condition).toBe('local');
  });

  it('returns local when latencyMs < LOCAL_LATENCY_THRESHOLD_MS (49ms)', () => {
    const condition = assessTransportCondition('node-a', 'node-b', 49);
    expect(condition).toBe('local');
  });

  it('returns local when latencyMs is 0', () => {
    const condition = assessTransportCondition('node-a', 'node-b', 0);
    expect(condition).toBe('local');
  });

  it('returns mesh when latencyMs >= LOCAL_LATENCY_THRESHOLD_MS and < MESH_LATENCY_THRESHOLD_MS (50ms)', () => {
    const condition = assessTransportCondition('node-a', 'node-b', 50);
    expect(condition).toBe('mesh');
  });

  it('returns mesh when latencyMs = 499ms', () => {
    const condition = assessTransportCondition('node-a', 'node-b', 499);
    expect(condition).toBe('mesh');
  });

  it('returns remote when latencyMs >= MESH_LATENCY_THRESHOLD_MS (500ms)', () => {
    const condition = assessTransportCondition('node-a', 'node-b', 500);
    expect(condition).toBe('remote');
  });

  it('returns remote when latencyMs is very high (10000ms)', () => {
    const condition = assessTransportCondition('node-a', 'node-b', 10000);
    expect(condition).toBe('remote');
  });

  it('returns remote when latencyMs is not provided (unknown)', () => {
    const condition = assessTransportCondition('node-a', 'node-b');
    expect(condition).toBe('remote');
  });

  it('same node takes priority over latencyMs', () => {
    // Even if latency would indicate remote, same node is always local
    const condition = assessTransportCondition('node-x', 'node-x', 9999);
    expect(condition).toBe('local');
  });
});

// ─── compressBundle ───────────────────────────────────────────────────────────

const LARGE_BUNDLE = JSON.stringify({
  content: 'The quick brown fox jumps over the lazy dog. '.repeat(200),
  metadata: { version: '1.0', tags: Array.from({ length: 50 }, (_, i) => `tag-${i}`) },
});

describe('compressBundle', () => {
  it('returns data as-is for local condition (no compression)', () => {
    const input = '{"key": "value"}';
    const result = compressBundle(input, 'local');
    expect(result.data).toBe(input);
    expect(result.compressionType).toBe('none');
    expect(result.originalSize).toBe(Buffer.byteLength(input, 'utf8'));
    expect(result.compressedSize).toBe(result.originalSize);
  });

  it('returns originalSize and compressedSize in result', () => {
    const input = '{"test": true}';
    const result = compressBundle(input, 'local');
    expect(typeof result.originalSize).toBe('number');
    expect(typeof result.compressedSize).toBe('number');
    expect(result.originalSize).toBeGreaterThan(0);
  });

  it('compresses to gzip-standard for mesh condition', () => {
    const result = compressBundle(LARGE_BUNDLE, 'mesh');
    expect(result.compressionType).toBe('gzip-standard');
    expect(result.data).not.toBe(LARGE_BUNDLE); // must be encoded
    expect(result.compressedSize).toBeLessThan(result.originalSize);
  });

  it('compresses to gzip-maximum for remote condition', () => {
    const result = compressBundle(LARGE_BUNDLE, 'remote');
    expect(result.compressionType).toBe('gzip-maximum');
    expect(result.data).not.toBe(LARGE_BUNDLE);
    expect(result.compressedSize).toBeLessThan(result.originalSize);
  });

  it('remote compression is measurably smaller than local for same large input', () => {
    const local = compressBundle(LARGE_BUNDLE, 'local');
    const remote = compressBundle(LARGE_BUNDLE, 'remote');
    // remote compressedSize should be much less than local (which is uncompressed)
    expect(remote.compressedSize).toBeLessThan(local.compressedSize);
  });

  it('mesh compression is measurably smaller than local for same large input', () => {
    const local = compressBundle(LARGE_BUNDLE, 'local');
    const mesh = compressBundle(LARGE_BUNDLE, 'mesh');
    expect(mesh.compressedSize).toBeLessThan(local.compressedSize);
  });

  it('remote compressedSize <= mesh compressedSize for highly compressible data', () => {
    // maximum compression should be at least as good as standard
    const mesh = compressBundle(LARGE_BUNDLE, 'mesh');
    const remote = compressBundle(LARGE_BUNDLE, 'remote');
    expect(remote.compressedSize).toBeLessThanOrEqual(mesh.compressedSize);
  });
});

// ─── decompressBundle ─────────────────────────────────────────────────────────

describe('decompressBundle', () => {
  it('returns data as-is for none compression type', () => {
    const original = '{"hello": "world"}';
    const result = decompressBundle(original, 'none');
    expect(result).toBe(original);
  });

  it('round-trips through gzip-standard (compress then decompress)', () => {
    const original = LARGE_BUNDLE;
    const compressed = compressBundle(original, 'mesh');
    const decompressed = decompressBundle(compressed.data, compressed.compressionType);
    expect(decompressed).toBe(original);
  });

  it('round-trips through gzip-maximum (compress then decompress)', () => {
    const original = LARGE_BUNDLE;
    const compressed = compressBundle(original, 'remote');
    const decompressed = decompressBundle(compressed.data, compressed.compressionType);
    expect(decompressed).toBe(original);
  });

  it('round-trips preserve exact JSON content', () => {
    const original = JSON.stringify({ a: 1, b: [1, 2, 3], c: { nested: true } });
    const compressed = compressBundle(original, 'mesh');
    const decompressed = decompressBundle(compressed.data, compressed.compressionType);
    expect(JSON.parse(decompressed)).toEqual(JSON.parse(original));
  });
});
