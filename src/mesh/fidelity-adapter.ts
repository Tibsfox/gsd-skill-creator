/**
 * FidelityAdapter -- adjusts DACP bundle compression based on TransportCondition.
 *
 * Compression adapts to how congested or slow the transport link is:
 * - local: no compression (identity -- fast, same machine)
 * - mesh: standard gzip (level 6, LAN)
 * - remote: maximum gzip (level 9, slow/remote link)
 *
 * compressBundle() returns originalSize and compressedSize so callers can
 * audit the compression ratio (measurability requirement).
 *
 * All functions are synchronous and pure (no IO, no side effects).
 *
 * IMP-03: Threshold constants exported.
 */

import { z } from 'zod';
import { gzipSync, gunzipSync } from 'node:zlib';

// ============================================================================
// Constants (IMP-03: Transport condition thresholds)
// ============================================================================

/**
 * Latency threshold below which two nodes are considered co-located (local).
 * Below this value: same machine, different process.
 */
export const LOCAL_LATENCY_THRESHOLD_MS = 50;

/**
 * Latency threshold below which two nodes are considered on the same LAN (mesh).
 * Between LOCAL_LATENCY_THRESHOLD_MS and this value: LAN transport.
 */
export const MESH_LATENCY_THRESHOLD_MS = 500;

// ============================================================================
// TransportCondition
// ============================================================================

/** Schema for the three transport condition tiers. */
export const TransportConditionSchema = z.enum(['local', 'mesh', 'remote']);

/** TypeScript type for transport conditions. */
export type TransportCondition = z.infer<typeof TransportConditionSchema>;

// ============================================================================
// Compression Result
// ============================================================================

/**
 * Result of compressBundle().
 * Includes original and compressed sizes for auditability.
 */
export interface CompressionResult {
  /** Compressed (or identity) bundle data. Gzip results are base64-encoded. */
  data: string;
  /**
   * Compression type applied:
   * - 'none' for local (identity)
   * - 'gzip-standard' for mesh (level 6)
   * - 'gzip-maximum' for remote (level 9)
   */
  compressionType: 'none' | 'gzip-standard' | 'gzip-maximum';
  /** Original bundle size in bytes (UTF-8) */
  originalSize: number;
  /** Compressed bundle size in bytes (UTF-8 of base64 string, or same as originalSize for 'none') */
  compressedSize: number;
}

// ============================================================================
// assessTransportCondition
// ============================================================================

/**
 * Determines the transport condition based on node identity and observed latency.
 *
 * Rules (evaluated in order):
 * 1. sourceNodeId === targetNodeId -> 'local' (same node, in-process)
 * 2. latencyMs < LOCAL_LATENCY_THRESHOLD_MS (50ms) -> 'local' (same machine, cross-process)
 * 3. latencyMs < MESH_LATENCY_THRESHOLD_MS (500ms) -> 'mesh' (LAN)
 * 4. latencyMs >= MESH_LATENCY_THRESHOLD_MS or undefined -> 'remote' (slow/unknown link)
 *
 * @param sourceNodeId - ID of the sending node
 * @param targetNodeId - ID of the receiving node
 * @param latencyMs - Observed round-trip latency in milliseconds (optional)
 * @returns The assessed TransportCondition
 */
export function assessTransportCondition(
  sourceNodeId: string,
  targetNodeId: string,
  latencyMs?: number,
): TransportCondition {
  // Rule 1: Same node is always local (in-process)
  if (sourceNodeId === targetNodeId) return 'local';

  // Rule 2-4: Latency-based classification
  if (latencyMs !== undefined) {
    if (latencyMs < LOCAL_LATENCY_THRESHOLD_MS) return 'local';
    if (latencyMs < MESH_LATENCY_THRESHOLD_MS) return 'mesh';
    return 'remote';
  }

  // Rule 4: Unknown latency is treated as remote (conservative)
  return 'remote';
}

// ============================================================================
// compressBundle
// ============================================================================

/**
 * Compresses a bundle JSON string according to the transport condition.
 *
 * - 'local': identity (no compression)
 * - 'mesh': gzip level 6 (standard), base64 encoded
 * - 'remote': gzip level 9 (maximum), base64 encoded
 *
 * Returns originalSize and compressedSize so callers can audit the ratio.
 *
 * @param bundleJson - Bundle JSON string to compress
 * @param condition - Transport condition that determines compression level
 * @returns CompressionResult with data, compressionType, originalSize, compressedSize
 */
export function compressBundle(
  bundleJson: string,
  condition: TransportCondition,
): CompressionResult {
  const originalSize = Buffer.byteLength(bundleJson, 'utf8');

  if (condition === 'local') {
    return {
      data: bundleJson,
      compressionType: 'none',
      originalSize,
      compressedSize: originalSize,
    };
  }

  const level = condition === 'remote' ? 9 : 6;
  const compressionType = condition === 'remote' ? 'gzip-maximum' : 'gzip-standard';

  const compressed = gzipSync(Buffer.from(bundleJson, 'utf8'), { level });
  const encoded = compressed.toString('base64');
  const compressedSize = Buffer.byteLength(encoded, 'utf8');

  return {
    data: encoded,
    compressionType,
    originalSize,
    compressedSize,
  };
}

// ============================================================================
// decompressBundle
// ============================================================================

/**
 * Decompresses a bundle back to its original JSON string.
 *
 * - compressionType 'none': returns data as-is (identity)
 * - compressionType 'gzip-standard' or 'gzip-maximum': base64 decode + gunzip
 *
 * @param data - Compressed data string (base64 for gzip types, raw for 'none')
 * @param compressionType - The compression type recorded by compressBundle()
 * @returns Original bundle JSON string
 */
export function decompressBundle(
  data: string,
  compressionType: string,
): string {
  if (compressionType === 'none') {
    return data;
  }

  if (compressionType === 'gzip-standard' || compressionType === 'gzip-maximum') {
    const buffer = Buffer.from(data, 'base64');
    const decompressed = gunzipSync(buffer);
    return decompressed.toString('utf8');
  }

  throw new Error(`Unknown compressionType: ${compressionType}`);
}
