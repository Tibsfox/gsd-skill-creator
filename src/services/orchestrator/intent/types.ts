/**
 * Type definitions for the intent classification module.
 *
 * Defines Zod schemas and inferred TypeScript types for:
 * - ClassificationResult (output of the classification pipeline)
 * - ExtractedArguments (parsed arguments from user input)
 * - LifecycleStage (project lifecycle state for context filtering)
 * - ClassifierConfig (tuning parameters for classification thresholds)
 *
 * All schemas use .passthrough() for forward compatibility.
 * GsdCommandMetadata is referenced as z.any().nullable() in schemas
 * (already validated at discovery time) with proper TypeScript typing.
 */

import { z } from 'zod';
import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Extracted Arguments
// ============================================================================

/**
 * Zod schema for extracted arguments from user input.
 *
 * Captures structured argument components parsed from the raw
 * argument string (everything after the command name).
 */
export const ExtractedArgumentsSchema = z.object({
  /** Phase number string (e.g., "3", "37.1") */
  phaseNumber: z.string().nullable(),
  /** Flag arguments (e.g., ["--research", "--gaps-only"]) */
  flags: z.array(z.string()),
  /** Free-text description */
  description: z.string().nullable(),
  /** Version string (e.g., "v1.7") */
  version: z.string().nullable(),
  /** Profile name (e.g., "quality", "balanced", "budget") */
  profile: z.string().nullable(),
  /** Original unprocessed argument string */
  raw: z.string(),
}).passthrough();

export type ExtractedArguments = z.infer<typeof ExtractedArgumentsSchema>;

// ============================================================================
// Lifecycle Stage
// ============================================================================

/**
 * Zod schema for project lifecycle stages.
 *
 * Determines which commands are contextually relevant based on
 * where the project currently is in the GSD workflow.
 */
export const LifecycleStageSchema = z.enum([
  'uninitialized',
  'initialized',
  'roadmapped',
  'planning',
  'executing',
  'verifying',
  'between-phases',
  'milestone-end',
]);

export type LifecycleStage = z.infer<typeof LifecycleStageSchema>;

// ============================================================================
// Classification Result
// ============================================================================

/**
 * Zod schema for classification pipeline output.
 *
 * The command field uses z.any().nullable() because GsdCommandMetadata
 * is already validated at discovery time. TypeScript type override
 * provides proper typing for consumers.
 */
export const ClassificationResultSchema = z.object({
  /** How the classification was determined */
  type: z.enum(['exact-match', 'classified', 'ambiguous', 'no-match']),
  /** Matched command metadata, or null if no match */
  command: z.any().nullable(),
  /** Confidence score normalized to 0-1 */
  confidence: z.number().min(0).max(1),
  /** Extracted arguments from user input */
  arguments: ExtractedArgumentsSchema,
  /** Alternative candidate commands with confidence scores */
  alternatives: z.array(z.object({
    command: z.any(),
    confidence: z.number(),
  })),
  /** Current project lifecycle stage, if determined */
  lifecycleStage: LifecycleStageSchema.nullable(),
}).passthrough();

/** Classification result with proper GsdCommandMetadata typing */
export interface ClassificationResult {
  type: 'exact-match' | 'classified' | 'ambiguous' | 'no-match';
  command: GsdCommandMetadata | null;
  confidence: number;
  arguments: ExtractedArguments;
  alternatives: Array<{ command: GsdCommandMetadata; confidence: number }>;
  lifecycleStage: LifecycleStage | null;
  /** Classification method: 'exact' for explicit /gsd: prefix, 'bayes' for NL, 'semantic' for embedding fallback */
  method?: 'bayes' | 'semantic' | 'exact';
  [key: string]: unknown;
}

// ============================================================================
// Classifier Config
// ============================================================================

/**
 * Zod schema for classifier tuning parameters.
 *
 * All fields have defaults so partial configs work via .parse({}).
 */
export const ClassifierConfigSchema = z.object({
  /** Absolute minimum confidence for auto-routing (default 0.5) */
  confidenceThreshold: z.number().min(0).max(1).default(0.5),
  /** Minimum gap between top-1 and top-2 for unambiguous match (default 0.15) */
  ambiguityGap: z.number().min(0).max(1).default(0.15),
  /** Maximum alternative candidates for ambiguous results (default 3) */
  maxAlternatives: z.number().int().min(1).default(3),
  /** Minimum cosine similarity for semantic fallback to replace weak Bayes result (default 0.65) */
  semanticThreshold: z.number().min(0).max(1).default(0.65),
  /** Enable semantic embedding fallback when available (default true) */
  enableSemantic: z.boolean().default(true),
}).passthrough();

export type ClassifierConfig = z.infer<typeof ClassifierConfigSchema>;
