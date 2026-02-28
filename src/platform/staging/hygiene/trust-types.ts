/**
 * Trust tier types for hygiene familiarity classification.
 *
 * Defines the four-tier trust model (Home, Neighborhood, Town, Stranger)
 * for classifying content sources by familiarity level. Also defines
 * critical pattern IDs that must never be auto-approved.
 *
 * @module staging/hygiene/trust-types
 */

/** Familiarity tiers from most trusted to least trusted. */
export type FamiliarityTier = 'home' | 'neighborhood' | 'town' | 'stranger';

/** All familiarity tiers as a const tuple for runtime use. */
export const FAMILIARITY_TIERS = ['home', 'neighborhood', 'town', 'stranger'] as const;

/** Source metadata used for familiarity classification. */
export interface ContentSourceInfo {
  /** Where content originated (e.g., 'local-project', 'local-user', 'known-repo', 'external', 'unknown'). */
  origin: string;
  /** Whether content comes from current project's own files. */
  isProjectLocal?: boolean;
  /** Whether content comes from user's own machine (~/ paths). */
  isUserLocal?: boolean;
  /** Repository URL or identifier if from a known repo. */
  repoId?: string;
  /** List of known/trusted repo identifiers for Neighborhood tier. */
  trustedRepos?: string[];
}

/** Result of familiarity classification. */
export interface TrustClassification {
  /** Assigned familiarity tier. */
  tier: FamiliarityTier;
  /** Reason for classification. */
  reason: string;
}

/**
 * Pattern IDs that are considered critical and must NEVER auto-approve.
 * Per HYGIENE-11: YAML code execution, path traversal, prompt overrides.
 */
export const CRITICAL_PATTERN_IDS: ReadonlySet<string> = new Set([
  'yaml-code-execution',
  'path-traversal',
  'ignore-previous',
  'system-prompt-override',
  'chat-template-delimiters',
]);
