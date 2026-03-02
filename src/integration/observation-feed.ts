/**
 * MFE observation feed — captures problem-solving episodes as structured
 * MFEObservation records and persists them as append-only JSONL.
 *
 * This is a pure data-capture layer. It imports only from mfe-types.ts
 * and has no dependencies on engine modules.
 *
 * @module integration/observation-feed
 */

import { appendFile, mkdir, readFile } from 'fs/promises';
import { dirname } from 'path';
import type {
  MFEObservation,
  PlanePosition,
  CompositionStep,
  DomainId,
} from '../core/types/mfe-types.js';

// ============================================================================
// Constants
// ============================================================================

/** Default path for MFE observation JSONL. */
const DEFAULT_OUTPUT_PATH = 'data/observations/mfe-observations.jsonl';

/** Valid verification result values. */
const VALID_VERIFICATION_RESULTS = new Set([
  'passed',
  'failed',
  'partial',
  'skipped',
]);

// ============================================================================
// Types
// ============================================================================

/** Configuration options for creating an observation feed. */
export interface ObservationFeedOptions {
  /** Path for the JSONL output file. Default: 'data/observations/mfe-observations.jsonl' */
  outputPath?: string;
  /** Session identifier. Default: generated UUID-like string. */
  sessionId?: string;
}

/** Input data for recording an observation (before hash and timestamp). */
export interface ObservationInput {
  /** Raw problem text used for deterministic hashing. */
  problemDescription: string;
  /** Classified position on the Complex Plane. */
  planePosition: PlanePosition;
  /** Domains activated during problem solving. */
  domainsActivated: DomainId[];
  /** Primitive IDs used in the solution. */
  primitivesUsed: string[];
  /** Ordered composition steps forming the solution path. */
  compositionPath: CompositionStep[];
  /** Outcome of the verification engine. */
  verificationResult: 'passed' | 'failed' | 'partial' | 'skipped';
  /** User's assessment of the solution quality. */
  userFeedback: 'positive' | 'negative' | 'none';
}

/** The observation feed interface for capture, persistence, and query. */
export interface ObservationFeed {
  /** Record a new observation. Validates, hashes, persists, and returns the full record. */
  record(input: ObservationInput): Promise<MFEObservation>;
  /** Return all observations from the JSONL file. */
  getObservations(): Promise<MFEObservation[]>;
  /** Return observations matching a specific problem hash. */
  getObservationsByHash(hash: string): Promise<MFEObservation[]>;
}

// ============================================================================
// Hash function
// ============================================================================

/**
 * Deterministic djb2 hash producing a lowercase hex string.
 *
 * Not cryptographic — used only for stable problem-type identification.
 * Hashes the problem description concatenated with plane coordinates.
 */
function hashProblem(description: string, position: PlanePosition): string {
  const input = `${description}|${position.real}|${position.imaginary}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

// ============================================================================
// Session ID generation
// ============================================================================

/** Generate a simple UUID-like session identifier. */
function generateSessionId(): string {
  const hex = (): string =>
    Math.floor(Math.random() * 0x10000)
      .toString(16)
      .padStart(4, '0');
  return `${hex()}${hex()}-${hex()}-${hex()}-${hex()}-${hex()}${hex()}${hex()}`;
}

// ============================================================================
// Validation
// ============================================================================

/** Validate an ObservationInput, throwing on any invalid field. */
function validate(input: ObservationInput): void {
  if (!input.domainsActivated || input.domainsActivated.length === 0) {
    throw new Error(
      'Validation failed: domainsActivated must contain at least one domain',
    );
  }
  if (!input.primitivesUsed || input.primitivesUsed.length === 0) {
    throw new Error(
      'Validation failed: primitivesUsed must contain at least one primitive',
    );
  }
  if (!VALID_VERIFICATION_RESULTS.has(input.verificationResult)) {
    throw new Error(
      `Validation failed: verificationResult must be one of ${[...VALID_VERIFICATION_RESULTS].join(', ')} (got "${input.verificationResult}")`,
    );
  }
}

// ============================================================================
// File I/O helpers
// ============================================================================

/** Ensure the parent directory of a file path exists. */
async function ensureDir(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
}

/** Read all lines from a JSONL file, returning parsed objects. */
async function readJsonl<T>(filePath: string): Promise<T[]> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw err;
  }
  const lines = content.trim().split('\n').filter(Boolean);
  return lines.map((line) => JSON.parse(line) as T);
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create an observation feed instance.
 *
 * @param options - Optional configuration (output path, session ID)
 * @returns An ObservationFeed for recording and querying observations
 */
export function createObservationFeed(
  options?: ObservationFeedOptions,
): ObservationFeed {
  const outputPath = options?.outputPath ?? DEFAULT_OUTPUT_PATH;
  const sessionId = options?.sessionId ?? generateSessionId();

  return {
    async record(input: ObservationInput): Promise<MFEObservation> {
      validate(input);

      const observation: MFEObservation = {
        problemHash: hashProblem(input.problemDescription, input.planePosition),
        planePosition: input.planePosition,
        domainsActivated: input.domainsActivated,
        primitivesUsed: input.primitivesUsed,
        compositionPath: input.compositionPath,
        verificationResult: input.verificationResult,
        userFeedback: input.userFeedback,
        timestamp: new Date().toISOString(),
        sessionId,
      };

      await ensureDir(outputPath);
      const json = JSON.stringify(observation);
      await appendFile(outputPath, json + '\n', 'utf-8');

      return observation;
    },

    async getObservations(): Promise<MFEObservation[]> {
      return readJsonl<MFEObservation>(outputPath);
    },

    async getObservationsByHash(hash: string): Promise<MFEObservation[]> {
      const all = await readJsonl<MFEObservation>(outputPath);
      return all.filter((obs) => obs.problemHash === hash);
    },
  };
}
