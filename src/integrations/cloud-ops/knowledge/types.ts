/**
 * Types for the 3-tier knowledge loader.
 *
 * The knowledge system organizes cloud-ops documentation into three tiers:
 * - **summary** -- always-loaded context (<2s, 6K tokens)
 * - **active** -- on-demand context for current work (<5s, 20K tokens)
 * - **reference** -- deep-dive documents loaded by ID (<10s, 40K tokens)
 *
 * @module cloud-ops/knowledge/types
 */

// ============================================================================
// Tier Definitions
// ============================================================================

/** The three knowledge tiers. */
export type KnowledgeTier = 'summary' | 'active' | 'reference';

/** Configuration for a single knowledge tier. */
export interface TierConfig {
  /** Which tier this config applies to. */
  tier: KnowledgeTier;
  /** Maximum token budget for this tier. */
  maxTokens: number;
  /** Timeout in milliseconds for loading this tier. */
  timeoutMs: number;
  /** File paths or glob patterns for documents in this tier. */
  paths: string[];
}

// ============================================================================
// Load Results
// ============================================================================

/** A single loaded document. */
export interface TierDocument {
  /** File path relative to the tier directory. */
  path: string;
  /** Document content as a string. */
  content: string;
  /** Size of the document in bytes. */
  sizeBytes: number;
}

/** Content loaded from a knowledge tier. */
export interface TierContent {
  /** Which tier this content came from. */
  tier: KnowledgeTier;
  /** Loaded documents. */
  documents: TierDocument[];
  /** Estimated total token count (chars / 4). */
  totalTokens: number;
  /** Time taken to load in milliseconds. */
  loadTimeMs: number;
}

/** Result of a tier load operation with error handling. */
export interface TierLoadResult {
  /** Whether the load succeeded. */
  success: boolean;
  /** Loaded content (present when success is true). */
  content?: TierContent;
  /** Error message (present when success is false). */
  error?: string;
}

// ============================================================================
// Default Configuration
// ============================================================================

/** Default tier configurations with performance budgets. */
export const TIER_DEFAULTS: Record<KnowledgeTier, { maxTokens: number; timeoutMs: number }> = {
  /** Summary: always-loaded, must complete in <2 seconds. */
  summary: { maxTokens: 6000, timeoutMs: 2000 },
  /** Active: on-demand, must complete in <5 seconds. */
  active: { maxTokens: 20000, timeoutMs: 5000 },
  /** Reference: deep dives, 10-second budget. */
  reference: { maxTokens: 40000, timeoutMs: 10000 },
} as const;
