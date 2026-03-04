/**
 * Photon measurement type schemas for the GSD DSP Layer 0 system (v1.50.46).
 *
 * Defines Zod schemas with runtime validation for photon measurement types.
 * A photon is a single measurement of a path — it fires, bounces back with
 * an echo (hash comparison), and reports same/different signal.
 *
 * @module types/photon
 */

import { z } from 'zod';

// ============================================================================
// PhotonPath
// ============================================================================

/** All supported path types for photon measurement. */
export const PHOTON_PATH_TYPES = ['file', 'glob', 'git-status', 'git-hash', 'test-suite', 'tree'] as const;

/**
 * A path definition for what to measure.
 *
 * - `type` determines HOW the path is read
 * - `target` is the filesystem path, directory, or shell command
 * - `expectedHash` is the SHA-256 hash to compare against (null = baseline)
 */
export const PhotonPathSchema = z.object({
  type: z.enum(PHOTON_PATH_TYPES),
  target: z.string(),
  expectedHash: z.string().nullable(),
});

/** Inferred TypeScript type for PhotonPath. */
export type PhotonPath = z.infer<typeof PhotonPathSchema>;

// ============================================================================
// PhotonEcho
// ============================================================================

/**
 * A single measurement result from firing a photon along a path.
 *
 * - `signal` is 'same' if hash matches expected (or baseline), 'different' otherwise
 * - `hash` is the current SHA-256 of the measured content (null if unreachable)
 * - `pathType` and `target` mirror the input for traceability
 * - `timestamp` is the ISO 8601 measurement time
 */
export const PhotonEchoSchema = z.object({
  signal: z.enum(['same', 'different']),
  hash: z.string().nullable(),
  pathType: z.enum(PHOTON_PATH_TYPES),
  target: z.string(),
  timestamp: z.string().datetime(),
});

/** Inferred TypeScript type for PhotonEcho. */
export type PhotonEcho = z.infer<typeof PhotonEchoSchema>;

// ============================================================================
// PhotonBatch
// ============================================================================

/**
 * Result of a parallel batch measurement across multiple paths.
 *
 * - `batchId` is a caller-provided identifier for correlation
 * - `paths` mirrors the input paths for traceability
 * - `echoes` contains one echo per input path, in order
 * - `differenceCount` is the number of echoes with signal 'different'
 * - `completedAt` is the ISO 8601 time when all measurements finished
 */
export const PhotonBatchSchema = z.object({
  batchId: z.string(),
  paths: z.array(PhotonPathSchema),
  echoes: z.array(PhotonEchoSchema),
  differenceCount: z.number().int().min(0),
  completedAt: z.string().datetime(),
});

/** Inferred TypeScript type for PhotonBatch. */
export type PhotonBatch = z.infer<typeof PhotonBatchSchema>;
