import { describe, it, expect } from 'vitest';
import {
  generateManifest,
  extractExercises,
} from '../../../../src/dogfood/extraction/manifest-generator.js';
import type { ChapterMap, PartMap } from '../../../../src/dogfood/extraction/types.js';

// --- Factories ---

function createTestParts(): PartMap[] {
  return [
    { partNumber: 1, title: 'Seeing', startPage: 1, endPage: 90, chapters: [1, 2, 3] },
    { partNumber: 2, title: 'Hearing', startPage: 91, endPage: 180, chapters: [4, 5] },
  ];
}

function createTestChapters(): ChapterMap[] {
  return [
    {
      chapterNumber: 1,
      title: 'Counting',
      partNumber: 1,
      startPage: 2,
      endPage: 30,
      rawText: [
        '1.1 Natural Numbers',
        '',
        'The natural numbers are 1, 2, 3, and so on. They form the basis of counting.',
        'Every natural number has a successor.',
        '',
        '1.2 Addition',
        '',
        'Addition combines two numbers into their sum. This operation is commutative.',
        '',
        'Exercises',
        '',
        '1. Compute 2 + 3.',
        '2. Prove that addition is associative.',
        '3. *Challenge: Show the sum of first n odd numbers equals n squared.',
      ].join('\n'),
    },
    {
      chapterNumber: 2,
      title: 'Measuring',
      partNumber: 1,
      startPage: 31,
      endPage: 60,
      rawText: [
        '2.1 Length',
        '',
        'Measurement assigns numerical values to physical quantities.',
        'Length is the most basic measurement.',
      ].join('\n'),
    },
    {
      chapterNumber: 3,
      title: 'Seeing',
      partNumber: 1,
      startPage: 61,
      endPage: 90,
      rawText: 'Vision relies on light. See Chapter 1 and Chapter 2 for background.',
    },
  ];
}

const defaultConfig = { maxChunkTokens: 8000 };

describe('generateManifest', () => {
  describe('manifest generation', () => {
    it('produces TextChunk[] ordered by sequenceIndex', () => {
      const { chunks } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);

      expect(chunks.length).toBeGreaterThan(0);

      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].sequenceIndex).toBeGreaterThan(chunks[i - 1].sequenceIndex);
      }
    });

    it('each chunk has all required TextChunk fields populated', () => {
      const { chunks } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);

      for (const chunk of chunks) {
        expect(chunk.id).toBeTruthy();
        expect(chunk.part).toBeGreaterThan(0);
        expect(chunk.partTitle).toBeTruthy();
        expect(chunk.chapter).toBeGreaterThan(0);
        expect(chunk.chapterTitle).toBeTruthy();
        expect(chunk.contentType).toBeTruthy();
        expect(chunk.text).toBeTruthy();
        expect(Array.isArray(chunk.mathExpressions)).toBe(true);
        expect(Array.isArray(chunk.diagrams)).toBe(true);
        expect(chunk.wordCount).toBeGreaterThan(0);
        expect(chunk.estimatedTokens).toBeGreaterThan(0);
        expect(chunk.mathDensity).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(chunk.crossRefs)).toBe(true);
        expect(chunk.sequenceIndex).toBeGreaterThanOrEqual(0);
      }
    });

    it('sequenceIndex is monotonically increasing', () => {
      const { chunks } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);

      for (let i = 1; i < chunks.length; i++) {
        expect(chunks[i].sequenceIndex).toBe(chunks[i - 1].sequenceIndex + 1);
      }
    });
  });

  describe('JSONL validity', () => {
    it('each line of manifest JSONL is valid JSON', () => {
      const { jsonl } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);
      const lines = jsonl.split('\n').filter(l => l.trim().length > 0);

      expect(lines.length).toBeGreaterThan(0);

      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });

    it('manifest round-trips: write then read produces identical chunks', () => {
      const { chunks, jsonl } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);
      const lines = jsonl.split('\n').filter(l => l.trim().length > 0);
      const parsed = lines.map(l => JSON.parse(l));

      expect(parsed.length).toBe(chunks.length);

      for (let i = 0; i < chunks.length; i++) {
        expect(parsed[i].id).toBe(chunks[i].id);
        expect(parsed[i].chapter).toBe(chunks[i].chapter);
        expect(parsed[i].sequenceIndex).toBe(chunks[i].sequenceIndex);
      }
    });

    it('empty chapters produce no manifest lines', () => {
      const chapters: ChapterMap[] = [{
        chapterNumber: 1,
        title: 'Empty',
        partNumber: 1,
        startPage: 1,
        endPage: 5,
        rawText: '',
      }];
      const parts = createTestParts();

      const { chunks, jsonl } = generateManifest(chapters, parts, defaultConfig);

      // Empty chapter should produce no chunks
      expect(chunks.length).toBe(0);
      expect(jsonl.trim()).toBe('');
    });
  });

  describe('cross-reference integration', () => {
    it('crossRefs field populated from detectCrossRefs output', () => {
      const { chunks } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);

      // Chapter 3 has "See Chapter 1 and Chapter 2" in its text
      const ch3Chunks = chunks.filter(c => c.chapter === 3);
      if (ch3Chunks.length > 0) {
        const allRefs = ch3Chunks.flatMap(c => c.crossRefs);
        expect(allRefs).toContain('ch-01');
        expect(allRefs).toContain('ch-02');
      }
    });

    it('crossRefs are deduplicated within each chunk', () => {
      const { chunks } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);

      for (const chunk of chunks) {
        const uniqueRefs = new Set(chunk.crossRefs);
        expect(uniqueRefs.size).toBe(chunk.crossRefs.length);
      }
    });
  });

  describe('no chunk exceeds token limit', () => {
    it('all chunks within maxChunkTokens', () => {
      const { chunks } = generateManifest(createTestChapters(), createTestParts(), defaultConfig);

      for (const chunk of chunks) {
        expect(chunk.estimatedTokens).toBeLessThanOrEqual(8000);
      }
    });
  });
});

