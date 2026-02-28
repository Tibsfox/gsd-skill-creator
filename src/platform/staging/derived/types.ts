/**
 * Type definitions for derived knowledge checking.
 *
 * Defines familiarity tiers, provenance chain structures, and
 * result types for all derived knowledge checks.
 *
 * @module staging/derived/types
 */

/** Familiarity tier indicating how close an artifact is to direct observation. */
export type FamiliarityTier = 'home' | 'neighborhood' | 'town' | 'stranger';

/**
 * Ordered familiarity tiers from most to least familiar.
 * Index position determines relative familiarity for comparison.
 */
export const FAMILIARITY_TIERS = [
  'home',
  'neighborhood',
  'town',
  'stranger',
] as const;

/** Severity levels for derived knowledge check findings. */
export type DerivedCheckSeverity = 'critical' | 'warning' | 'info';

/** All derived check severities as a const array for runtime use. */
export const DERIVED_CHECK_SEVERITIES = [
  'critical',
  'warning',
  'info',
] as const;

/**
 * A node in a provenance chain representing one artifact.
 */
export interface ProvenanceNode {
  /** Unique artifact identifier. */
  artifactId: string;
  /** Type of artifact (observation, pattern, candidate, script, etc.). */
  artifactType: string;
  /** Familiarity tier of this artifact. */
  tier: FamiliarityTier;
  /** Artifact ID of the upstream parent, null for root nodes. */
  parent: string | null;
  /** Pass-through metadata from the LineageEntry. */
  metadata: Record<string, unknown>;
}

/**
 * A provenance chain tracing a derived artifact back to its sources.
 * Nodes are ordered root-first, leaf-last.
 */
export interface ProvenanceChain {
  /** The target artifact being traced. */
  artifactId: string;
  /** Provenance nodes ordered root-first, leaf-last. */
  nodes: ProvenanceNode[];
  /** The least familiar tier found in the chain (computed). */
  inheritedTier: FamiliarityTier;
}

/**
 * A finding where skill content has no backing observation (phantom knowledge).
 */
export interface PhantomFinding {
  /** Finding type discriminant. */
  type: 'phantom';
  /** Severity of this finding. */
  severity: DerivedCheckSeverity;
  /** Human-readable description. */
  message: string;
  /** The phantom content that has no observation backing. */
  contentSnippet: string;
  /** What was actually observed, for comparison. */
  observedPatterns: string[];
}

/**
 * A finding where a skill's scope drifts beyond what observations support.
 */
export interface ScopeDriftFinding {
  /** Finding type discriminant. */
  type: 'scope-drift';
  /** Severity of this finding. */
  severity: DerivedCheckSeverity;
  /** Human-readable description. */
  message: string;
  /** What the skill claims to cover. */
  skillScope: string[];
  /** What observations actually support. */
  observedScope: string[];
  /** Ratio of unsupported scope items (0-1). */
  driftRatio: number;
}

/**
 * A finding where training pair coherence is questionable.
 */
export interface CoherenceFinding {
  /** Finding type discriminant. */
  type: 'coherence';
  /** Severity of this finding. */
  severity: DerivedCheckSeverity;
  /** Human-readable description. */
  message: string;
  /** Which training pair has the anomaly. */
  pairIndex: number;
  /** Type of coherence anomaly detected. */
  anomalyType: 'outlier-length' | 'outlier-similarity' | 'format-mismatch';
  /** Additional details about the anomaly. */
  details: string;
}

/**
 * A finding where derived content appears to be directly copied from source.
 */
export interface CopyingFinding {
  /** Finding type discriminant. */
  type: 'copying';
  /** Severity of this finding. */
  severity: DerivedCheckSeverity;
  /** Human-readable description. */
  message: string;
  /** Textual similarity score (0-1). */
  similarity: number;
  /** The text that appears copied. */
  matchedSnippet: string;
  /** Where the content might be from, if detectable. */
  sourceHint: string;
}

/**
 * Aggregated result of all derived knowledge checks for one artifact.
 */
export interface DerivedCheckResult {
  /** The artifact that was checked. */
  artifactId: string;
  /** Provenance chain for the artifact. */
  provenance: ProvenanceChain;
  /** Phantom knowledge findings. */
  phantomFindings: PhantomFinding[];
  /** Scope drift findings. */
  scopeDriftFindings: ScopeDriftFinding[];
  /** Coherence findings. */
  coherenceFindings: CoherenceFinding[];
  /** Copying findings. */
  copyingFindings: CopyingFinding[];
  /** True if no critical or warning findings exist. */
  passed: boolean;
}
