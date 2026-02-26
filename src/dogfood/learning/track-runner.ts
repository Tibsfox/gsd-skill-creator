/**
 * Track runner — orchestrates ingestion pipeline for a track (set of parts).
 * Track A covers Parts I-V, Track B covers Parts VI-X.
 * Each track runs independently with its own token budget.
 */

import type {
  ChunkInput,
  IngestionState,
  IngestionError,
  LearnedConcept,
} from './types.js';
import { DEFAULT_TOKEN_BUDGET } from './types.js';
import { createIngestController } from './ingest-controller.js';
import { detectConcepts } from './concept-detector.js';
import { assignPosition } from './position-mapper.js';
import {
  crossReference,
  buildDefaultEcosystemIndex,
  type EcosystemDocIndex,
} from './cross-referencer.js';

/** Result from a track run */
export interface TrackResult {
  concepts: LearnedConcept[];
  state: IngestionState;
  errors: IngestionError[];
  chaptersProcessed: number[];
}

/**
 * Shared track execution logic.
 * Filters chunks to the given part range, runs the ingest pipeline,
 * applies cross-referencing, and fires checkpoints at chapter boundaries.
 */
async function runTrack(
  partRange: [number, number],
  config: {
    manifest: ChunkInput[];
    ecosystemIndex: EcosystemDocIndex;
    tokenBudget?: number;
    onCheckpoint?: (state: IngestionState) => void;
  },
): Promise<TrackResult> {
  const budget = config.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
  const controller = createIngestController({ partRange, tokenBudget: budget });

  // Wrap detectConcepts + crossReference into the pipeline
  const wrappedDetect = (chunk: ChunkInput, prior: LearnedConcept[]) => {
    const result = detectConcepts(chunk, prior);
    // Apply cross-referencing to each detected concept
    for (const concept of result.concepts) {
      concept.ecosystemMappings = crossReference(concept, config.ecosystemIndex);
    }
    return result;
  };

  // Wrap assignPosition to match the PositionFn signature
  const wrappedPosition = (concept: LearnedConcept, _existing: Map<string, import('./types.js').PositionAssignment>) => {
    return assignPosition(concept, concept.sourcePart);
  };

  // Track chapter boundaries for checkpoint callbacks
  let lastChapter = -1;
  const chaptersProcessed = new Set<number>();

  // Filter manifest to our part range for chapter tracking
  const [minPart, maxPart] = partRange;
  const relevantChunks = config.manifest.filter(
    c => c.part >= minPart && c.part <= maxPart,
  );
  relevantChunks.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));

  // Process through the ingest controller
  const { concepts, state } = await controller.processManifest(
    config.manifest,
    wrappedDetect,
    wrappedPosition,
  );

  // Determine which chapters were processed
  for (const concept of concepts) {
    chaptersProcessed.add(concept.sourceChapter);
  }

  // Also mark chapters from processed chunks (even if no concepts detected)
  for (const chunk of relevantChunks) {
    if (state.tokenBudgetUsed > 0) {
      chaptersProcessed.add(chunk.chapter);
      // Fire checkpoint at chapter boundaries
      if (chunk.chapter !== lastChapter && lastChapter !== -1) {
        config.onCheckpoint?.(controller.getState());
      }
      lastChapter = chunk.chapter;
    }
  }

  const sortedChapters = Array.from(chaptersProcessed).sort((a, b) => a - b);

  return {
    concepts,
    state,
    errors: state.errors,
    chaptersProcessed: sortedChapters,
  };
}

/**
 * Run Track A: Parts I-V (chapters 1-17).
 * Perception, waves, calculus, linear algebra, probability.
 */
export async function runTrackA(config: {
  manifest: ChunkInput[];
  ecosystemIndex: EcosystemDocIndex;
  tokenBudget?: number;
  onCheckpoint?: (state: IngestionState) => void;
}): Promise<TrackResult> {
  return runTrack([1, 5], config);
}

/**
 * Run Track B: Parts VI-X (chapters 18-33).
 * Set theory, category theory, information theory, fractals, physics.
 */
export async function runTrackB(config: {
  manifest: ChunkInput[];
  ecosystemIndex: EcosystemDocIndex;
  tokenBudget?: number;
  onCheckpoint?: (state: IngestionState) => void;
}): Promise<TrackResult> {
  return runTrack([6, 10], config);
}
