/**
 * Shared type definitions for the dogfood learning pipeline.
 * Used across ingest controller, concept detector, position mapper,
 * cross-referencer, and track runner modules.
 */

// --- Constants ---

/** @justification Type: Accepted heuristic. 100K tokens provides ~50 pages of
 * context for pattern learning -- sufficient for corpus analysis without exhausting
 * model context windows. Balances thoroughness against API cost. */
export const DEFAULT_TOKEN_BUDGET = 100_000;

/** Starting radius for newly detected concepts on the complex plane */
export const INITIAL_RADIUS = 0.1;

/** Maximum angular velocity for position updates (bounded learning) */
export const MAX_ANGULAR_VELOCITY = 0.2;

/**
 * Part-to-angular-region mapping.
 * Maps part number (1-10) to base theta value on the complex plane.
 */
export const PART_ANGULAR_REGIONS: Record<number, number> = {
  1: 0,                    // Part I: Seeing
  2: Math.PI / 8,          // Part II: Hearing
  3: Math.PI / 4,          // Part III: Moving
  4: (3 * Math.PI) / 8,    // Part IV: Expanding
  5: Math.PI / 2,          // Part V: Grounding
  6: (5 * Math.PI) / 8,    // Part VI: Defining
  7: (3 * Math.PI) / 4,    // Part VII: Mapping
  8: (7 * Math.PI) / 8,    // Part VIII: Converging
  9: Math.PI,              // Part IX: Growing
  10: (9 * Math.PI) / 8,   // Part X: Being
};

// --- Interfaces ---

/** Input chunk from the extraction manifest (.jsonl) */
export interface ChunkInput {
  id: string;
  part: number;
  chapter: number;
  section: string;
  text: string;
  contentType: string;
  mathDensity: number;
  wordCount: number;
  estimatedTokens: number;
  crossRefs: string[];
}

/** Error encountered during ingestion */
export interface IngestionError {
  chunkId: string;
  chapter: number;
  message: string;
  severity: 'warning' | 'error';
  timestamp: string;
}

/** Master state for the ingestion pipeline */
export interface IngestionState {
  currentPart: number;
  currentChapter: number;
  currentChunk: string;
  totalChunksProcessed: number;
  totalConceptsLearned: number;
  checkpoint: string;
  tokenBudgetUsed: number;
  tokenBudgetRemaining: number;
  errors: IngestionError[];
  startedAt: string;
  lastActivity: string;
}

/** A concept learned from textbook content */
export interface LearnedConcept {
  id: string;
  name: string;
  sourceChunk: string;
  sourceChapter: number;
  sourcePart: number;
  theta: number;
  radius: number;
  angularVelocity: number;
  definition: string;
  keyRelationships: string[];
  prerequisites: string[];
  applications: string[];
  ecosystemMappings: EcosystemMapping[];
  confidence: number;
  mathDensity: number;
  abstractionLevel: number;
  detectedAt: string;
}

/** Mapping between a concept and an ecosystem document */
export interface EcosystemMapping {
  document: string;
  section: string;
  relationship: 'identical' | 'extends' | 'contradicts' | 'refines' | 'new';
  notes: string;
}

/** Result of concept detection on a single chunk */
export interface ConceptDetectionResult {
  concepts: LearnedConcept[];
  garbledChunks: string[];
  processingNotes: string[];
}

/** Position assignment on the complex plane */
export interface PositionAssignment {
  theta: number;
  radius: number;
  angularVelocity: number;
  abstractionLevel: number;
}

// --- Function type signatures (for dependency injection) ---

/** Detect function signature injected into ingest controller */
export type DetectFn = (chunk: ChunkInput, priorConcepts: LearnedConcept[]) => ConceptDetectionResult;

/** Position function signature injected into ingest controller */
export type PositionFn = (concept: LearnedConcept, existingPositions: Map<string, PositionAssignment>) => PositionAssignment;
