import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createIngestController } from '../../../../src/packs/dogfood/learning/ingest-controller.js';
import type {
  ChunkInput,
  ConceptDetectionResult,
  LearnedConcept,
  PositionAssignment,
  DetectFn,
  PositionFn,
} from '../../../../src/packs/dogfood/learning/types.js';
import { DEFAULT_TOKEN_BUDGET, INITIAL_RADIUS } from '../../../../src/packs/dogfood/learning/types.js';

// --- Factories ---

function makeChunk(overrides: Partial<ChunkInput> = {}): ChunkInput {
  return {
    id: 'chunk-01',
    part: 1,
    chapter: 1,
    section: 'introduction',
    text: 'Some mathematical content here.',
    contentType: 'prose',
    mathDensity: 0.3,
    wordCount: 50,
    estimatedTokens: 100,
    crossRefs: [],
    ...overrides,
  };
}

function makeConcept(overrides: Partial<LearnedConcept> = {}): LearnedConcept {
  return {
    id: '1-0-test-concept',
    name: 'Test Concept',
    sourceChunk: 'chunk-01',
    sourceChapter: 1,
    sourcePart: 1,
    theta: 0,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    definition: 'A test concept.',
    keyRelationships: [],
    prerequisites: [],
    applications: [],
    ecosystemMappings: [],
    confidence: 0.85,
    mathDensity: 0.3,
    abstractionLevel: 0,
    detectedAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeDetectFn(concepts: LearnedConcept[] = []): DetectFn {
  return (_chunk: ChunkInput, _prior: LearnedConcept[]): ConceptDetectionResult => ({
    concepts: concepts.length > 0 ? concepts : [makeConcept({ sourceChunk: _chunk.id, sourceChapter: _chunk.chapter, sourcePart: _chunk.part })],
    garbledChunks: [],
    processingNotes: [],
  });
}

function makePositionFn(): PositionFn {
  return (_concept: LearnedConcept, _existing: Map<string, PositionAssignment>): PositionAssignment => ({
    theta: 0,
    radius: INITIAL_RADIUS,
    angularVelocity: 0,
    abstractionLevel: 0,
  });
}

describe('IngestController', () => {
  let detect: DetectFn;
  let position: PositionFn;

  beforeEach(() => {
    detect = makeDetectFn();
    position = makePositionFn();
  });

  it('sequences chunks in chapter order from manifest', async () => {
    const chunks = [
      makeChunk({ id: 'c3', part: 1, chapter: 3, section: 'a' }),
      makeChunk({ id: 'c1', part: 1, chapter: 1, section: 'a' }),
      makeChunk({ id: 'c2', part: 1, chapter: 2, section: 'a' }),
    ];
    const processedOrder: string[] = [];
    const trackingDetect: DetectFn = (chunk, prior) => {
      processedOrder.push(chunk.id);
      return detect(chunk, prior);
    };

    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    await controller.processManifest(chunks, trackingDetect, position);

    expect(processedOrder).toEqual(['c1', 'c2', 'c3']);
  });

  it('tracks token budget and refuses chunks when budget exhausted', async () => {
    const chunks = [
      makeChunk({ id: 'c1', estimatedTokens: 60_000 }),
      makeChunk({ id: 'c2', estimatedTokens: 60_000 }),
    ];
    const controller = createIngestController({ partRange: [1, 5], tokenBudget: 100_000 });
    const result = await controller.processManifest(chunks, detect, position);
    const state = result.state;

    // First chunk accepted (60K), second exceeds budget (120K > 100K)
    expect(state.totalChunksProcessed).toBe(1);
    expect(state.tokenBudgetUsed).toBe(60_000);
    expect(state.errors.some(e => e.message.includes('budget'))).toBe(true);
  });

  it('updates IngestionState after each chunk', async () => {
    const chunks = [
      makeChunk({ id: 'c1', estimatedTokens: 200 }),
      makeChunk({ id: 'c2', estimatedTokens: 300 }),
    ];
    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    const result = await controller.processManifest(chunks, detect, position);
    const state = result.state;

    expect(state.totalChunksProcessed).toBe(2);
    expect(state.tokenBudgetUsed).toBe(500);
    expect(state.tokenBudgetRemaining).toBe(DEFAULT_TOKEN_BUDGET - 500);
  });

  it('handles empty manifest gracefully', async () => {
    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    const result = await controller.processManifest([], detect, position);

    expect(result.concepts).toEqual([]);
    expect(result.state.totalChunksProcessed).toBe(0);
    expect(result.state.totalConceptsLearned).toBe(0);
  });

  it('skips chunks outside requested part range', async () => {
    const chunks = [
      makeChunk({ id: 'c1', part: 1, chapter: 1 }),
      makeChunk({ id: 'c6', part: 6, chapter: 18 }),
      makeChunk({ id: 'c3', part: 3, chapter: 8 }),
    ];
    const processedIds: string[] = [];
    const trackingDetect: DetectFn = (chunk, prior) => {
      processedIds.push(chunk.id);
      return detect(chunk, prior);
    };

    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    await controller.processManifest(chunks, trackingDetect, position);

    expect(processedIds).toContain('c1');
    expect(processedIds).toContain('c3');
    expect(processedIds).not.toContain('c6');
  });

  it('records IngestionError for failed chunks and continues', async () => {
    const chunks = [
      makeChunk({ id: 'c1', chapter: 1 }),
      makeChunk({ id: 'c2', chapter: 2 }),
      makeChunk({ id: 'c3', chapter: 3 }),
    ];
    let callCount = 0;
    const failOnSecond: DetectFn = (chunk, prior) => {
      callCount++;
      if (callCount === 2) throw new Error('Detection failed');
      return detect(chunk, prior);
    };

    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    const result = await controller.processManifest(chunks, failOnSecond, position);

    // All 3 chunks attempted, 2 succeeded, 1 errored
    expect(result.state.totalChunksProcessed).toBe(2);
    expect(result.state.errors).toHaveLength(1);
    expect(result.state.errors[0].chunkId).toBe('c2');
    expect(result.state.errors[0].severity).toBe('error');
  });

  it('reports lastActivity timestamp after each chunk', async () => {
    const chunks = [makeChunk({ id: 'c1' })];
    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    const before = new Date().toISOString();
    const result = await controller.processManifest(chunks, detect, position);
    const after = new Date().toISOString();

    expect(result.state.lastActivity >= before).toBe(true);
    expect(result.state.lastActivity <= after).toBe(true);
  });

  it('provides checkpoint ID matching last processed chunk', async () => {
    const chunks = [
      makeChunk({ id: 'c1', chapter: 1 }),
      makeChunk({ id: 'c2', chapter: 2 }),
    ];
    const controller = createIngestController({ partRange: [1, 5], tokenBudget: DEFAULT_TOKEN_BUDGET });
    const result = await controller.processManifest(chunks, detect, position);

    expect(result.state.checkpoint).toBe('c2');
  });
});
