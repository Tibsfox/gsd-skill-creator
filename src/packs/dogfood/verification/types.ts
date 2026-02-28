/**
 * Shared type definitions for the dogfood verification engine.
 * Used across knowledge-differ, gap-classifier, coverage-mapper,
 * consistency-checker, eight-layer-verifier, and gap-report-generator.
 */

// --- Gap Type Taxonomy (8 types) ---

export type GapType =
  | 'missing-in-ecosystem'
  | 'missing-in-textbook'
  | 'inconsistent'
  | 'outdated'
  | 'incomplete'
  | 'differently-expressed'
  | 'new-connection'
  | 'verified';

export const GAP_TYPES: GapType[] = [
  'missing-in-ecosystem',
  'missing-in-textbook',
  'inconsistent',
  'outdated',
  'incomplete',
  'differently-expressed',
  'new-connection',
  'verified',
] as const;

// --- Gap Severity Levels ---

export type GapSeverity = 'critical' | 'significant' | 'minor' | 'informational';

export const GAP_SEVERITIES: GapSeverity[] = [
  'critical',
  'significant',
  'minor',
  'informational',
] as const;

// --- Core Interfaces ---

/** A single gap record produced by the verification engine */
export interface GapRecord {
  id: string;
  type: GapType;
  severity: GapSeverity;
  concept: string;
  textbookSource: string;
  ecosystemSource: string;
  textbookClaim: string;
  ecosystemClaim: string;
  analysis: string;
  suggestedResolution: string;
  affectsComponents: string[];
}

/** A single extractable claim from an ecosystem document */
export interface EcosystemClaim {
  document: string;
  section: string;
  claim: string;
  keywords: string[];
  mathDomain: string;
}

/** A document within the ecosystem corpus */
export interface EcosystemDocument {
  name: string;
  sections: Array<{ title: string; content: string; keywords: string[] }>;
}

/** The full ecosystem corpus: documents and extracted claims */
export interface EcosystemCorpus {
  documents: EcosystemDocument[];
  claims: EcosystemClaim[];
}

/**
 * Lightweight reference to a LearnedConcept.
 * Contains only fields needed for verification, keeping the
 * verification engine self-contained (no learning module imports).
 */
export interface LearnedConceptRef {
  id: string;
  name: string;
  definition: string;
  sourceChapter: number;
  sourcePart: number;
  keywords: string[];
  confidence: number;
  radius: number;
}

// --- Result Interfaces ---

/** Result of bidirectional diff between concepts and ecosystem claims */
export interface DiffResult {
  matched: Array<{ concept: LearnedConceptRef; claim: EcosystemClaim; similarity: number }>;
  unmatchedConcepts: LearnedConceptRef[];
  unmatchedClaims: EcosystemClaim[];
}

/** Result of coverage mapping between concepts and ecosystem */
export interface CoverageResult {
  conceptToEcosystem: Map<string, EcosystemClaim[]>;
  ecosystemToConcept: Map<string, LearnedConceptRef[]>;
  uncoveredConcepts: LearnedConceptRef[];
  uncoveredClaims: EcosystemClaim[];
}

/** Statistics about gap distribution */
export interface GapStatistics {
  total: number;
  byType: Record<GapType, number>;
  bySeverity: Record<GapSeverity, number>;
  byDocument: Record<string, number>;
}

/** Full verification result with gaps and statistics */
export interface VerificationResult {
  gaps: GapRecord[];
  statistics: GapStatistics;
}
