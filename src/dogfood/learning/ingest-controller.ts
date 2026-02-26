/**
 * Ingest controller — sequences chunks from manifest in chapter order,
 * tracks token budget, and delegates to injected detect/position functions.
 */

import type {
  ChunkInput,
  IngestionState,
  IngestionError,
  LearnedConcept,
  PositionAssignment,
  DetectFn,
  PositionFn,
} from './types.js';

export interface IngestController {
  processManifest(
    chunks: ChunkInput[],
    detect: DetectFn,
    position: PositionFn,
  ): Promise<{ concepts: LearnedConcept[]; state: IngestionState }>;
  getState(): IngestionState;
}

/**
 * Create an ingest controller that filters chunks to the given part range,
 * sequences them by chapter, and processes within the token budget.
 */
export function createIngestController(config: {
  partRange: [number, number];
  tokenBudget: number;
}): IngestController {
  const [minPart, maxPart] = config.partRange;

  let state: IngestionState = {
    currentPart: minPart,
    currentChapter: 0,
    currentChunk: '',
    totalChunksProcessed: 0,
    totalConceptsLearned: 0,
    checkpoint: '',
    tokenBudgetUsed: 0,
    tokenBudgetRemaining: config.tokenBudget,
    errors: [],
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
  };

  return {
    async processManifest(
      chunks: ChunkInput[],
      detect: DetectFn,
      position: PositionFn,
    ): Promise<{ concepts: LearnedConcept[]; state: IngestionState }> {
      // Filter to part range
      const filtered = chunks.filter(
        c => c.part >= minPart && c.part <= maxPart,
      );

      // Sort by chapter then sequence within chapter
      filtered.sort((a, b) => a.chapter - b.chapter || a.id.localeCompare(b.id));

      const allConcepts: LearnedConcept[] = [];
      const positionMap = new Map<string, PositionAssignment>();

      for (const chunk of filtered) {
        // Check budget before processing
        if (state.tokenBudgetRemaining <= 0) {
          break;
        }

        // Don't exceed budget
        const tokensForChunk = chunk.estimatedTokens;
        if (tokensForChunk > state.tokenBudgetRemaining) {
          break;
        }

        state.currentPart = chunk.part;
        state.currentChapter = chunk.chapter;
        state.currentChunk = chunk.id;
        state.lastActivity = new Date().toISOString();

        try {
          const result = detect(chunk, allConcepts);

          for (const concept of result.concepts) {
            const pos = position(concept, positionMap);
            concept.theta = pos.theta;
            concept.radius = pos.radius;
            concept.angularVelocity = pos.angularVelocity;
            concept.abstractionLevel = pos.abstractionLevel;
            positionMap.set(concept.name.toLowerCase(), pos);
            allConcepts.push(concept);
          }

          state.totalChunksProcessed++;
          state.totalConceptsLearned = allConcepts.length;
          state.tokenBudgetUsed += tokensForChunk;
          state.tokenBudgetRemaining -= tokensForChunk;
          state.checkpoint = `chapter-${chunk.chapter}`;
        } catch (err) {
          const error: IngestionError = {
            chunkId: chunk.id,
            chapter: chunk.chapter,
            message: err instanceof Error ? err.message : String(err),
            severity: 'warning',
            timestamp: new Date().toISOString(),
          };
          state.errors.push(error);
        }
      }

      state.totalConceptsLearned = allConcepts.length;
      return { concepts: allConcepts, state };
    },

    getState(): IngestionState {
      return { ...state };
    },
  };
}
