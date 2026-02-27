/**
 * Types for the learn-to-observe bridge (Phase 407).
 *
 * These types define the shape of observations produced by converting
 * KnowledgeGraph entries into SessionObserver-compatible records.
 * LearnedObservations are DISTINCT from SessionObservations — they
 * carry source "sc:learn" and include provenance chains.
 */

/** Discriminant for the three categories of learned observations. */
export type LearnedObservationType =
  | "learned-concept"
  | "learned-pattern"
  | "learned-decision-model";

/** Full provenance chain tracing an observation back to its source. */
export interface ProvenanceChain {
  githubUrl: string;
  filePath: string;
  extractionMethod: string;
  observationId: string;
}

/** A single observation record produced by the learn-to-observe bridge. */
export interface LearnedObservation {
  id: string;
  type: LearnedObservationType;
  source: string;
  pattern: Record<string, unknown>;
  confidence: number;
  provenance: ProvenanceChain;
  timestamp: string;
}

/** Aggregate result returned by bridgeToObservations. */
export interface BridgeResult {
  observations: LearnedObservation[];
  stats: {
    concepts: number;
    patterns: number;
    decisionModels: number;
    totalObservations: number;
  };
}

/** Options for configuring the bridge. */
export interface BridgeOptions {
  githubUrl?: string;
}