describe('extractExercises', () => {
  it('parses individual exercises with numbering', () => {
    const text = [
      'Exercises',
      '',
      '1. Compute 2 + 3.',
      '2. Prove that addition is associative.',
      '3. Show that multiplication distributes over addition.',
      '4. *Challenge: Prove the fundamental theorem of arithmetic.',
    ].join('\n');

    const result = extractExercises(text, 1);

    expect(result.exercises.length).toBe(4);
    expect(result.exercises[0].number).toBe(1);
    expect(result.exercises[3].number).toBe(4);
  });

  it('assigns difficulty tags based on position', () => {
    const exercises = Array.from({ length: 10 }, (_, i) =>
      `${i + 1}. Exercise ${i + 1}: Calculate something.`
    ).join('\n');
    const text = `Exercises\n\n${exercises}`;

    const result = extractExercises(text, 1);

    // First 30% should be basic
    expect(result.exercises[0].difficulty).toBe('basic');
    // Last 30% should be advanced
    expect(result.exercises[9].difficulty).toBe('advanced');
  });

  it('upgrades difficulty for "prove" and "show" keywords', () => {
    const text = [
      'Exercises',
      '',
      '1. Calculate 2 + 3.',
      '2. Prove that A implies B.',
      '3. Show that the limit exists.',
    ].join('\n');

    const result = extractExercises(text, 1);

    const proveExercise = result.exercises.find(e => e.text.includes('Prove'));
    expect(proveExercise?.difficulty).toBe('advanced');
  });

  it('marks star exercises as "challenge"', () => {
    const text = [
      'Exercises',
      '',
      '1. Compute the sum.',
      '2. *Challenge: Prove the Riemann hypothesis.',
    ].join('\n');

    const result = extractExercises(text, 1);

    const starExercise = result.exercises.find(e => e.text.includes('Challenge'));
    expect(starExercise?.difficulty).toBe('challenge');
  });

  it('extracts Build Lab content with intermediate difficulty', () => {
    const text = [
      'Build Lab',
      '',
      '1. Build a simple pendulum.',
      '2. Measure the period for different lengths.',
    ].join('\n');

    const result = extractExercises(text, 1);

    for (const ex of result.exercises) {
      expect(ex.difficulty).toBe('intermediate');
    }
  });

  it('returns empty array when no exercises found', () => {
    const text = 'This is just plain prose about mathematics.';
    const result = extractExercises(text, 1);

    expect(result.exercises).toEqual([]);
  });
});
